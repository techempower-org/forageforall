/**
 * Root layout — handles first-run onboarding, auth gate, nav tree.
 */

import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { colors } from "../src/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

// One bad row must not unmount the whole app: expo-router's boundary shows the error with a Retry
// instead of a blank (web) or fatal (native release) render (security scan 2026-10-22, F3–F6).
export { ErrorBoundary } from "expo-router";

const ONBOARDED_KEY = "forage.onboarded.v1";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(ONBOARDED_KEY);
        setOnboarded(v === "yes");
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
          initialRouteName={onboarded ? "(tabs)" : "onboarding"}
        >
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="add" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="about" options={{ animation: "slide_from_right" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export async function markOnboarded() {
  await AsyncStorage.setItem(ONBOARDED_KEY, "yes");
}
