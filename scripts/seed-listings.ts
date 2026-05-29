/**
 * seed-listings — multi-source open data aggregator
 *
 * Pulls from every open foraging/botany dataset we can reach and writes
 * deduplicated listings to InstantDB. Each listing is tagged with its
 * source so the app can render toggleable layers and show attribution.
 *
 * Usage:
 *   INSTANT_ADMIN_TOKEN=xxx npm run seed:listings            # full seed
 *   INSTANT_ADMIN_TOKEN=xxx npm run seed:listings -- --source inat  # one source
 *   INSTANT_ADMIN_TOKEN=xxx npm run seed:listings -- --region "Nevada County, CA"
 *
 * Sources integrated:
 *   inat         iNaturalist research-grade observations (CC BY-NC 4.0)
 *   gbif         GBIF occurrence records (CC0 / CC BY)
 *   osm          OpenStreetMap tagged trees/shrubs (ODbL)
 *   fallingfruit Falling Fruit v3 API (CC BY-SA 4.0)
 *   sf_trees     SF DataSF Street Tree inventory (PDDL)
 *   nyc_trees    NYC 2015 Street Tree Census (CC0)
 *   portland_trees Portland tree inventory (PDDL)
 *
 * Coord precision: 4 decimal places (~11m). All source data is already
 * public. User-submitted community pins use 3 dp (~110m) for privacy.
 */

import { init } from "@instantdb/admin";
import "dotenv/config";
import geohash from "ngeohash";
import { createHash } from "node:crypto";
import { SPECIES, idForSpecies, type Seed } from "./species-data";

/**
 * Species lookups, built once at startup from the shared species catalog so
 * both seed scripts stay aligned. Tried in order: latinName → genus → commonName.
 */
const SPECIES_BY_LATIN = new Map<string, Seed>();
const SPECIES_BY_GENUS = new Map<string, Seed>();
const SPECIES_BY_COMMON = new Map<string, Seed>();
for (const s of SPECIES) {
  SPECIES_BY_LATIN.set(s.latinName, s);
  const genus = s.latinName.split(" ")[0];
  if (!SPECIES_BY_GENUS.has(genus)) SPECIES_BY_GENUS.set(genus, s);
  SPECIES_BY_COMMON.set(s.commonName, s);
}

/** Look up the best-matching Seed from the catalog for an imported listing. */
function lookupSpecies(latinName?: string, commonName?: string): Seed | undefined {
  if (latinName && SPECIES_BY_LATIN.has(latinName)) return SPECIES_BY_LATIN.get(latinName);
  if (latinName) {
    const genus = latinName.split(" ")[0];
    if (SPECIES_BY_GENUS.has(genus)) return SPECIES_BY_GENUS.get(genus);
  }
  if (commonName && SPECIES_BY_COMMON.has(commonName)) return SPECIES_BY_COMMON.get(commonName);
  return undefined;
}

/**
 * Ripeness on the 0-4 scale based on proximity of `now` to the species'
 * seasonMonths window (1-12). Circular — December is adjacent to January.
 *
 *   in season                 → 3 (ripe)
 *   1 month before season     → 2 (soon)
 *   2 months before           → 1 (forming)
 *   1 month after season ends → 4 (past)
 *   anything else             → 0 (unripe)
 *
 * Falls back to 2 (neutral-approaching) when we have no season data.
 */
function computeRipeness(seasonMonths: number[] | undefined, now: Date): number {
  if (!seasonMonths || seasonMonths.length === 0) return 2;
  const month = now.getUTCMonth() + 1; // 1-12
  if (seasonMonths.includes(month)) return 3;

  // Circular distance helper (min of going forward or backward across Dec↔Jan)
  const circDist = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 12 - d);
  };

  // Signed distance: positive = season is ahead, negative = season just passed
  let nearestDist = Infinity;
  let nearestBefore = false; // true = season is in the past relative to `now`
  for (const sm of seasonMonths) {
    const d = circDist(month, sm);
    if (d < nearestDist) {
      nearestDist = d;
      // If walking forward from month lands on sm in fewer steps, season is ahead
      const forward = (sm - month + 12) % 12;
      const backward = (month - sm + 12) % 12;
      nearestBefore = backward < forward;
    }
  }

  if (nearestBefore) {
    return nearestDist <= 1 ? 4 : 0; // just past → 4, long past → 0 (next cycle)
  }
  // Season is ahead
  if (nearestDist === 1) return 2; // soon
  if (nearestDist === 2) return 1; // forming
  return 0;                         // unripe
}

