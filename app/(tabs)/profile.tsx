/**
 * Profile — signed-in user's finds, stats, settings entry point.
 */

import React from "react";
import { ScrollView, View, StyleSheet, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../../src/components/Text";
import { ListingCard } from "../../src/components/ListingCard";
import { SecondaryButton, PrimaryButton } from "../../src/components/Button";
import { useAuthedProfile } from "../../src/hooks/useAuthedProfile";
import { db } from "../../src/db/client";
import { colors, palette, radius, spacing, shadow } from "../../src/theme/tokens";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuthedProfile();

  const { data } = db.useQuery(
    user
      ? {
          profiles: {
            $: { where: { id: user.id } },
            createdListings: { $: { limit: 50 }, species: {} },
            saves: { $: { limit: 50 }, listing: { species: {} } },
          },
        }
      : null,
  );

  const myListings = (data?.profiles?.[0]?.createdListings ?? []) as any[];
  const saves = (data?.profiles?.[0]?.saves ?? []) as any[];

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
          <Text variant="display" style={{ fontSize: 32 }}>Welcome.</Text>
          <Text variant="body" muted style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
            Sign in to pin finds and save spots. Magic-code auth — no password.
          </Text>
          <PrimaryButton full label="Sign in with email" onPress={() => router.push("/auth")} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero */}
          <View style={{ padding: spacing.lg, alignItems: "center" }}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 38 }}>🌿</Text>
            </View>
            <Text variant="title" style={{ marginTop: spacing.md }}>
              {profile?.displayName ?? "New forager"}
            </Text>
            <Text variant="caption" muted>@{profile?.handle ?? "…"}</Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Stat label="Pinned" value={profile?.pinsCount ?? myListings.length} />
            <Stat label="Confirms" value={profile?.confirmsCount ?? 0} />
            <Stat label="Saved" value={saves.length} />
          </View>

          <Section title="My finds">
            {myListings.length === 0 ? (
              <Text variant="body" muted>Your pins will appear here.</Text>
            ) : (
              myListings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onPress={() => router.push(`/listing/${l.id}`)}
                />
              ))
            )}
          </Section>

          <Section title="Saved spots">
            {saves.length === 0 ? (
              <Text variant="body" muted>Tap the bookmark on any listing to save it.</Text>
            ) : (
              saves.map((s) =>
                s.listing ? (
                  <ListingCard
                    key={s.id}
                    listing={s.listing}
                    onPress={() => router.push(`/listing/${s.listing.id}`)}
                  />
                ) : null,
              )
            )}
          </Section>

          <Section title="Settings">
            <Row icon="location-outline" label="Fuzzy location on pins" value={profile?.fuzzyLocation ? "On" : "Off"} />
            <Row icon="eye-off-outline" label="Anonymize my reports" value={profile?.anonymizeReports ? "On" : "Off"} />
            <Pressable onPress={() => router.push("/about")}>
              <Row icon="information-circle-outline" label="About Forage" value="Open source · AGPLv3" chev />
            </Pressable>
            <View style={{ marginTop: spacing.md }}>
              <SecondaryButton
                full
                label="Sign out"
                onPress={() => db.auth.signOut()}
                icon={<Ionicons name="log-out-outline" size={18} color={colors.text} />}
              />
            </View>
            {/* Google Play requires an in-app account-deletion entry point
                (linking out to the hosted deletion page is explicitly
                allowed by the policy). Keep this URL in sync with
                docs/delete-account.html and PRIVACY.md. */}
            <View style={{ marginTop: spacing.sm }}>
              <SecondaryButton
                full
                label="Delete account"
                onPress={() =>
                  Linking.openURL("https://forage.techempower.org/delete-account.html")
                }
                icon={<Ionicons name="trash-outline" size={18} color={colors.text} />}
              />
            </View>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text variant="display" style={{ fontSize: 26 }}>{value}</Text>
      <Text variant="caption" muted style={{ letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
      <Text variant="label" soft style={{ marginBottom: spacing.sm }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, chev }: { icon: any; label: string; value?: string; chev?: boolean }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={palette.bark} />
      <Text variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{label}</Text>
      {value ? <Text variant="caption" muted>{value}</Text> : null}
      {chev ? <Ionicons name="chevron-forward" size={18} color={palette.inkMuted} style={{ marginLeft: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.sage,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  stats: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});
