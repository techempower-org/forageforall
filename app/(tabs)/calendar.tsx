/**
 * Seasonal calendar — 12-month ribbon, current month highlighted,
 * species in season per month.
 */

import React, { useMemo, useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../src/db/client";
import { Text } from "../../src/components/Text";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { colors, palette, radius, spacing, shadow } from "../../src/theme/tokens";
import { MONTH_NAMES_LONG, MONTH_NAMES, currentMonth } from "../../src/lib/season";
import { glyphFor } from "../../src/lib/kinds";

export default function CalendarScreen() {
  const [month, setMonth] = useState(currentMonth());

  const { data } = db.useQuery({
    species: { $: { limit: 500 } },
  });

  const species = (data?.species ?? []) as any[];

  const inThisMonth = useMemo(
    () => species.filter((s) => Array.isArray(s.seasonMonths) && s.seasonMonths.includes(month)),
    [species, month],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]}>
        <ScreenHeader title="In season" subtitle="What's edible, month by month" />
      </SafeAreaView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthRow}
        style={styles.monthScroller}
      >
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const active = m === month;
          const isNow = m === currentMonth();
          return (
            <Pressable
              key={name}
              onPress={() => setMonth(m)}
              style={[
                styles.monthCell,
                {
                  backgroundColor: active ? palette.moss : colors.bgElevated,
                  borderColor: isNow ? palette.terra : colors.line,
                  borderWidth: isNow ? 2 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? palette.cream : colors.text,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {name}
              </Text>
              {isNow ? (
                <Text
                  variant="caption"
                  style={{
                    color: active ? palette.cream : palette.terra,
                    marginTop: 2,
                    fontWeight: "700",
                  }}
                >
                  now
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Text variant="display" style={{ fontSize: 28 }}>{MONTH_NAMES_LONG[month - 1]}</Text>
        <Text variant="body" muted>{inThisMonth.length} species ripe or forming</Text>
      </View>

      <FlatList
        data={inThisMonth}
        keyExtractor={(s: any) => s.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }: any) => <SpeciesTile species={item} />}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl }}>
            <Text variant="body" muted>
              No species loaded for this month yet. Run the seed script or add your own.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function SpeciesTile({ species }: { species: any }) {
  return (
    <View style={[styles.tile, shadow.card]}>
      <View style={styles.tileTop}>
        <Text style={{ fontSize: 36 }}>{glyphFor(species.kind)}</Text>
      </View>
      <View style={styles.tileBody}>
        <Text variant="title" style={{ fontSize: 16 }} numberOfLines={1}>
          {species.commonName}
        </Text>
        <Text variant="caption" muted style={{ fontStyle: "italic" }} numberOfLines={1}>
          {species.latinName}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  monthScroller: { flexGrow: 0, flexShrink: 0 },
  monthRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  monthCell: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    minWidth: 76,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  tileTop: {
    height: 88,
    backgroundColor: palette.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  tileBody: { padding: spacing.md },
});