/**
 * Deterministic UUID derived from a listing's sourceId (e.g. "inat:12345").
 * Same sourceId → same DB ID, so `.update()` becomes an upsert — re-running
 * the seed (or the weekly GitHub Action) refreshes listings in place instead
 * of duplicating them.
 *
 * Formatted as UUIDv5 per RFC 4122 §4.3 (name-based, SHA-1).
 */
function idForListing(sourceId: string): string {
  const hash = createHash("sha1").update(`forage-listing:${sourceId}`).digest("hex");
  const b = Buffer.from(hash.slice(0, 32), "hex");
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// ── Config ─────────────────────────────────────────────────────────────────

const APP_ID      = process.env.INSTANT_APP_ID ?? "32870e24-647d-452a-ab13-fdaa0a8d8564";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("Set INSTANT_ADMIN_TOKEN in .env — InstantDB dashboard → App → Admin token.");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

const args = process.argv.slice(2);
const filterSource = args.includes("--source") ? args[args.indexOf("--source") + 1] : null;
const filterRegion = args.includes("--region") ? args[args.indexOf("--region") + 1] : null;
const WIPE_ORPHANS = args.includes("--wipe");

// ── Regions ─────────────────────────────────────────────────────────────────
// bbox = [south, west, north, east]

interface Region {
  name: string;
  bbox: [number, number, number, number];
  iNatDepth: number;    // pages of iNat results (200 obs/page)
  gbifDepth: number;    // pages of GBIF results (300 obs/page)
  citySources?: string[]; // additional city-specific datasets
}

const REGIONS: Region[] = [
  {
    name: "Nevada County, CA",
    bbox: [39.07, -121.27, 39.45, -120.00],
    iNatDepth: 15,
    gbifDepth: 10,
  },
  {
    name: "San Francisco, CA",
    bbox: [37.70, -122.52, 37.83, -122.35],
    iNatDepth: 8,
    gbifDepth: 5,
    citySources: ["sf_trees"],
  },
  {
    name: "Portland, OR",
    bbox: [45.47, -122.73, 45.57, -122.55],
    iNatDepth: 8,
    gbifDepth: 5,
    citySources: ["portland_trees"],
  },
  {
    name: "Los Angeles, CA",
    bbox: [33.93, -118.50, 34.14, -118.15],
    iNatDepth: 8,
    gbifDepth: 5,
  },
  {
    name: "New York, NY",
    bbox: [40.63, -74.05, 40.85, -73.85],
    iNatDepth: 8,
    gbifDepth: 5,
    citySources: ["nyc_trees"],
  },
  {
    name: "London, UK",
    bbox: [51.44, -0.24, 51.56, 0.01],
    iNatDepth: 8,
    gbifDepth: 5,
  },
  {
    name: "Melbourne, AU",
    bbox: [-37.87, 144.88, -37.77, 145.02],
    iNatDepth: 8,
    gbifDepth: 5,
  },
  {
    name: "Berlin, DE",
    bbox: [52.45, 13.28, 52.57, 13.52],
    iNatDepth: 8,
    gbifDepth: 5,
  },
  {
    name: "Toronto, CA",
    bbox: [43.58, -79.64, 43.78, -79.27],
    iNatDepth: 8,
    gbifDepth: 5,
  },
];

// ── Edible taxa ──────────────────────────────────────────────────────────────

interface Taxon {
  name: string;       // latin name for API queries
  common: string;     // display name
  kind: string;       // our catalog kind
  gbifKey?: number;   // GBIF backbone taxon key (speeds up queries)
  inatId?: number;    // iNaturalist taxon ID (speeds up queries)
}

const TAXA: Taxon[] = [
  // Apples / pears
  { name: "Malus domestica",        common: "Apple",                   kind: "apple",  gbifKey: 3000687 },
  { name: "Malus sylvestris",       common: "Crabapple",               kind: "apple",  gbifKey: 3000683 },
  { name: "Pyrus communis",         common: "Pear",                    kind: "pear",   gbifKey: 3002243 },
  { name: "Pyrus pyrifolia",        common: "Asian Pear",              kind: "pear",   gbifKey: 3002241 },
  // Stone fruit
  { name: "Prunus persica",         common: "Peach",                   kind: "stone",  gbifKey: 2677936 },
  { name: "Prunus domestica",       common: "Plum",                    kind: "stone",  gbifKey: 2677940 },
  { name: "Prunus americana",       common: "Wild Plum",               kind: "stone",  gbifKey: 2677943 },
  { name: "Prunus avium",           common: "Cherry",                  kind: "stone",  gbifKey: 2677901 },
  { name: "Prunus armeniaca",       common: "Apricot",                 kind: "stone",  gbifKey: 2677932 },
  { name: "Prunus cerasifera",      common: "Cherry Plum",             kind: "stone",  gbifKey: 2677929 },
  // Citrus
  { name: "Citrus sinensis",        common: "Orange",                  kind: "citrus", gbifKey: 5413024 },
  { name: "Citrus limon",           common: "Lemon",                   kind: "citrus", gbifKey: 5413029 },
  { name: "Citrus paradisi",        common: "Grapefruit",              kind: "citrus", gbifKey: 5413025 },
  { name: "Citrus reticulata",      common: "Mandarin",                kind: "citrus", gbifKey: 5413030 },
  { name: "Citrus japonica",        common: "Kumquat",                 kind: "citrus", gbifKey: 5413019 },
  // Figs and relatives
  { name: "Ficus carica",           common: "Fig",                     kind: "fig",    gbifKey: 3085036 },
  { name: "Diospyros kaki",         common: "Persimmon",               kind: "fig",    gbifKey: 5407521 },
  { name: "Eriobotrya japonica",    common: "Loquat",                  kind: "fig",    gbifKey: 3018895 },
  { name: "Punica granatum",        common: "Pomegranate",             kind: "fig",    gbifKey: 5417227 },
  // Berries
  { name: "Morus alba",             common: "White Mulberry",          kind: "berry",  gbifKey: 3083534 },
  { name: "Morus nigra",            common: "Black Mulberry",          kind: "berry",  gbifKey: 3083535 },
  { name: "Rubus fruticosus",       common: "Blackberry",              kind: "berry",  gbifKey: 3020820 },
  { name: "Rubus idaeus",           common: "Raspberry",               kind: "berry",  gbifKey: 2986947 },
  { name: "Rubus parviflorus",      common: "Thimbleberry",            kind: "berry",  gbifKey: 3020829 },
  { name: "Rubus ursinus",          common: "California Blackberry",   kind: "berry",  gbifKey: 3020847 },
  { name: "Rubus spectabilis",      common: "Salmonberry",             kind: "berry",  gbifKey: 3020825 },
  { name: "Sambucus nigra",         common: "Elderberry",              kind: "berry",  gbifKey: 2889399 },
  { name: "Sambucus mexicana",      common: "Blue Elderberry",         kind: "berry",  gbifKey: 2889409 },
  { name: "Sambucus racemosa",      common: "Red Elderberry",          kind: "berry",  gbifKey: 2889390 },
  { name: "Amelanchier alnifolia",  common: "Saskatoon Serviceberry",  kind: "berry",  gbifKey: 3024609 },
  { name: "Vaccinium corymbosum",   common: "Blueberry",               kind: "berry",  gbifKey: 5414148 },
  { name: "Fragaria vesca",         common: "Wild Strawberry",         kind: "berry",  gbifKey: 5004251 },
  { name: "Fragaria chiloensis",    common: "Beach Strawberry",        kind: "berry",  gbifKey: 5004248 },
  { name: "Ribes californicum",     common: "California Gooseberry",   kind: "berry",  gbifKey: 3085754 },
  { name: "Ribes nevadense",        common: "Sierra Currant",          kind: "berry",  gbifKey: 3085716 },
  { name: "Ribes sanguineum",       common: "Red Flowering Currant",   kind: "berry",  gbifKey: 3085729 },
  // Sierra Nevada / California natives
  { name: "Arctostaphylos manzanita", common: "Manzanita",            kind: "berry",  gbifKey: 3020399 },
  { name: "Arctostaphylos uva-ursi",  common: "Kinnikinnick",         kind: "berry",  gbifKey: 3020384 },
  { name: "Heteromeles arbutifolia",  common: "Toyon",                kind: "berry",  gbifKey: 3001094 },
  { name: "Umbellularia californica", common: "California Bay Laurel",kind: "herb",   gbifKey: 3041204 },
  { name: "Vitis californica",      common: "California Wild Grape",   kind: "grape",  gbifKey: 3086093 },
  { name: "Rosa californica",       common: "California Rose Hips",    kind: "flower", gbifKey: 2888629 },
  { name: "Rosa canina",            common: "Rose Hips",               kind: "flower", gbifKey: 2888630 },
  // Nuts
  { name: "Quercus kelloggii",      common: "Black Oak (acorns)",      kind: "nut",    gbifKey: 2878549 },
  { name: "Quercus garryana",       common: "Oregon White Oak (acorns)",kind:"nut",   gbifKey: 2878551 },
  { name: "Quercus lobata",         common: "Valley Oak (acorns)",     kind: "nut",    gbifKey: 2878554 },
  { name: "Quercus agrifolia",      common: "Coast Live Oak (acorns)", kind: "nut",    gbifKey: 2878558 },
  { name: "Juglans regia",          common: "Walnut",                  kind: "nut",    gbifKey: 3073619 },
  { name: "Juglans nigra",          common: "Black Walnut",            kind: "nut",    gbifKey: 3073617 },
  { name: "Carya illinoinensis",    common: "Pecan",                   kind: "nut",    gbifKey: 3073564 },
  { name: "Corylus avellana",       common: "Hazelnut",                kind: "nut",    gbifKey: 3022798 },
  { name: "Castanea sativa",        common: "Chestnut",                kind: "nut",    gbifKey: 3022802 },
  { name: "Pinus sabiniana",        common: "Grey Pine (pine nuts)",   kind: "nut",    gbifKey: 5285791 },
  { name: "Pinus lambertiana",      common: "Sugar Pine (pine nuts)",  kind: "nut",    gbifKey: 5285793 },
  { name: "Pinus edulis",           common: "Pinyon Pine (pine nuts)", kind: "nut",    gbifKey: 5285794 },
  // Herbs / greens
  { name: "Taraxacum officinale",   common: "Dandelion",               kind: "herb",   gbifKey: 5357089 },
  { name: "Urtica dioica",          common: "Stinging Nettle",         kind: "herb",   gbifKey: 5361909 },
  { name: "Claytonia perfoliata",   common: "Miner's Lettuce",         kind: "herb",   gbifKey: 3085154 },
  { name: "Foeniculum vulgare",     common: "Fennel",                  kind: "herb",   gbifKey: 5358131 },
  { name: "Allium ursinum",         common: "Wild Garlic",             kind: "herb",   gbifKey: 2857817 },
  { name: "Allium triquetrum",      common: "Three-cornered Leek",     kind: "herb",   gbifKey: 2857821 },
  { name: "Portulaca oleracea",     common: "Purslane",                kind: "herb",   gbifKey: 3084745 },
  { name: "Chenopodium album",      common: "Lamb's Quarters",         kind: "herb",   gbifKey: 3085034 },
  { name: "Mentha piperita",        common: "Mint",                    kind: "herb",   gbifKey: 5358071 },
  // Grapes
  { name: "Vitis vinifera",         common: "Grape",                   kind: "grape",  gbifKey: 3086098 },
  { name: "Vitis labrusca",         common: "Fox Grape",               kind: "grape",  gbifKey: 3086095 },
  // Other
  { name: "Opuntia ficus-indica",   common: "Prickly Pear",            kind: "veg",    gbifKey: 5405522 },
  { name: "Asparagus officinalis",  common: "Wild Asparagus",          kind: "veg",    gbifKey: 2767028 },
];

// Map OSM species tags → our catalog
const OSM_SPECIES_MAP: Record<string, { common: string; kind: string }> = {};
for (const t of TAXA) {
  const key = t.name.toLowerCase();
  OSM_SPECIES_MAP[key] = { common: t.common, kind: t.kind };
  // Also index by genus
  const genus = key.split(" ")[0];
  if (!OSM_SPECIES_MAP[genus]) OSM_SPECIES_MAP[genus] = { common: t.common, kind: t.kind };
  // Common name
  OSM_SPECIES_MAP[t.common.toLowerCase().split(" ")[0]] = { common: t.common, kind: t.kind };
}

// ── Shared types ─────────────────────────────────────────────────────────────

interface PlantPin {
  lat: number;
  lng: number;
  common: string;
  kind: string;
  source: string;
  sourceId: string;
  notes?: string;
  /** Latin name preserved so we can look up seasonMonths at write time. */
  latinName?: string;
}

function fuzz(n: number) {
  return Math.round(n * 10000) / 10000;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Source: iNaturalist ───────────────────────────────────────────────────────

async function fetchINat(taxon: Taxon, bbox: [number, number, number, number], maxPages: number): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const pins: PlantPin[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("https://api.inaturalist.org/v1/observations");
    url.searchParams.set("taxon_name", taxon.name);
    url.searchParams.set("quality_grade", "research");
    url.searchParams.set("swlat", String(s));
    url.searchParams.set("swlng", String(w));
    url.searchParams.set("nelat", String(n));
    url.searchParams.set("nelng", String(e));
    url.searchParams.set("per_page", "200");
    url.searchParams.set("page", String(page));
    url.searchParams.set("mappable", "true");

    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": "ForageForAll/0.1 (github.com/techempower-org/forageforall)" },
    });
    if (!resp.ok) break;

    const data = await resp.json() as {
      total_results: number;
      results: Array<{
        id: number;
        geoprivacy?: string;
        taxon_geoprivacy?: string;
        location?: string;
        place_guess?: string;
      }>;
    };

    for (const obs of data.results) {
      if (obs.geoprivacy === "obscured" || obs.taxon_geoprivacy === "obscured") continue;
      if (!obs.location) continue;
      const [latStr, lngStr] = obs.location.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng)) continue;
      const place = obs.place_guess ? ` — ${obs.place_guess}` : "";
      pins.push({ lat, lng, common: taxon.common, kind: taxon.kind, source: "inat", sourceId: `inat:${obs.id}`, notes: obs.place_guess ?? undefined, latinName: taxon.name });
    }

    if (page * 200 >= Math.min(data.total_results, maxPages * 200)) break;
    await sleep(1100); // iNat rate limit
  }

  return pins;
}

