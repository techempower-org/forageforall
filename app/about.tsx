/**
 * About — open-source pillars, GitHub, credits, license.
 */

import React from "react";
import { ScrollView, View, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../src/components/Text";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/Button";
import { colors, palette, radius, spacing, shadow } from "../src/theme/tokens";

const PILLARS = [
  { icon: "heart-outline", title: "Free forever", body: "No ads, no subscriptions, no paywalls. Food on public land should stay free to find." },
  { icon: "lock-closed-outline", title: "Your data stays yours", body: "Fuzzy locations by default. Reports can be anonymous. We never sell anything." },
  { icon: "git-branch-outline", title: "Open source", body: "Licensed AGPLv3. Read the code, file issues, send pull requests, or fork us if we stray." },
  { icon: "people-outline", title: "Volunteer-run", body: "Built by foragers for foragers. The map is only as good as the community that tends it." },
];

const CREDITS = [
  { name: "OpenStreetMap", note: "Background geodata & community spirit" },
  { name: "GBIF", note: "Species names, taxonomy, seasonality" },
  { name: "InstantDB", note: "Real-time sync backend" },
  { name: "iNaturalist", note: "Plant identification references" },
];

export default function About() {
  const openGitHub = () => Linking.openURL("https://github.com/techempower-org/forageforall");
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]}>
        <ScreenHeader title="About Forage" showBack />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Text style={{ fontSize: 72 }}>🌿</Text>
          <Text variant="display" style={{ fontSize: 28, marginTop: spacing.md, textAlign: "center" }}>
            Forage for All
          </Text>
          <Text variant="body" soft style={{ textAlign: "center", marginTop: spacing.sm }}>
            A free, open-source map of food on public land.
          </Text>
        </View>

        {PILLARS.map((p) => (
          <View key={p.title} style={[styles.pillar, shadow.card]}>
            <View style={styles.pillarIcon}>
              <Ionicons name={p.icon as any} size={22} color={palette.mossDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title" style={{ fontSize: 17 }}>{p.title}</Text>
              <Text variant="body" soft style={{ marginTop: 4 }}>{p.body}</Text>
            </View>
          </View>
        ))}

        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton tone="ink" full label="View on GitHub" onPress={openGitHub} icon={<Ionicons name="logo-github" size={18} color={palette.cream} />} />
        </View>

        <Text variant="label" soft style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Built with</Text>
        {CREDITS.map((c) => (
          <View key={c.name} style={styles.creditRow}>
            <Text variant="body" style={{ fontWeight: "600" }}>{c.name}</Text>
            <Text variant="caption" muted style={{ flex: 1, textAlign: "right" }}>{c.note}</Text>
          </View>
        ))}

        <Text variant="caption" muted style={{ textAlign: "center", marginTop: spacing.xl, fontStyle: "italic", lineHeight: 20 }}>
          “Eating is an agricultural act.”{"\n"}— Wendell Berry
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: spacing.xl, marginBottom: spacing.lg },
  pillar: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.lg, marginBottom: spacing.md },
  pillarIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.sage, alignItems: "center", justifyContent: "center" },
  creditRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineSoft, gap: spacing.md },
});
