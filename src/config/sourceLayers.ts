/**
 * Source layers — every upstream data source we aggregate.
 *
 * Each listing in the DB stores a `source` field. The map screen renders
 * each source as a toggleable layer with its own pin color and attribution.
 *
 * Order here = order in the layer control UI.
 */

import { palette } from "../theme/tokens";

export type SourceKey =
  | "community"
  | "inat"
  | "gbif"
  | "osm"
  | "fallingfruit"
  | "sf_trees"
  | "nyc_trees"
  | "portland_trees";

export interface SourceLayer {
  key: SourceKey;
  label: string;
  shortLabel: string;      // for the legend pill
  description: string;
  color: string;           // pin accent color
  license: string;
  attribution: string;
  attributionUrl: string;
  /** Off by default? false = on */
  defaultOff?: boolean;
}

export const SOURCE_LAYERS: SourceLayer[] = [
  {
    key: "community",
    label: "Community pins",
    shortLabel: "Community",
    description: "Pins dropped by the Forage for All community. Coordinates fuzzed to ~110m.",
    color: palette.moss,          // #4A7C2E
    license: "AGPLv3 (code), CC BY-SA 4.0 (data)",
    attribution: "Forage for All community",
    attributionUrl: "https://github.com/techempower-org/forageforall",
  },
  {
    key: "inat",
    label: "iNaturalist observations",
    shortLabel: "iNaturalist",
    description: "Research-grade plant observations verified by the iNaturalist community.",
    color: palette.terra,         // #B8573A
    license: "CC BY-NC 4.0",
    attribution: "iNaturalist contributors",
    attributionUrl: "https://www.inaturalist.org/",
  },
  {
    key: "gbif",
    label: "GBIF occurrences",
    shortLabel: "GBIF",
    description: "Scientific occurrence records aggregated by the Global Biodiversity Information Facility.",
    color: palette.sun,           // #E8A838
    license: "CC0 / CC BY 4.0",
    attribution: "GBIF.org",
    attributionUrl: "https://www.gbif.org/",
    defaultOff: true,
  },
  {
    key: "osm",
    label: "OpenStreetMap trees",
    shortLabel: "OSM",
    description: "Fruit and nut trees tagged by OpenStreetMap contributors.",
    color: palette.berry,         // #7A2E4A
    license: "ODbL",
    attribution: "© OpenStreetMap contributors",
    attributionUrl: "https://www.openstreetmap.org/copyright",
  },
  {
    key: "fallingfruit",
    label: "Falling Fruit",
    shortLabel: "Falling Fruit",
    description: "Public-land foraging locations contributed to Falling Fruit.",
    color: palette.bark,          // #6B5440
    license: "CC BY-SA 4.0",
    attribution: "fallingfruit.org",
    attributionUrl: "https://fallingfruit.org/",
  },
  {
    key: "sf_trees",
    label: "SF street trees",
    shortLabel: "SF trees",
    description: "Edible species from the San Francisco DataSF street tree inventory.",
    color: "#2B8C8C",
    license: "PDDL",
    attribution: "DataSF",
    attributionUrl: "https://data.sfgov.org/",
    defaultOff: true,
  },
  {
    key: "nyc_trees",
    label: "NYC street trees",
    shortLabel: "NYC trees",
    description: "Edible genera from the 2015 NYC Street Tree Census.",
    color: "#3E7CB8",
    license: "CC0",
    attribution: "NYC Open Data",
    attributionUrl: "https://data.cityofnewyork.us/",
    defaultOff: true,
  },
  {
    key: "portland_trees",
    label: "Portland trees",
    shortLabel: "PDX trees",
    description: "Edible species from the Portland tree inventory.",
    color: "#8A6E3E",
    license: "PDDL",
    attribution: "Portland Maps",
    attributionUrl: "https://www.portlandmaps.com/",
    defaultOff: true,
  },
];

export const SOURCE_BY_KEY: Record<SourceKey, SourceLayer> = Object.fromEntries(
  SOURCE_LAYERS.map((s) => [s.key, s]),
) as Record<SourceKey, SourceLayer>;

export function getSourceColor(source: string | null | undefined): string {
  const key = (source ?? "community") as SourceKey;
  return SOURCE_BY_KEY[key]?.color ?? palette.moss;
}

export function getDefaultEnabledSources(): SourceKey[] {
  return SOURCE_LAYERS.filter((s) => !s.defaultOff).map((s) => s.key);
}