// ── Source: GBIF ─────────────────────────────────────────────────────────────

async function fetchGBIF(taxon: Taxon, bbox: [number, number, number, number], maxPages: number): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const pins: PlantPin[] = [];

  for (let page = 0; page < maxPages; page++) {
    const url = new URL("https://api.gbif.org/v1/occurrence/search");
    if (taxon.gbifKey) {
      url.searchParams.set("taxonKey", String(taxon.gbifKey));
    } else {
      url.searchParams.set("scientificName", taxon.name);
    }
    url.searchParams.set("decimalLatitude", `${s},${n}`);
    url.searchParams.set("decimalLongitude", `${w},${e}`);
    url.searchParams.set("hasCoordinate", "true");
    url.searchParams.set("hasGeospatialIssue", "false");
    url.searchParams.set("occurrenceStatus", "PRESENT");
    url.searchParams.set("limit", "300");
    url.searchParams.set("offset", String(page * 300));

    const resp = await fetch(url.toString());
    if (!resp.ok) break;

    const data = await resp.json() as {
      endOfRecords: boolean;
      results: Array<{
        key: number;
        decimalLatitude?: number;
        decimalLongitude?: number;
        coordinateUncertaintyInMeters?: number;
      }>;
    };

    for (const rec of data.results) {
      if (!rec.decimalLatitude || !rec.decimalLongitude) continue;
      // Skip records with very poor coordinate precision
      if (rec.coordinateUncertaintyInMeters && rec.coordinateUncertaintyInMeters > 1000) continue;
      pins.push({
        lat: rec.decimalLatitude,
        lng: rec.decimalLongitude,
        common: taxon.common,
        kind: taxon.kind,
        source: "gbif",
        sourceId: `gbif:${rec.key}`,
        latinName: taxon.name,
      });
    }

    if (data.endOfRecords) break;
    await sleep(300);
  }

  return pins;
}

