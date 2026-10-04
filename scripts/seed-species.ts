/**
 * Seed species — run after schema push:
 *   npm run seed:species
 *
 * Adds the full Forage for All catalog (~85 edibles), covering common
 * worldwide fruits/nuts/berries plus Sierra Nevada + California natives
 * (manzanita, toyon, oak acorns, pine nuts, bay laurel, etc.) that the
 * open-data aggregator in seed-listings.ts imports against.
 *
 * IDEMPOTENT: IDs are deterministic SHA-1 hashes of latinName, so
 * re-running the seed upserts instead of duplicating.
 *
 * On first run with `--wipe`, any orphan species from prior non-idempotent
 * seeds are deleted first so the catalog is clean.
 *
 * Extend freely — pull latin names from GBIF, seasonality from local sources.
 * Critical: always add toxicity / look-alike warnings for anything non-obvious.
 */

import { init } from "@instantdb/admin";
import "dotenv/config";
import { SPECIES, idForSpecies } from "./species-data";

const appId = process.env.INSTANT_APP_ID;
const adminToken = process.env.INSTANT_ADMIN_TOKEN;
if (!appId) {
  console.error("Set INSTANT_APP_ID in .env");
  process.exit(1);
}
if (!adminToken) {
  console.error("Set INSTANT_ADMIN_TOKEN in .env (InstantDB dashboard → App → Admin token).");
  process.exit(1);
}

const db = init({
  appId,
  adminToken,
  apiURI: process.env.INSTANT_API_URI ?? "https://instant-api.aws.realm.watch",
});
const WIPE_ORPHANS = process.argv.includes("--wipe");


async function wipeOrphans() {
  const canonicalIds = new Set(SPECIES.map((s) => idForSpecies(s.latinName)));
  const result = await db.query({ species: {} }) as { species?: Array<{ id: string; latinName?: string }> };
  const existing = result.species ?? [];
  const orphans = existing.filter((s) => !canonicalIds.has(s.id));

  if (orphans.length === 0) {
    console.log("No orphan species to wipe.");
    return;
  }

  console.log(`Wiping ${orphans.length} orphan species (pre-idempotent-seed duplicates)…`);
  const BATCH = 100;
  for (let i = 0; i < orphans.length; i += BATCH) {
    const slice = orphans.slice(i, i + BATCH);
    await db.transact(slice.map((o) => db.tx.species[o.id].delete()));
  }
}

async function main() {
  if (WIPE_ORPHANS) {
    await wipeOrphans();
  }

  console.log(`Seeding ${SPECIES.length} species (idempotent — re-runs upsert)…`);
  const txs = SPECIES.map((s) => db.tx.species[idForSpecies(s.latinName)].update(s));

  const BATCH = 100;
  for (let i = 0; i < txs.length; i += BATCH) {
    await db.transact(txs.slice(i, i + BATCH));
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
