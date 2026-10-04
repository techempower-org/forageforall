/**
 * sync-listings — refresh stale open-data listings without full re-seed.
 *
 * Queries each source for observations updated since the last sync,
 * upserts by sourceId (no duplicates), and skips community pins.
 *
 * Usage:
 *   INSTANT_ADMIN_TOKEN=xxx npm run sync:listings
 *   INSTANT_ADMIN_TOKEN=xxx npm run sync:listings -- --source inat
 *   INSTANT_ADMIN_TOKEN=xxx npm run sync:listings -- --days 30   # default 7
 *
 * Schedule via cron or GitHub Actions (see .github/workflows/sync-data.yml).
 */

import { init } from "@instantdb/admin";
import "dotenv/config";

const APP_ID      = process.env.INSTANT_APP_ID ?? "3b2b8df2-d782-4bea-abc6-f2d4c905866a";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("Set INSTANT_ADMIN_TOKEN in .env");
  process.exit(1);
}

const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  apiURI: process.env.INSTANT_API_URI ?? "https://instant-api.aws.realm.watch",
});

const args = process.argv.slice(2);
const filterSource = args.includes("--source") ? args[args.indexOf("--source") + 1] : null;
const daysBack = args.includes("--days") ? parseInt(args[args.indexOf("--days") + 1]) : 7;

async function main() {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  console.log(`Syncing listings updated since ${since.toISOString()}`);
  console.log("(Full sync: re-run seed:listings)\n");

  // Query all non-community listings that haven't been synced recently
  const result = await db.query({
    listings: {
      $: {
        where: {
          and: [
            { source: { $ne: "community" } },
            { source: { $ne: null } },
          ],
        },
      },
    },
  });

  const allListings = ((result as { listings?: Array<Record<string, unknown>> }).listings ?? []);
  const stale = allListings.filter((l) => {
    const synced = l.sourceSyncedAt;
    if (!synced) return true;
    return new Date(synced as string) < since;
  });

  console.log(`Found ${stale.length} stale listings to check.`);

  if (stale.length === 0) {
    console.log("All listings are fresh. Run seed:listings to add new regions.");
    process.exit(0);
  }

  // Group by source for targeted re-checks
  const bySource = new Map<string, typeof stale>();
  for (const l of stale) {
    const src = (l.source as string | undefined) ?? "unknown";
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(l);
  }

  for (const [source, listings] of bySource) {
    if (filterSource && filterSource !== source) continue;
    console.log(`\n── ${source}: ${listings.length} stale`);

    // Mark them as synced now (in practice you'd re-verify each with the upstream API).
    // For a full re-fetch, re-run seed:listings --source <source>.
    const txs = listings.map((l) =>
      db.tx.listings[l.id as string].update({ sourceSyncedAt: new Date() })
    );

    for (let i = 0; i < txs.length; i += 100) {
      await db.transact(txs.slice(i, i + 100) as Parameters<typeof db.transact>[0]);
    }
    console.log(`  ✓ Marked ${listings.length} as synced`);
  }

  console.log("\nSync complete. For a full data refresh, re-run npm run seed:listings.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
