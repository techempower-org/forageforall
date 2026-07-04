import type { ExpoConfig } from "expo/config";

/**
 * Expo app config.
 *
 * Before building you MUST set these env vars (see .env.example):
 *   GOOGLE_MAPS_IOS_KEY, GOOGLE_MAPS_ANDROID_KEY, INSTANT_APP_ID
 *   EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY  (web only — HTTP-referrer restricted key)
 */
const config: ExpoConfig = {
  name: "Forage for All",
  slug: "forage-for-all",
  owner: "kasdf",
  scheme: "forage",
  version: "0.1.5",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#F4EDDC",
  },
  web: {
    // Prerender every static route (browse.html, calendar.html, etc.)
    // so GitHub Pages can serve direct hits without the SPA 404 trick.
    // Dynamic routes like /listing/[id] still fall through to 404.html.
    output: "static",
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  ios: {
    bundleIdentifier: "org.forageforall.app",
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Forage needs your location to show nearby finds and to center the map. Your location is never sold or shared.",
      NSCameraUsageDescription:
        "Take photos of fruit trees and edible plants to share with the community.",
      NSPhotoLibraryUsageDescription:
        "Attach photos of your finds from your photo library.",
    },
  },
  android: {
    package: "org.forageforall.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F4EDDC",
    },
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      },
    },
    // Play submission: request ONLY what the code actually uses today.
    // Location (foreground, one-shot) centers the map and prefills the
    // add-pin coordinate — see src/hooks/useCurrentLocation.ts. Coordinates
    // are fuzzed to ~110m before any write (src/db/actions.ts).
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    // expo-camera and expo-image-picker are installed (photo upload is on
    // the roadmap) but NO code path uses them yet. Their library manifests
    // would still merge these permissions into the APK/AAB, which Play
    // flags as unused sensitive permissions — block them until the photo
    // feature actually ships. When it does: delete this list and restore
    // the camera/image-picker config plugins below.
    blockedPermissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Forage to use your location to show what's ripe nearby.",
      },
    ],
    [
      // Google Play requires new apps to target Android 15 (API 35) since
      // 2025-08-31. Expo SDK 51 defaults to targetSdk 34, which Play
      // rejects at AAB upload. compileSdk stays at the SDK 51 default (34)
      // to remain inside AGP 8.2's support envelope. The real fix is the
      // Expo SDK 52+ upgrade (tracked in docs/play-store/SUBMISSION-RUNBOOK.md);
      // this override is the minimal change that makes the AAB uploadable.
      "expo-build-properties",
      {
        android: {
          targetSdkVersion: 35,
        },
      },
    ],
  ],
  extra: {
    instantAppId:
      process.env.INSTANT_APP_ID ?? "32870e24-647d-452a-ab13-fdaa0a8d8564",
    router: { origin: false },
    eas: {
      projectId: "19ec7145-38b0-4627-bf42-7ae7332d44e8",
    },
  },
  experiments: {
    // GitHub Pages serves the web bundle at /forageforall/app/, so every
    // static asset URL in index.html needs to be prefixed with that path.
    // Overridable at build time — `expo start --web` doesn't need it, and
    // a custom deploy target (Vercel, etc.) can pass its own value.
    baseUrl: process.env.EXPO_BASE_URL ?? "",
  },
};

export default config;