// ── Source: OpenStreetMap (Overpass) ─────────────────────────────────────────

async function fetchOSM(bbox: [number, number, number, number]): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const query = `
    [out:json][timeout:30];
    (
      node["natural"="tree"]["species"](${s},${w},${n},${e});
      node["natural"="tree"]["species:en"](${s},${w},${n},${e});
      node["natural"="tree"]["taxon"](${s},${w},${n},${e});
      node["natural"="shrub"]["species"](${s},${w},${n},${e});
      node["natural"="shrub"]["species:en"](${s},${w},${n},${e});
      node["plant:species"](${s},${w},${n},${e});
    );
    out body;
  `;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!resp.ok) return [];

  const data = await resp.json() as {
    elements: Array<{ id: number; lat: number; lon: number; tags: Record<string, string> }>;
  };

  const pins: PlantPin[] = [];
  for (const el of data.elements) {
    const tags = el.tags ?? {};
    const candidates = [tags["species"], tags["species:en"], tags["taxon"], tags["name"]]
      .filter(Boolean)
      .map((s) => s!.toLowerCase().trim());

    let match: { common: string; kind: string } | undefined;
    for (const raw of candidates) {
      match = OSM_SPECIES_MAP[raw] ?? OSM_SPECIES_MAP[raw.split(" ")[0]];
      if (match) break;
    }
    if (!match) continue;

    pins.push({
      lat: el.lat,
      lng: el.lon,
      common: match.common,
      kind: match.kind,
      source: "osm",
      sourceId: `osm:${el.id}`,
    });
  }
  return pins;
}

