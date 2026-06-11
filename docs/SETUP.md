# Setup Guide

Getting the Forage for All app running locally, from zero.

Budget: **15 minutes** if you've done React Native before. **45 minutes** if you haven't.

---

## Prerequisites

Install these once, reuse forever:

- **Node.js 20** — install via [nvm](https://github.com/nvm-sh/nvm). From the repo root, run `nvm use` and it picks up `.nvmrc`.
- **Git**
- **Xcode 15+** (macOS only, for iOS builds) — install from the App Store, then `sudo xcodebuild -license accept`.
- **Android Studio** (for Android builds) — set `ANDROID_HOME` env var. [Official guide](https://docs.expo.dev/workflow/android-studio-emulator/).
- **Watchman** (recommended for macOS) — `brew install watchman`.
- **CocoaPods** (macOS) — `brew install cocoapods`.

## Accounts you'll need

All free tiers are enough for development:

1. **[InstantDB](https://instantdb.com)** — sign up, create an app, copy the app ID.
2. **[Google Cloud Console](https://console.cloud.google.com)** — create a project, enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (optional, for address autocomplete)
   Create two API keys. **Restrict each one** to the appropriate platform + bundle ID — otherwise someone will scrape your key and rack up charges.

## Clone & configure

```bash
git clone https://github.com/techempower-org/forageforall
cd forageforall
nvm use
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
EXPO_PUBLIC_INSTANT_APP_ID=<from instantdb dashboard>
EXPO_PUBLIC_GOOGLE_MAPS_IOS=<restricted ios key>
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID=<restricted android key>
```

## Push the DB schema + seed species

```bash
npm run schema:push     # creates entities in your InstantDB app
npm run seed:species    # loads ~85 edibles (worldwide + Sierra Nevada natives)
```

## Run the app

```bash
# Native build (required first time — Maps SDK needs native config)
npx expo prebuild --clean

# iOS simulator
npm run ios

# Android emulator
npm run android
```

## Verify it works

In the running app:
1. Grant location permission when prompted
2. Map centers on your location
3. Tap **+** → camera opens → take a photo of anything
4. Pick a species → submit
5. Pin appears on the map within 2 seconds ✨

## Common gotchas

**"Unable to resolve module react-native-maps"**
→ You skipped `expo prebuild`. Run it.

**Map is blank on Android**
→ Wrong or unrestricted Google Maps Android key. Check the key has Maps SDK for Android enabled, and that the bundle ID restriction matches `com.forageforall.app`.

**Map is blank on iOS**
→ Same but for the iOS key. Restrict by bundle ID `com.forageforall.app`.

**"No InstantDB app configured"**
→ `.env` not loaded. Kill Metro, restart with `npm run ios` (Expo only reads `.env` at start).

**Schema push fails**
→ Your InstantDB app ID is wrong, or the token expired. Reauth with the CLI.

**Camera crashes on Android emulator**
→ Emulators without a virtual camera fail. Use a physical device or an emulator image with camera enabled.

## Running on a physical device

Much faster dev loop than simulators once set up.

```bash
# iOS (needs Apple developer account — free tier works for device install)
npm run ios -- --device

# Android (enable USB debugging on the phone first)
npm run android -- --device
```

## What's next

- Read [`AGENTS.md`](../AGENTS.md) for code conventions
- Read [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) for the mental model
- Pick a [`good first issue`](https://github.com/techempower-org/forageforall/labels/good%20first%20issue)

---

*If this guide fails for you, please open an issue — these docs should stay accurate.*
