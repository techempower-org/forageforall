/**
 * Add listing — 3-step flow: pin location → species → details/ripeness.
 */

import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../src/components/Text";
import { Chip } from "../src/components/Chip";
import { RipenessRing } from "../src/components/RipenessRing";
import { PrimaryButton, SecondaryButton } from "../src/components/Button";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PinMap } from "../src/components/PinMap";
import { useCurrentLocation } from "../src/hooks/useCurrentLocation";
import { useAuthedProfile } from "../src/hooks/useAuthedProfile";
import { db } from "../src/db/client";
import { createListing } from "../src/db/actions";
import { colors, palette, radius, spacing, shadow } from "../src/theme/tokens";
import { RIPENESS_LABELS, Ripeness } from "../src/lib/ripeness";
import { glyphFor } from "../src/lib/kinds";

export default function AddFlow() {
  const router = useRouter();
  const { user } = useAuthedProfile();
  const { location } = useCurrentLocation();
  const [step, setStep] = useState(0);

  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [speciesName, setSpeciesName] = useState<string>("");
  const [speciesKind, setSpeciesKind] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ripeness, setRipeness] = useState<Ripeness>(3);
  const [notes, setNotes] = useState("");
  const [access, setAccess] = useState({ public: true, permission: false, pesticide: false, gloves: false });
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Fetch the full catalog (~90 species) and filter client-side so that
  // latin-name searches (e.g. "plantago") also surface the right species.
  const { data } = db.useQuery({ species: { $: { limit: 200 } } });
  const allSpecies = (data?.species ?? []) as any[];
  const q = search.trim().toLowerCase();
  const species = q
    ? allSpecies.filter(
        (s: any) =>
          s.commonName?.toLowerCase().includes(q) ||
          s.latinName?.toLowerCase().includes(q),
      )
    : allSpecies;

  React.useEffect(() => {
    if (location && !coord) setCoord(location);
  }, [location?.lat, location?.lng]);

  // Auto-submit after the user returns from the auth screen having signed in.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (user && pendingSubmit && !submitting) {
      setPendingSubmit(false);
      submit();
    }
  }, [user?.id, pendingSubmit]); // intentional: submit identity changes each render

  const canNext = [!!coord, !!speciesId, true][step];

  const submit = async () => {
    if (!user) {
      // Alert.alert's multi-button prompt is not implemented on
      // react-native-web, so fall back to window.confirm there.
      const title = "Sign in to publish";
      const body =
        "Foragers keep the community honest. Sign in with your email — it's free and takes about 30 seconds.";
      const goToAuth = () => {
        setPendingSubmit(true);
        router.push("/auth");
      };
      if (Platform.OS === "web") {
        if (
          typeof window !== "undefined" &&
          window.confirm(`${title}\n\n${body}`)
        ) {
          goToAuth();
        }
      } else {
        Alert.alert(title, body, [
          { text: "Cancel", style: "cancel" },
          { text: "Sign in", onPress: goToAuth },
        ]);
      }
      return;
    }
    if (!coord || !speciesId) return;
    setSubmitting(true);
    try {
      const { listingId } = await createListing({
        lat: coord.lat,
        lng: coord.lng,
        speciesId,
        title: speciesName,
        notes,
        accessFlags: access,
        initialRipeness: ripeness,
        fuzzy: true,
        userId: user.id,
        kind: speciesKind ?? undefined,
      });
      router.replace(`/listing/${listingId}`);
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Unknown error");
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]}>
        <ScreenHeader
          title={["Pin a find", "Identify", "Details"][step]}
          subtitle={`Step ${step + 1} of 3`}
          showBack
        />
        <View style={styles.progress}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressSeg, { backgroundColor: i <= step ? palette.moss : colors.line }]} />
          ))}
        </View>
      </SafeAreaView>

      {step === 0 ? (
        <View style={{ flex: 1 }}>
          <PinMap
            coord={coord}
            onCoordChange={setCoord}
            initialCenter={{
              lat: location?.lat ?? 37.7749,
              lng: location?.lng ?? -122.4194,
            }}
          />
          <View style={styles.hint}>
            <Ionicons name="hand-left-outline" size={18} color={palette.bark} />
            <Text variant="caption" soft style={{ marginLeft: 8 }}>
              Tap the map to drop a pin · hold and drag to refine
            </Text>
          </View>
        </View>
      ) : step === 1 ? (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 160 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={palette.inkMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Apple, blackberry, fig…"
              placeholderTextColor={palette.inkMuted}
              style={styles.input}
              autoFocus
            />
          </View>
          {species.map((s: any) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSpeciesId(s.id);
                setSpeciesName(s.commonName);
                setSpeciesKind(s.kind ?? null);
              }}
              style={[
                styles.speciesRow,
                { borderColor: speciesId === s.id ? palette.moss : colors.line },
              ]}
            >
              <Text style={{ fontSize: 28, marginRight: spacing.md }}>{glyphFor(s.kind)}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="title" style={{ fontSize: 16 }}>{s.commonName}</Text>
                <Text variant="caption" muted style={{ fontStyle: "italic" }}>{s.latinName}</Text>
              </View>
              {speciesId === s.id ? <Ionicons name="checkmark-circle" size={22} color={palette.moss} /> : null}
            </Pressable>
          ))}
          {species.length === 0 ? (
            <Text variant="body" muted style={{ marginTop: spacing.lg, textAlign: "center" }}>
              No species found. Seed the catalog or keep typing.
            </Text>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 160 }}>
          <Text variant="label" soft>Ripeness right now</Text>
          <View style={styles.ripeRow}>
            {([0, 1, 2, 3, 4] as Ripeness[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRipeness(r)}
                style={[
                  styles.ripeCell,
                  { borderColor: ripeness === r ? palette.soil : "transparent" },
                ]}
              >
                <RipenessRing size={36} ripeness={r} />
                <Text variant="caption" muted>{RIPENESS_LABELS[r]}</Text>
              </Pressable>
            ))}
          </View>

          <Text variant="label" soft style={{ marginTop: spacing.lg }}>Access</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
            <Chip label="Public land" active={access.public} onPress={() => setAccess((a) => ({ ...a, public: !a.public }))} tone="moss" />
            <Chip label="Permission" active={access.permission} onPress={() => setAccess((a) => ({ ...a, permission: !a.permission }))} />
            <Chip label="Pesticide risk" active={access.pesticide} onPress={() => setAccess((a) => ({ ...a, pesticide: !a.pesticide }))} tone="terra" />
            <Chip label="Bring gloves" active={access.gloves} onPress={() => setAccess((a) => ({ ...a, gloves: !a.gloves }))} />
          </View>

          <Text variant="label" soft style={{ marginTop: spacing.lg }}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="How to find it, what to watch for…"
            placeholderTextColor={palette.inkMuted}
            multiline
            style={styles.notes}
          />
        </ScrollView>
      )}

      {/* Footer */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <SecondaryButton
          label={step === 0 ? "Cancel" : "Back"}
          onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
        />
        {step < 2 ? (
          <PrimaryButton
            label="Next"
            onPress={() => setStep(step + 1)}
            disabled={!canNext}
          />
        ) : (
          <PrimaryButton
            label="Publish pin"
            loading={submitting}
            onPress={submit}
            disabled={!coord || !speciesId}
          />
        )}
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 4, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  progressSeg: { flex: 1, height: 3, borderRadius: 2 },
  hint: { position: "absolute", bottom: 20, left: spacing.md, right: spacing.md, backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: radius.md, flexDirection: "row", alignItems: "center", ...shadow.card },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, borderColor: colors.line, borderWidth: 1, marginBottom: spacing.md },
  input: { flex: 1, marginLeft: 8, color: colors.text, fontSize: 15 },
  speciesRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 2, padding: spacing.md, marginBottom: spacing.sm },
  ripeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  ripeCell: { alignItems: "center", padding: 6, borderRadius: radius.md, borderWidth: 2, gap: 4, minWidth: 56 },
  notes: { backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, minHeight: 100, textAlignVertical: "top", color: colors.text, fontSize: 15, marginTop: spacing.sm },
  footer: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.lineSoft, backgroundColor: colors.bg, justifyContent: "space-between" },
});