// ── Source: Falling Fruit v3 ─────────────────────────────────────────────────
// Requires API key — set FALLING_FRUIT_KEY in .env if you have one.
// Sign up at https://fallingfruit.org/api

async function fetchFallingFruit(bbox: [number, number, number, number]): Promise<PlantPin[]> {
  const key = process.env.FALLING_FRUIT_KEY;
  if (!key) return [];

  const [s, w, n, e] = bbox;
  const url = new URL("https://fallingfruit.org/api/0.3/locations");
  url.searchParams.set("api_key", key);
  url.searchParams.set("bounds", `${s},${w},${n},${e}`);
  url.searchParams.set("muni", "true");
  url.searchParams.set("limit", "500");

  const resp = await fetch(url.toString());
  if (!resp.ok) return [];

  const data = await resp.json() as Array<{
    id: number;
    lat: number;
    lng: number;
    description?: string;
    access?: number;
    type_names?: string[];
  }>;

  const pins: PlantPin[] = [];
  for (const loc of data) {
    if (loc.access === 2) continue; // skip private
    const typeName = loc.type_names?.[0]?.toLowerCase() ?? "";
    const match = OSM_SPECIES_MAP[typeName] ?? OSM_SPECIES_MAP[typeName.split(" ")[0]];
    if (!match) continue;
    pins.push({
      lat: loc.lat,
      lng: loc.lng,
      common: match.common,
      kind: match.kind,
      source: "fallingfruit",
      sourceId: `ff:${loc.id}`,
      notes: loc.description,
    });
  }
  return pins;
}

