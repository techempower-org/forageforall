/**
 * Map screen — web version. Uses @react-google-maps/api in place of
 * react-native-maps (which has no web support).
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import type { Cluster, ClusterStats } from "@googlemaps/markerclusterer";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../components/Text";
import { Chip } from "../components/Chip";
import { ListingCard } from "../components/ListingCard";
import { LayerSheet } from "../components/LayerSheet";
import { useListings, Region } from "../hooks/useListings";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useSourceLayers } from "../hooks/useSourceLayers";
import { MAP_STYLES, MapStyleKey } from "../config/mapStyles";
import { getSourceColor } from "../config/sourceLayers";
import { colors, palette, radius, shadow, spacing } from "../theme/tokens";
import { distanceMeters } from "../lib/geo";
import { glyphFor } from "../lib/kinds";

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY ?? "";

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

const KIND_FILTERS = [
  { key: "apple",    label: "Apples" },
  { key: "pear",     label: "Pears" },
  { key: "citrus",   label: "Citrus" },
  { key: "berry",    label: "Berries" },
  { key: "stone",    label: "Stone fruit" },
  { key: "grape",    label: "Grapes" },
  { key: "fig",      label: "Figs" },
  { key: "nut",      label: "Nuts" },
  { key: "herb",     label: "Herbs" },
  { key: "veg",      label: "Veg" },
  { key: "flower",   label: "Flowers" },
  { key: "mushroom", label: "Mushrooms" },
];

// SVG pin icon with ripeness-colored body and source-colored stroke —
// mirrors the native MapPin's visual language so web users see the
// same ripeness gradient + source attribution at a glance.
function pinSvgDataUrl(opts: { glyph: string; ripeness: number; source?: string | null }) {
  const ring = palette.ripeness[Math.max(0, Math.min(4, Math.round(opts.ripeness)))];
  const stroke = getSourceColor(opts.source);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">` +
    `<ellipse cx="18" cy="40" rx="6" ry="1.5" fill="#000" opacity="0.25"/>` +
    `<path d="M18 1 C 9 1, 2 8, 2 17 C 2 27, 18 40, 18 40 C 18 40, 34 27, 34 17 C 34 8, 27 1, 18 1 Z" ` +
    `fill="${ring}" stroke="${stroke}" stroke-width="2"/>` +
    `<text x="18" y="22" font-size="15" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="serif">${opts.glyph}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Cluster pin — same silhouette as a single pin, but scaled up with a
// count badge and the cluster's average ripeness driving the body
// color. Keeps the foraging visual language at zoomed-out levels.
function clusterSvgDataUrl(opts: { count: number; glyph: string; ripeness: number }) {
  const ring = palette.ripeness[Math.max(0, Math.min(4, Math.round(opts.ripeness)))];
  const label = opts.count > 99 ? "99+" : String(opts.count);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">` +
    `<ellipse cx="24" cy="52" rx="8" ry="2" fill="#000" opacity="0.28"/>` +
    `<path d="M24 1 C 12 1, 2 10, 2 22 C 2 35, 24 52, 24 52 C 24 52, 46 35, 46 22 C 46 10, 36 1, 24 1 Z" ` +
    `fill="${ring}" stroke="#3E2E1F" stroke-width="2"/>` +
    `<text x="24" y="27" font-size="18" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="serif">${opts.glyph}</text>` +
    `<circle cx="38" cy="12" r="10" fill="#3E2E1F" stroke="#F4EDDC" stroke-width="1.5"/>` +
    `<text x="38" y="13" font-size="10" font-weight="700" text-anchor="middle" ` +
    `dominant-baseline="middle" fill="#F4EDDC" font-family="system-ui, sans-serif">${label}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export default function MapScreen() {
  const router = useRouter();
  const { location } = useCurrentLocation();
  const [region, setRegion] = useState<Region>({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    latDelta: 0.05,
    lngDelta: 0.05,
  });
  const [ripeNow, setRipeNow] = useState(true);
  const [activeKinds, setActiveKinds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("paper");
  const sourceLayers = useSourceLayers();

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY });

  // Stable initial camera target. @react-google-maps/api re-applies
  // `center`/`zoom` whenever those props change, so we must pass
  // references that never change — otherwise every viewport update
  // (via onIdle -> setRegion -> re-render) would snap the map back to
  // the previous center and the user couldn't pan or zoom.
  const initialCenter = useRef({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  });
  const hasCenteredOnUser = useRef(false);

  // Center on user location once it arrives — imperative so we don't
  // fight the user's gestures through controlled props.
  React.useEffect(() => {
    if (location && mapRef && !hasCenteredOnUser.current) {
      mapRef.panTo({ lat: location.lat, lng: location.lng });
      hasCenteredOnUser.current = true;
    }
  }, [location?.lat, location?.lng, mapRef]);

  const { listings } = useListings(region, {
    ripeNow,
    kinds: activeKinds.length ? activeKinds : undefined,
    sources: sourceLayers.hydrated ? sourceLayers.enabled : undefined,
  });

  const selected = useMemo(
    () => listings.find((l: any) => l.id === selectedId) ?? null,
    [listings, selectedId],
  );

  // onIdle fires once the map settles after a pan/zoom — mirrors
  // MapView's onRegionChangeComplete and avoids the per-frame churn of
  // onBoundsChanged.
  const onIdle = useCallback(() => {
    if (!mapRef) return;
    const c = mapRef.getCenter();
    const b = mapRef.getBounds();
    if (!c || !b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    setRegion({
      lat: c.lat(),
      lng: c.lng(),
      latDelta: Math.abs(ne.lat() - sw.lat()),
      lngDelta: Math.abs(ne.lng() - sw.lng()),
    });
  }, [mapRef]);

  const toggleKind = (k: string) =>
    setActiveKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  // Options: stable across renders unless mapStyle changes, so the
  // library doesn't re-apply settings on every listings update.
  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      styles: MAP_STYLES[mapStyle] ?? undefined,
      mapTypeId: mapStyle === "satellite" ? "hybrid" : "roadmap",
    }),
    [mapStyle],
  );

  const recenterOnUser = useCallback(() => {
    if (!mapRef || !location) return;
    mapRef.panTo({ lat: location.lat, lng: location.lng });
    if ((mapRef.getZoom() ?? 0) < 14) mapRef.setZoom(15);
  }, [mapRef, location?.lat, location?.lng]);

  // Marker click handler lives behind a ref so the clusterer effect
  // below doesn't need selectedId in its deps — otherwise selecting
  // a pin would tear down and rebuild every marker on the map.
  const markerClickRef = useRef<(id: string) => void>(() => {});
  markerClickRef.current = (id: string) =>
    setSelectedId((prev) => (prev === id ? null : id));

  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!mapRef || !isLoaded) return;

    // Tear down previous markers + clusterer — easier than diffing.
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((m) => m.setMap(null));

    const markers = listings.map((l: any) => {
      const kind = l.kind ?? l.species?.kind ?? "herb";
      const ripeness = l.currentRipeness ?? 0;
      const marker = new google.maps.Marker({
        position: { lat: l.lat, lng: l.lng },
        icon: {
          url: pinSvgDataUrl({
            glyph: glyphFor(kind),
            ripeness,
            source: l.source,
          }),
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 40),
        },
      });
      // Stash pin metadata on the marker so the cluster renderer can
      // compute a dominant glyph + average ripeness without a second
      // lookup through the listings array.
      (marker as any).__forage = { kind, ripeness };
      marker.addListener("click", () => markerClickRef.current(l.id));
      return marker;
    });
    markersRef.current = markers;

    const clusterRenderer = {
      render(cluster: Cluster, _stats: ClusterStats, _map: google.maps.Map) {
        const { count, position, markers: clusterMarkers = [] } = cluster;
        const kindCounts = new Map<string, number>();
        let ripenessSum = 0;
        let ripenessN = 0;
        for (const m of clusterMarkers) {
          const meta = (m as any).__forage as { kind?: string; ripeness?: number } | undefined;
          const k = meta?.kind ?? "herb";
          kindCounts.set(k, (kindCounts.get(k) ?? 0) + 1);
          if (typeof meta?.ripeness === "number") {
            ripenessSum += meta.ripeness;
            ripenessN += 1;
          }
        }
        let dominant = "herb";
        let max = 0;
        for (const [k, c] of kindCounts) {
          if (c > max) { dominant = k; max = c; }
        }
        const avgRipeness = ripenessN ? ripenessSum / ripenessN : 3;
        return new google.maps.Marker({
          position,
          icon: {
            url: clusterSvgDataUrl({
              count,
              glyph: glyphFor(dominant),
              ripeness: avgRipeness,
            }),
            scaledSize: new google.maps.Size(48, 56),
            anchor: new google.maps.Point(24, 52),
          },
          zIndex: 1000 + count,
        });
      },
    };

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef,
        markers,
        renderer: clusterRenderer,
      });
    } else {
      clustererRef.current.addMarkers(markers);
    }
  }, [listings, mapRef, isLoaded]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clustererRef.current?.clearMarkers();
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, []);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <Text variant="body" muted>Loading map…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={initialCenter.current}
          zoom={13}
          onLoad={setMapRef}
          onIdle={onIdle}
          options={mapOptions}
        >
          {/* Pins are managed imperatively via MarkerClusterer in an effect. */}
          {selected ? (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <View style={{ maxWidth: 260 }}>
                <Text variant="title" style={{ fontSize: 15 }}>
                  {selected.title ?? selected.species?.commonName ?? "Find"}
                </Text>
                <Text variant="caption" muted style={{ marginTop: 2 }}>
                  {selected.species?.latinName}
                </Text>
                <Pressable
                  onPress={() => router.push(`/listing/${selected.id}`)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: palette.moss, fontWeight: "600", fontSize: 13 }}>
                    View details →
                  </Text>
                </Pressable>
              </View>
            </InfoWindow>
          ) : null}
        </GoogleMap>
      </View>

      {/* Top filter bar */}
      <SafeAreaView edges={["top"]} style={styles.topWrap} pointerEvents="box-none">
        <View style={styles.topRow}>
          <View style={[styles.searchBar, { flex: 1 }]}>
            <Pressable onPress={() => setLayersOpen(true)} hitSlop={10} style={{ marginRight: spacing.sm }}>
              <Ionicons name="layers-outline" size={20} color={palette.bark} />
            </Pressable>
            <Text variant="body" muted style={{ flex: 1 }}>
              {listings.length} finds in view
            </Text>
            <MapStyleToggle value={mapStyle} onChange={setMapStyle} />
          </View>
          <Pressable
            onPress={() => router.push("/add")}
            style={[styles.addPill, shadow.card]}
            accessibilityLabel="Add a find"
          >
            <Ionicons name="add" size={18} color={palette.cream} />
            <Text style={styles.addPillLabel}>Add a find</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipScroller}
        >
          <Chip label="Ripe now" active={ripeNow} onPress={() => setRipeNow((v) => !v)} tone="terra" />
          {KIND_FILTERS.map((k) => (
            <Chip
              key={k.key}
              label={k.label}
              active={activeKinds.includes(k.key)}
              onPress={() => toggleKind(k.key)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Locate-me button — bottom-left so it doesn't fight Google's
          zoom controls + attribution on the right edge. */}
      {location ? (
        <Pressable
          onPress={recenterOnUser}
          style={[styles.locate, shadow.floating]}
          accessibilityLabel="Center map on my location"
        >
          <Ionicons name="locate" size={20} color={palette.bark} />
        </Pressable>
      ) : null}

      {/* Bottom preview card */}
      {selected ? (
        <SafeAreaView edges={["bottom"]} style={styles.sheet} pointerEvents="box-none">
          <View style={styles.sheetInner}>
            <ListingCard
              listing={selected}
              distance={
                location
                  ? distanceMeters(location, { lat: selected.lat, lng: selected.lng })
                  : undefined
              }
              onPress={() => router.push(`/listing/${selected.id}`)}
            />
            <Pressable
              onPress={() => setSelectedId(null)}
              hitSlop={12}
              style={styles.sheetClose}
            >
              <Ionicons name="close" size={18} color={palette.inkSoft} />
            </Pressable>
          </View>
        </SafeAreaView>
      ) : null}

      <LayerSheet
        visible={layersOpen}
        enabled={sourceLayers.enabled}
        onToggle={sourceLayers.toggle}
        onEnableAll={sourceLayers.enableAll}
        onResetDefaults={sourceLayers.resetDefaults}
        onClose={() => setLayersOpen(false)}
      />
    </View>
  );
}

function MapStyleToggle({
  value,
  onChange,
}: {
  value: MapStyleKey;
  onChange: (v: MapStyleKey) => void;
}) {
  const next: Record<MapStyleKey, MapStyleKey> = {
    paper: "dark",
    dark: "satellite",
    satellite: "paper",
  };
  const icon =
    value === "paper"
      ? "map-outline"
      : value === "dark"
      ? "moon-outline"
      : "earth-outline";
  return (
    <Pressable
      onPress={() => onChange(next[value])}
      hitSlop={10}
      accessibilityLabel={`Switch map style (currently ${value})`}
    >
      <Ionicons name={icon as any} size={20} color={palette.bark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "box-none",
  } as any,
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderColor: colors.line,
    borderWidth: 1,
    ...shadow.card,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.moss,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  addPillLabel: {
    color: palette.cream,
    fontWeight: "600",
    fontSize: 14,
  },
  chipScroller: { flexGrow: 0, flexShrink: 0 },
  chips: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  locate: {
    position: "absolute",
    bottom: 100,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: "box-none",
  } as any,
  sheetInner: {
    margin: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetClose: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
