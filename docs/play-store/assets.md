# Play Store assets — inventory, gaps, capture list

## What Play requires vs. what we have

| Play requirement | Spec | Status | File |
|---|---|---|---|
| App icon (hi-res) | 512×512, 32-bit PNG w/ alpha, ≤1 MB | ✅ **generated** | `docs/play-store/assets/play-icon-512.png` (15 KB) |
| Feature graphic | 1024×500 PNG/JPG, ≤15 MB | ✅ **generated** | `docs/play-store/assets/feature-graphic-1024x500.png` (~580 KB) |
| Phone screenshots | 2–8, PNG/JPG, 16:9–2:1 aspect, each side 320–3840 px | ❌ **gap** — needs an emulator/device run (capture list below) | — |
| 7″ tablet screenshots | optional | skip for v1 | — |
| 10″ tablet screenshots | optional | skip for v1 | — |
| Promo video (YouTube URL) | optional | skip for v1 | — |

In-app build assets (already wired in `app.config.ts`, consumed by EAS at build):

| Asset | Size | Use |
|---|---|---|
| `assets/icon.png` | 1024×1024 (16-bit PNG) | app icon source |
| `assets/adaptive-icon.png` | 1024×1024, cream `#F4EDDC` bg | Android adaptive icon foreground |
| `assets/splash.png` | 2048×2048 | splash (contain, cream bg) |
| `docs/og-image.png` | 1200×630 | marketing/OG — **source of the feature graphic** |

## How the generated files were made (and how to regenerate)

Run `docs/play-store/assets/generate.sh` (ImageMagick). What it does and why:

- **play-icon-512.png** — `assets/icon.png` downscaled to 512 and forced to 8-bit
  RGBA (`PNG32`): the source is 16-bit, Play wants 32-bit (8×4 channels) PNG.
  The icon is full-bleed art; Google applies its own corner mask.
- **feature-graphic-1024x500.png** — top-left 1176×574 crop of `docs/og-image.png`
  scaled to exactly 1024×500. The crop keeps the wordmark, tagline,
  promise chips (AGPLv3 / No Ads / Privacy-first / Open Source) and the tree
  illustration, and deliberately excludes the bottom strip of the og-image,
  which carries a **stale repo URL** (`github.com/jphein/forageforall` — the repo
  now lives at `techempower-org/forageforall`; worth fixing in the og-image
  source someday, tracked as a nit).

Judgment call: composed from existing brand art rather than spec'd to the design
lane — the og-image was already a designed marketing panel, so the crop reads as
intentional, not improvised. If a designer later wants a dedicated feature
graphic (e.g., with a phone mock), it drops in with no other changes.

## Screenshot capture list (the one thing needing a device/emulator)

**Setup:** Pixel 8 emulator (or similar), **API 35 image** (doubles as the
targetSdk-35 smoke test), portrait, light mode, seeded database (the live
InstantDB app already has ~3,600 Nevada County pins — just build against the
default `INSTANT_APP_ID`). Capture at native resolution (1080×2400 works
everywhere). No status-bar clutter: set demo mode
(`adb shell settings put global sysui_demo_allowed 1` + demo broadcast) or crop.

Capture, in this order (first 3 are the mandatory minimum; all 6 preferred):

1. **Map tab** centered on Nevada City / Grass Valley, CA with community + iNat
   layers on — dense pins, a couple of ripeness rings visible. The hero shot:
   “a map full of food.”
2. **Listing detail** — open a stone-fruit or berry listing with a filled
   ripeness ring, season strip, access chips (“Public land”), and a confirm
   button visible.
3. **Add-pin flow, step 1** — the pin-drop map with the “Tap the map to drop a
   pin” hint bar. Shows how easy contributing is.
4. **Browse tab** — species-search list with a query like “plum” typed, showing
   result rows with glyphs + Latin names.
5. **In Season tab** (calendar) — the “ripe this month” view.
6. **Layers sheet** — open over the map, showing the open-data source toggles
   with attribution (tells the open-data story).

**Do NOT screenshot:** the profile screen (a personal email/handle would need
scrubbing), or the auth screen (a 6-digit code screen says nothing).

Composition rule: raw screenshots are fine for v1; skip device frames/captions
rather than doing them badly. If we later want framed panels with captions
(“Fuzzy locations by default”), that's a design-lane task.

**Who:** JP or next agent session with an Android emulator (`npm run android`
against a `production`-like env, or install the preview APK from GitHub
Releases on the emulator — pins are live either way).
