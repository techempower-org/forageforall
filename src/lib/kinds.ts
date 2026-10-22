/**
 * Listing kinds → map glyphs, shared by every screen that draws one.
 *
 * `kind` is listing data, so treat it as untrusted: a plain-object index with an inherited key such
 * as "__proto__" returns Object.prototype, which `??` doesn't catch and React throws on as a <Text>
 * child, taking the screen down for everyone in range (security scan 2026-10-22, F3–F6). `ownKey`
 * returns a value only for the table's own keys.
 */

export const KIND_GLYPH: Readonly<Record<string, string>> = Object.freeze({
  apple: "🍎",
  pear: "🍐",
  citrus: "🍊",
  berry: "🫐",
  stone: "🍑",
  nut: "🌰",
  fig: "🫒",
  grape: "🍇",
  herb: "🌿",
  veg: "🥬",
  flower: "🌼",
  mushroom: "🍄",
});

export const FALLBACK_GLYPH = "🌱";

/** The table's value for `key` if it is one of the table's OWN keys, else undefined. */
export function ownKey<T>(table: Readonly<Record<string, T>>, key: unknown): T | undefined {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

export function glyphFor(kind: unknown): string {
  return ownKey(KIND_GLYPH, kind) ?? FALLBACK_GLYPH;
}
