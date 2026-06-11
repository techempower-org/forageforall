/**
 * Geo helpers — geohashing, bounding boxes, distance.
 *
 * InstantDB doesn't have native geo yet, so we index geohash prefixes on
 * listings and query by { geohash5: { $in: [...prefixes] } }.
 */

import geohash from "ngeohash";

/** Encode lat/lng to a 5-char geohash (~4.9km cell). */
export const toGeohash5 = (lat: number, lng: number) =>
  geohash.encode(lat, lng, 5);

/** Encode lat/lng to a 7-char geohash (~150m cell). */
export const toGeohash7 = (lat: number, lng: number) =>
  geohash.encode(lat, lng, 7);

/**
 * Return the geohash5 cells that cover a rectangular region
 * (map viewport). Includes neighbors so edge pins aren't lost.
 */
export function geohash5CellsForRegion(
  region: { lat: number; lng: number; latDelta: number; lngDelta: number },
): string[] {
  const { lat, lng, latDelta, lngDelta } = region;
  const minLat = lat - latDelta / 2;
  const maxLat = lat + latDelta / 2;
  const minLng = lng - lngDelta / 2;
  const maxLng = lng + lngDelta / 2;
  // ngeohash.bboxes returns a covering set of geohash strings.
  return geohash.bboxes(minLat, minLng, maxLat, maxLng, 5);
}

export type RegionBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** The lat/lng rectangle of a viewport region. */
export function regionBounds(region: {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}): RegionBounds {
  return {
    minLat: region.lat - region.latDelta / 2,
    maxLat: region.lat + region.latDelta / 2,
    minLng: region.lng - region.lngDelta / 2,
    maxLng: region.lng + region.lngDelta / 2,
  };
}

/** True if a point falls within (or on) the region rectangle. */
export function withinBounds(
  point: { lat: number; lng: number },
  b: RegionBounds,
): boolean {
  return (
    point.lat >= b.minLat &&
    point.lat <= b.maxLat &&
    point.lng >= b.minLng &&
    point.lng <= b.maxLng
  );
}

/** Haversine distance in meters. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Round a coord to N decimal places ("fuzzy location" privacy default). */
export function fuzzCoord(n: number, decimals = 3): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)}km`;
}
