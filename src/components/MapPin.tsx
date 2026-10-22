/**
 * MapPin — what we render inside a <Marker>. Ring + fruit glyph emoji.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { RipenessRing } from "./RipenessRing";
import { palette, shadow } from "../theme/tokens";
import { Ripeness } from "../lib/ripeness";
import { glyphFor } from "../lib/kinds";

export function MapPin({
  kind,
  ripeness,
  size = 40,
  selected,
  sourceColor,
}: {
  kind: string;
  ripeness: Ripeness | number;
  size?: number;
  selected?: boolean;
  sourceColor?: string;
}) {
  const glyph = glyphFor(kind);
  const s = selected ? size + 8 : size;
  const stemColor = sourceColor ?? palette.bark;
  return (
    <View style={[styles.wrap, shadow.floating]}>
      {/* paddingTop gives emoji ascenders (leaf on 🍎, etc.) room above the
          circle so they aren't clipped when the marker is rasterized. */}
      <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
        <View style={StyleSheet.absoluteFill}>
          <RipenessRing size={s} ripeness={ripeness} />
        </View>
        <Text style={{ fontSize: s * 0.43, lineHeight: s * 0.5 }}>{glyph}</Text>
      </View>
      <View
        style={[
          styles.stem,
          { borderTopColor: stemColor, borderTopWidth: selected ? 10 : 8 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 6,   // headroom so emoji ascenders aren't clipped at top
  },
  stem: {
    marginTop: -2,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