// ── Source: SF DataSF Street Trees ───────────────────────────────────────────
// Filtered to edible species only.

const SF_EDIBLE_SPECIES = new Set([
  "Prunus serrulata", "Prunus cerasifera", "Prunus domestica",
  "Malus sylvestris", "Malus domestica", "Pyrus kawakamii",
  "Eriobotrya japonica", "Ficus carica", "Morus alba", "Morus nigra",
  "Juglans regia", "Citrus sinensis", "Diospyros kaki",
]);

async function fetchSFTrees(bbox: [number, number, number, number]): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const url = new URL("https://data.sfgov.org/resource/tkzw-k3nq.json");
  url.searchParams.set("$limit", "50000");
  url.searchParams.set("$where", `within_box(the_geom, ${s}, ${w}, ${n}, ${e})`);
  url.searchParams.set("$select", "treeid,latitude,longitude,qspecies");

  const resp = await fetch(url.toString());
  if (!resp.ok) return [];

  const data = await resp.json() as Array<{
    treeid: string;
    latitude?: string;
    longitude?: string;
    qspecies?: string;
  }>;

  const pins: PlantPin[] = [];
  for (const tree of data) {
    if (!tree.latitude || !tree.longitude) continue;
    const speciesRaw = (tree.qspecies ?? "").split("::")[0].trim();
    const match = OSM_SPECIES_MAP[speciesRaw.toLowerCase()]
      ?? OSM_SPECIES_MAP[speciesRaw.toLowerCase().split(" ")[0]];
    if (!match && !SF_EDIBLE_SPECIES.has(speciesRaw)) continue;
    pins.push({
      lat: parseFloat(tree.latitude),
      lng: parseFloat(tree.longitude),
      common: match?.common ?? speciesRaw,
      kind: match?.kind ?? "fruit",
      source: "sf_trees",
      sourceId: `sf:${tree.treeid}`,
      latinName: speciesRaw,
    });
  }
  return pins;
}

// ── Source: NYC Street Tree Census ────────────────────────────────────────────

const NYC_EDIBLE_GENERA = new Set(["Malus", "Prunus", "Pyrus", "Morus", "Juglans"]);

