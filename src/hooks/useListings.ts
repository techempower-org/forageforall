/**
 * useListings — viewport-aware query over listings.
 *
 * Usage:
 *   const { listings, isLoading } = useListings(region, { ripeNow: true });
 *
 * Two query modes, chosen by zoom level:
 *
 *  - **Tight zoom** — when the viewport is covered by a small number of
 *    geohash5 cells, we query `geohash5 { $in: cells }`. This is exact and
 *    complete: every pin in view is returned. geohash5 is indexed for
 *    equality, so a small `$in` is fast.
 *
 *  - **Zoomed out** — when the cover would be large, we DON'T enumerate
 *    cells. The backend's geohash5 index is equality-only: a big `$in`
 *    (≥~360 cells) and any `$like` prefix scan both time out, and lat/lng
 *    range operators aren't indexed on this app. So instead we query by
 *    the indexed `status` field with a `limit` and filter to the viewport
 *    rectangle client-side (every listing carries lat/lng). The map
 *    clusters the result, so a bounded sample reads as full density.
 *
 * The old code sliced the geohash5 cover to 64 cells unconditionally —
 * which silently clipped any zoomed-out view to a thin strip on one edge
 * (`ngeohash.bboxes` returns cells row-major), so pins vanished entirely
 * when you zoomed out. See lib/geo.ts.
 */

import { useMemo } from "react";
import { db } from "../db/client";
import {
  geohash5CellsForRegion,
  regionBounds,
  withinBounds,
} from "../lib/geo";

export type Region = {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
};

export type ListingFilter = {
  ripeNow?: boolean;
  kinds?: string[];
  inSeason?: number; // month 1..12
  sources?: string[]; // e.g. ["community", "inat", "osm"] — empty = show all
};

// Max geohash5 cells we'll put in a single `$in`. The backend serves a
// small `$in` in well under a second but times out around a few hundred
// cells, so anything bigger falls back to the zoomed-out path.
const MAX_IN_CELLS = 64;
// Pin budget for the zoomed-out path. 500 rows incl. species/createdBy
// links return in ~2s against the live backend; the cluster layer
// collapses them, so this caps payload without thinning the visible map.
const WIDE_LIMIT = 500;

export function useListings(region: Region | null, filter: ListingFilter = {}) {
  const cells = useMemo(
    () => (region ? geohash5CellsForRegion(region) : []),
    [region?.lat, region?.lng, region?.latDelta, region?.lngDelta],
  );

  // Tight zoom only when the whole viewport fits in a small cell set.
  const useCells = cells.length > 0 && cells.length <= MAX_IN_CELLS;

  const where: any = { status: "active" };
  if (useCells) where.geohash5 = { $in: cells };
  if (filter.ripeNow) where.currentRipeness = { $gte: 3 };

  // We don't order server-side: lastConfirmedAt is sparsely populated on
  // open-data imports and InstantDB requires the field to be both indexed
  // and typed for server-side ordering. The map clusters pins visually,
  // so order has minimal visible impact; we sort client-side where it matters.
  const { data, isLoading, error } = db.useQuery(
    region
      ? {
          listings: {
            $: {
              where,
              limit: useCells ? 500 : WIDE_LIMIT,
            },
            species: {},
            createdBy: {},
          },
        }
      : null,
  );

  const listings = (data?.listings ?? []) as any[];

  const filtered = useMemo(() => {
    let out = listings;

    // Zoomed-out path isn't geo-filtered server-side — clip to the actual
    // viewport rectangle here so we don't render pins outside the screen.
    if (!useCells && region) {
      const b = regionBounds(region);
      out = out.filter((l) => withinBounds(l, b));
    }

    if (filter.kinds?.length) {
      // Prefer the denormalized `kind` field on the listing; fall back to
      // the linked species' kind for community pins that predate the field.
      out = out.filter((l) => {
        const k = l.kind ?? l.species?.kind;
        return k && filter.kinds!.includes(k);
      });
    }
    if (filter.inSeason) {
      out = out.filter((l) =>
        Array.isArray(l.species?.seasonMonths)
          ? l.species.seasonMonths.includes(filter.inSeason)
          : false,
      );
    }
    if (filter.sources?.length) {
      out = out.filter((l) => {
        const src = l.source ?? "community";
        return filter.sources!.includes(src);
      });
    }
    return out;
  }, [
    listings,
    useCells,
    region?.lat,
    region?.lng,
    region?.latDelta,
    region?.lngDelta,
    filter.kinds,
    filter.inSeason,
    filter.sources,
  ]);

  return { listings: filtered, isLoading, error };
}
