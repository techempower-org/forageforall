/**
 * ListingCard — used in the browse list and bottom-sheet preview.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "./Text";
import { RipenessRing } from "./RipenessRing";
import { colors, palette, radius, spacing, shadow } from "../theme/tokens";
import { describeSeason, isInSeason } from "../lib/season";
import { RIPENESS_SHORT } from "../lib/ripeness";
import { formatDistance } from "../lib/geo";
import { SOURCE_BY_KEY, getSourceColor } from "../config/sourceLayers";
import { glyphFor, ownKey } from "../lib/kinds";

export function ListingCard({
  listing,
  distance,
  onPress,
}: {
  listing: any;
  distance?: number;
  onPress?: () => void;
}) {
  const species = listing.species ?? {};
  const months: number[] = Array.isArray(species.seasonMonths) ? species.seasonMonths : [];
  const ripe = listing.currentRipeness ?? 0;
  const kind = listing.kind ?? species.kind ?? "herb";
  const glyph = glyphFor(kind);
  const sourceKey: string = listing.source ?? "community";
  const sourceLayer = ownKey(SOURCE_BY_KEY, sourceKey);
  const ripeBucket = Math.max(0, Math.min(4, Math.round(ripe))) as 0 | 1 | 2 | 3 | 4;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      shadow.card,
      pressed && { transform: [{ scale: 0.99 }] },
    ]}>
      <View style={styles.photoWrap}>
        {species.photoUrl ? (
          <Image source={{ uri: species.photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, { backgroundColor: palette.sage, alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 32 }}>{glyph}</Text>
          </View>
        )}
        <View style={styles.ringBadge}>
          <RipenessRing size={32} ripeness={ripe} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
            {listing.title?.split(" — ")[0] || species.commonName || "Find"}
          </Text>
          {species.isToxic ? (
            <View style={styles.toxicBadge}>
              <Text style={styles.toxicText}>⚠ caution</Text>
            </View>
          ) : null}
        </View>
        {species.latinName ? (
          <Text variant="caption" muted style={{ fontStyle: "italic" }} numberOfLines={1}>
            {species.latinName}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text variant="caption" soft>
            {RIPENESS_SHORT[ripeBucket] ?? "—"}
          </Text>
          {months.length ? (
            <>
              <Dot />
              <Text variant="caption" soft numberOfLines={1}>
                {describeSeason(months)}
                {isInSeason(months) ? " · in season" : ""}
              </Text>
            </>
          ) : null}
          {typeof distance === "number" ? (
            <>
              <Dot />
              <Text variant="caption" soft>{formatDistance(distance)}</Text>
            </>
          ) : null}
        </View>

        {species.description ? (
          <Text variant="caption" soft numberOfLines={2} style={styles.descText}>
            {species.description}
          </Text>
        ) : null}

        {species.isToxic && Array.isArray(species.lookAlikes) && species.lookAlikes.length ? (
          <Text variant="caption" style={styles.warnText} numberOfLines={2}>
            ⚠ {species.lookAlikes[0]}
          </Text>
        ) : null}

        {sourceLayer ? (
          <View style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: getSourceColor(sourceKey) }]} />
            <Text variant="caption" muted numberOfLines={1}>
              via {sourceLayer.shortLabel} · tap for details
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Dot() {
  return <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: palette.inkMuted, marginHorizontal: 6 }} />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
  ringBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.bg,
    borderRadius: 999,
    padding: 2,
  },
  body: { flex: 1, justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  sourceRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  sourceDot: { width: 8, height: 8, borderRadius: 4 },
  descText: { marginTop: 6, lineHeight: 16 },
  warnText: {
    marginTop: 6,
    color: palette.terra,
    backgroundColor: "#FBE8DF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    lineHeight: 15,
  },
  toxicBadge: {
    backgroundColor: palette.terra,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  toxicText: {
    color: palette.cream,
    fontSize: 11,
    fontWeight: "700",
  },
});