async function fetchNYCTrees(bbox: [number, number, number, number]): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const url = new URL("https://data.cityofnewyork.us/resource/uvpi-gqnh.json");
  url.searchParams.set("$limit", "50000");
  url.searchParams.set("$where", `latitude > ${s} AND latitude < ${n} AND longitude > ${w} AND longitude < ${e}`);
  url.searchParams.set("$select", "tree_id,latitude,longitude,spc_latin,spc_common,status");

  const resp = await fetch(url.toString());
  if (!resp.ok) return [];

  const data = await resp.json() as Array<{
    tree_id: string;
    latitude?: string;
    longitude?: string;
    spc_latin?: string;
    spc_common?: string;
    status?: string;
  }>;

  const pins: PlantPin[] = [];
  for (const tree of data) {
    if (!tree.latitude || !tree.longitude) continue;
    if (tree.status !== "Alive") continue;
    const genus = (tree.spc_latin ?? "").split(" ")[0];
    if (!NYC_EDIBLE_GENERA.has(genus)) continue;
    const latin = (tree.spc_latin ?? "").toLowerCase();
    const match = OSM_SPECIES_MAP[latin] ?? OSM_SPECIES_MAP[latin.split(" ")[0]];
    if (!match) continue;
    pins.push({
      lat: parseFloat(tree.latitude),
      lng: parseFloat(tree.longitude),
      common: match.common,
      kind: match.kind,
      source: "nyc_trees",
      sourceId: `nyc:${tree.tree_id}`,
      latinName: tree.spc_latin,
    });
  }
  return pins;
}

// ── Source: Portland Trees ────────────────────────────────────────────────────

async function fetchPortlandTrees(bbox: [number, number, number, number]): Promise<PlantPin[]> {
  const [s, w, n, e] = bbox;
  const url = new URL("https://opendata.arcgis.com/datasets/c438d70cef49472d9e7b5be0543b6ee5_83.geojson");
  // Portland's tree inventory — filter by bbox
  const resp = await fetch(url.toString());
  if (!resp.ok) return [];
  const data = await resp.json() as {
    features: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: { TreeID?: string; SpeciesName?: string; GenusName?: string; Condition?: string };
    }>;
  };

  const pins: PlantPin[] = [];
  for (const feat of data.features ?? []) {
    const coords = feat.geometry?.coordinates;
    if (!coords) continue;
    const [lng, lat] = coords;
    if (lat < s || lat > n || lng < w || lng > e) continue;
    const props = feat.properties ?? {};
    if (props.Condition === "Dead") continue;
    const latin = (props.SpeciesName ?? "").toLowerCase();
    const match = OSM_SPECIES_MAP[latin] ?? OSM_SPECIES_MAP[(props.GenusName ?? "").toLowerCase()];
    if (!match) continue;
    pins.push({
      lat,
      lng,
      common: match.common,
      kind: match.kind,
      source: "portland_trees",
      sourceId: `pdx:${props.TreeID}`,
      latinName: props.SpeciesName,
    });
  }
  return pins;
}

// ── Write to InstantDB ────────────────────────────────────────────────────────

async function writePins(pins: PlantPin[], regionName: string) {
  if (pins.length === 0) return 0;

  // Deduplicate by sourceId first, then by fuzzed location + kind
  const seenId = new Set<string>();
  const seenLoc = new Set<string>();
  const unique: PlantPin[] = [];
  for (const p of pins) {
    if (seenId.has(p.sourceId)) continue;
    seenId.add(p.sourceId);
    const locKey = `${fuzz(p.lat)},${fuzz(p.lng)},${p.kind}`;
    if (seenLoc.has(locKey)) continue;
    seenLoc.add(locKey);
    unique.push(p);
  }

  const now = new Date();
  const txs = unique.flatMap((p) => {
    const lat = fuzz(p.lat);
    const lng = fuzz(p.lng);
    const species = lookupSpecies(p.latinName, p.common);
    const listingId = idForListing(p.sourceId);

    // Denormalise kind onto the listing so map filters work without a join.
    // Use the catalog kind when we matched a species, otherwise fall back to
    // the taxon's kind from the import mapper.
    const kind = species?.kind ?? p.kind;

    const update = db.tx.listings[listingId].update({
      lat,
      lng,
      geohash5: geohash.encode(lat, lng, 5),
      geohash7: geohash.encode(lat, lng, 7),
      title: `${p.common} — ${regionName}`,
      notes: p.notes,
      accessFlags: { public: true },
      currentRipeness: computeRipeness(species?.seasonMonths, now),
      reportCount: 0,
      stillThereScore: 1,
      status: "active",
      kind,
      source: p.source,
      sourceId: p.sourceId,
      sourceSyncedAt: now,
      createdAt: now,
    });

    // If we matched a species in the catalog, link the listing to it so
    // the ListingCard/detail/calendar UIs can show photos, season strips, etc.
    if (species) {
      return [update.link({ species: idForSpecies(species.latinName) })];
    }
    return [update];
  });

  for (let i = 0; i < txs.length; i += 100) {
    await db.transact(txs.slice(i, i + 100) as Parameters<typeof db.transact>[0]);
  }
  return unique.length;
}

/**
 * Wipe open-data listings whose DB id doesn't match the deterministic
 * scheme for their sourceId. These are leftovers from pre-idempotent
 * seed runs. Community pins (source="community" or null) are never touched.
 */
async function wipeOrphans() {
  const result = await db.query({ listings: {} }) as {
    listings?: Array<{ id: string; source?: string | null; sourceId?: string | null }>;
  };
  const all = result.listings ?? [];

  const orphans = all.filter((l) => {
    const src = l.source ?? null;
    // Never touch community pins or listings without a source
    if (!src || src === "community") return false;
    // Orphan if id is not what we'd deterministically generate for its sourceId
    if (!l.sourceId) return true; // sourced listing with no sourceId → delete, can't re-create cleanly
    return l.id !== idForListing(l.sourceId);
  });

  if (orphans.length === 0) {
    console.log("No orphan listings to wipe.");
    return;
  }

  console.log(`Wiping ${orphans.length} orphan listings (pre-idempotent-seed duplicates)…`);
  const BATCH = 100;
  for (let i = 0; i < orphans.length; i += BATCH) {
    const slice = orphans.slice(i, i + BATCH);
    await db.transact(slice.map((o) => db.tx.listings[o.id].delete()));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Forage for All — multi-source data seed");
  console.log("Sources: iNaturalist · GBIF · OpenStreetMap · Falling Fruit · City trees\n");

  if (WIPE_ORPHANS) {
    await wipeOrphans();
    console.log();
  }

  const regions = filterRegion
    ? REGIONS.filter((r) => r.name === filterRegion)
    : REGIONS;

  let grandTotal = 0;

  for (const region of regions) {
    console.log(`\n══ ${region.name} ══`);
    const allPins: PlantPin[] = [];

    // iNaturalist — best for wild plants and rural areas
    if (!filterSource || filterSource === "inat") {
      let inatCount = 0;
      for (const taxon of TAXA) {
        const pins = await fetchINat(taxon, region.bbox, region.iNatDepth);
        inatCount += pins.length;
        allPins.push(...pins);
      }
      console.log(`  iNaturalist:      ${inatCount}`);
    }

    // GBIF — large scientific occurrence DB
    if (!filterSource || filterSource === "gbif") {
      let gbifCount = 0;
      for (const taxon of TAXA) {
        const pins = await fetchGBIF(taxon, region.bbox, region.gbifDepth);
        gbifCount += pins.length;
        allPins.push(...pins);
        await sleep(200);
      }
      console.log(`  GBIF:             ${gbifCount}`);
    }

    // OpenStreetMap
    if (!filterSource || filterSource === "osm") {
      const osm = await fetchOSM(region.bbox);
      console.log(`  OpenStreetMap:    ${osm.length}`);
      allPins.push(...osm);
    }

    // Falling Fruit (if API key set)
    if (!filterSource || filterSource === "fallingfruit") {
      if (process.env.FALLING_FRUIT_KEY) {
        const ff = await fetchFallingFruit(region.bbox);
        console.log(`  Falling Fruit:    ${ff.length}`);
        allPins.push(...ff);
      }
    }

    // City-specific datasets
    for (const citySource of region.citySources ?? []) {
      if (filterSource && filterSource !== citySource) continue;
      let cityPins: PlantPin[] = [];
      if (citySource === "sf_trees")      cityPins = await fetchSFTrees(region.bbox);
      if (citySource === "nyc_trees")     cityPins = await fetchNYCTrees(region.bbox);
      if (citySource === "portland_trees") cityPins = await fetchPortlandTrees(region.bbox);
      console.log(`  ${citySource}: ${cityPins.length}`);
      allPins.push(...cityPins);
    }

    const written = await writePins(allPins, region.name);
    console.log(`  ✓ Written (after dedup): ${written}`);
    grandTotal += written;
  }

  console.log(`\nTotal listings seeded: ${grandTotal}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
