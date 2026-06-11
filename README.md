<div align="center">

# 🌿 Forage for All

**A free, open-source map of fruit trees and edible plants growing on public land.**

Drop a pin. Share what's ripe. Eat from your own neighborhood.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-4A7C2E.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Built with Expo](https://img.shields.io/badge/Expo-SDK_51-B8573A.svg?style=flat-square)](https://expo.dev)
[![Powered by InstantDB](https://img.shields.io/badge/Realtime-InstantDB-3E2E1F.svg?style=flat-square)](https://instantdb.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-E8A838.svg?style=flat-square)](./CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/iOS%20%7C%20Android-supported-6B5440.svg?style=flat-square)](#install)
[![Web](https://img.shields.io/badge/Web-live-4A7C2E.svg?style=flat-square)](https://techempower-org.github.io/forageforall/app/)

[**Web app**](https://techempower-org.github.io/forageforall/app/) · [**Website**](https://techempower-org.github.io/forageforall/) · [**Docs**](./docs) · [**Roadmap**](./ROADMAP.md) · [**Ethics**](./FORAGING_ETHICS.md)

</div>

---

## What this is

A community-run map of fruit trees, berries, nuts, greens, and other edible plants growing on **public land** — street trees, parks, abandoned lots, trailsides, shared fencelines.

Every pin has photos, species info, and a **ripeness ring** that fills as the season progresses and other people confirm. No ads. No analytics. No selling your location. Ever.

## Why it exists

Billions of pounds of fruit fall to sidewalks every year while people buy the same fruit shipped in from other continents. This app tries — modestly — to change that by making the food that's already growing around us **visible**.

## Our four promises

| | |
|---|---|
| 💚 **Free forever** | No ads, no subscriptions, no paywalls. |
| 🔒 **Your data stays yours** | Fuzzy locations by default. Anonymous reports allowed. No trackers. |
| 🌱 **Open source** | AGPLv3. Read it, fork it, break it. |
| 🤝 **Volunteer-run** | Built by foragers, for foragers. |

---

## Install

### Try it now (Web)

Open **[techempower-org.github.io/forageforall/app/](https://techempower-org.github.io/forageforall/app/)** in any browser. No install, no account required to browse the map.

### Try it now (Android)

Download the latest preview APK from **[GitHub Releases](https://github.com/techempower-org/forageforall/releases/latest)**, enable "Install from unknown sources," and tap to install. The build uses the live InstantDB backend, so pins you drop are real. iOS store build is queued.

### Build from source

15 minutes from clone to running on a simulator.

**Prerequisites:**
- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm) — a `.nvmrc` is included)
- An [InstantDB](https://instantdb.com) app (free tier is enough)
- A [Google Maps API key](https://console.cloud.google.com) with Maps SDK for iOS + Android enabled

```bash
git clone https://github.com/techempower-org/forageforall.git
cd forageforall
nvm use
npm install
cp .env.example .env        # fill in INSTANT_APP_ID + Google Maps keys
npm run schema:push         # create DB entities in your InstantDB app
npm run seed:species        # load ~85 edibles (worldwide + Sierra Nevada natives)
npm run seed:listings       # (optional) aggregate open-data pins from iNaturalist + OSM + GBIF
npx expo start              # scan QR with Expo Go to run on your phone
```

For native builds (required to test the Google Maps integration):

```bash
npx expo prebuild --clean   # generates ios/ and android/ directories
npm run ios                 # or: npm run android
```

Full walkthrough: [`docs/SETUP.md`](./docs/SETUP.md)

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Framework | [Expo SDK 51](https://expo.dev) (React Native 0.74) | Cross-platform, OTA updates, managed build pipeline |
| Routing | [Expo Router v3](https://docs.expo.dev/router/introduction/) | File-based routes — a file in `app/` is a screen |
| Backend | [InstantDB](https://instantdb.com) | Realtime sync + auth + permissions, no custom server |
| Maps | [react-native-maps](https://github.com/react-native-maps/react-native-maps) + Google Maps SDK | Custom paper-textured style |
| Web maps | [@react-google-maps/api](https://github.com/JustFly1984/react-google-maps-api) | Aliased for web via metro.config.js — same API keys |
| Language | TypeScript (strict) | Required throughout — no `any` escapes |

**No custom backend.** InstantDB handles auth, realtime sync, and access control. This keeps the app deployable by a single volunteer.

Full architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## Data sources (aggregated as toggleable layers)

Community pins are the heart, but we also seed the map from open data so you see something the first time you open the app. Every listing carries a `source` tag, and each source is rendered as its own map layer with a distinct pin color. Toggle them on/off inside the app via the **layers** icon on the map.

| Source | Key | License | Coverage |
|---|---|---|---|
| **Forage for All community** | `community` | AGPLv3 (code), CC BY-SA 4.0 (data) | User-submitted, fuzzy to ~110m |
| **[iNaturalist](https://inaturalist.org)** | `inat` | CC BY-NC 4.0 | Research-grade observations globally |
| **[GBIF](https://gbif.org)** | `gbif` | CC0 / CC BY 4.0 | Scientific occurrences |
| **[OpenStreetMap](https://openstreetmap.org)** | `osm` | ODbL | Tagged fruit/nut trees in urban areas |
| **[Falling Fruit](https://fallingfruit.org)** | `fallingfruit` | CC BY-SA 4.0 | Public-land foraging map (API key required) |
| **SF Street Trees** | `sf_trees` | PDDL | San Francisco edible species |
| **NYC Street Tree Census** | `nyc_trees` | CC0 | NYC edible genera |
| **Portland Trees** | `portland_trees` | PDDL | Portland edible species |

**Refresh the map** with `npm run seed:listings` (pulls all sources for every region) or target one: `npm run seed:listings -- --source inat --region "Nevada County, CA"`.

First run of the aggregator seeded **3,603 edible-plant pins for Nevada County, CA** alone — manzanita, toyon, black oak, elderberry, wild grape, plus the expected fruit trees — pulled from iNaturalist and GBIF. Each pin is linked to a species entity in the catalog, so photos, season, toxicity, and look-alike warnings light up on tap. A weekly GitHub Action (`.github/workflows/sync-data.yml`) re-runs the aggregation so the map stays fresh, and both seeds are idempotent (deterministic UUID-v5 IDs keyed off latin name + sourceId) so re-runs upsert in place.

---

## Project structure

```
forageforall/
├── app/                        # Expo Router screens (file = route)
│   ├── (tabs)/                 # Map, Browse, In Season, Profile tabs
│   │   ├── index.web.tsx        # Web map screen (@react-google-maps/api)
│   ├── listing/[id].tsx        # Pin detail sheet
│   ├── add.tsx                 # Add-pin flow
│   ├── auth.tsx                # Magic-link sign in
│   └── onboarding.tsx
├── src/
│   ├── components/             # Pin, RipenessRing, SeasonStrip, Chip, LayerSheet
│   ├── config/
│   │   ├── mapStyles.ts        # Paper / Dark / Satellite custom Google Maps styles
│   │   └── sourceLayers.ts     # Registry of open-data sources + attribution
│   ├── db/
│   │   ├── client.web.ts           # Web InstantDB client (@instantdb/react, Metro .web.ts resolution)
│   │   └── schema.ts           # InstantDB schema (source of truth)
│   ├── hooks/
│   │   ├── useListings.ts      # Viewport-aware geohash query with layer filtering
│   │   ├── useSourceLayers.ts  # Persisted (AsyncStorage) layer toggle state
│   │   └── useCurrentLocation.ts
│   ├── lib/
│   │   ├── geo.ts              # Geohash index + fuzzy location (read before touching)
│   │   ├── ripeness.ts         # Time-weighted ripeness math (14-day half-life)
│   │   └── season.ts           # Month-window helpers
│   └── theme/
│       └── tokens.ts           # Colors, type scale, spacing — single source of truth
├── assets/                     # Icon, splash, adaptive icon
├── docs/                       # GitHub Pages site (static HTML, no build step)
├── scripts/
│   ├── species-data.ts         # Shared species catalog (single source of truth for both seeds)
│   ├── seed-species.ts         # Idempotent upsert of ~85 species (SHA-1 UUIDs keyed off latin name)
│   ├── seed-listings.ts        # Aggregates listings from iNat + GBIF + OSM + city datasets,
│   │                           #   links each to its species, denormalises kind + ripeness
│   └── sync-listings.ts        # Refreshes stale open-data listings per-source
├── instant.schema.ts           # Re-exports src/db/schema for the Instant CLI
├── instant.perms.ts            # Row-level permissions for InstantDB
├── app.config.ts               # Expo config — reads env vars for keys + IDs
├── eas.json                    # EAS build profiles (preview + production)
└── metro.config.js             # Aliases @instantdb/react-native → @instantdb/react on web
```

---

## How pins work

1. User taps **+** → selects species from catalog → photo (optional)
2. GPS coords are **fuzzed to ~110m** before writing — no exact location stored
3. A [geohash](https://en.wikipedia.org/wiki/Geohash) at precision 5 and 7 is computed and stored as an index
4. On the map, the viewport bounding box is translated into geohash prefixes → InstantDB query
5. The **ripeness ring** is recomputed from the species' seasonal window + recent community reports (half-life: 14 days)

---

## Database schema

Entities in `src/db/schema.ts` (push changes with `npm run schema:push`):

| Entity | Purpose |
|---|---|
| `species` | Catalog — common name, Latin name, `kind`, `seasonMonths`, toxicity, look-alikes |
| `listings` | Pins (community + imports) — fuzzed location, geohash5/7, `kind` (denormalised), linked `species`, `currentRipeness`, `source`, `sourceId`, `sourceSyncedAt` |
| `reports` | Ripeness/presence confirmations on a listing |
| `comments` | Text notes on a listing |
| `profiles` | User profiles — handle, badge count, privacy prefs |
| `saves` | Bookmarked listings |
| `flags` | Moderation flags on a listing |

Listings include `source` (community · inat · gbif · osm · fallingfruit · sf_trees · nyc_trees · portland_trees) and `sourceId` (e.g. `inat:12345`) so imports can be idempotently upserted. The `kind` field is indexed and filterable — lets the map filter by category without forcing a join.

---

## Contribute

We especially need:

- 🌳 **Botanists & regional foragers** — species data, toxicity warnings, look-alike flags
- 🌍 **Translators** — Spanish, French, German, Portuguese, Mandarin first
- 📱 **Mobile devs** — iOS / Android polish, offline-first improvements
- 🎨 **Designers** — species silhouette illustrations (paper-print style), og-image, store screenshots
- 🛡️ **Moderators** — regional pin review, abuse handling

**Before opening a PR**, read:
1. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, code style, PR flow
2. [`AGENTS.md`](./AGENTS.md) — conventions for AI coding agents (good reading for humans too)
3. [`FORAGING_ETHICS.md`](./FORAGING_ETHICS.md) — the community code
4. [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

First-timers: look for issues tagged [`good first issue`](https://github.com/techempower-org/forageforall/labels/good%20first%20issue).

---

## Foraging ethics (tl;dr)

> **Take a third, leave a third for the birds, leave a third for the earth.**

- Only pin on **public land** or with explicit permission from the property owner.
- Never reveal sensitive species (rare mushrooms, protected plants) — moderators blocklist these.
- Flag roadside and industrial-adjacent finds with contamination warnings.
- Confirm species with a reliable source before adding to the catalog.
- If you wouldn't want *your* tree mapped, don't map someone else's.

Full doc: [`FORAGING_ETHICS.md`](./FORAGING_ETHICS.md)

---

## What we will not do

Some things get asked for often. The answer is no, and it's not changing:

- **AI plant-ID that auto-confirms species.** Wrong IDs can poison people. Humans pick from the catalog.
- **Ads.** Not now, not ever.
- **Exact coordinates by default.** Privacy defaults don't move.
- **Venture funding.** Mission incompatibility.
- **Closed-source premium tier.** AGPLv3 makes this legally impossible anyway.

---

## License

**[GNU AGPLv3](./LICENSE)** — you can use, modify, and redistribute this code, but:

- Modified versions must **share their source** under the same license.
- This includes **hosted services** — you cannot run a closed SaaS on this codebase.

This is deliberate. Community-contributed foraging data shouldn't end up behind a paywall.

---

## Credits

- Species data: **[GBIF](https://gbif.org)**, **[iNaturalist](https://inaturalist.org)**, USDA PLANTS
- Base maps: **Google Maps Platform** — custom paper-textured style in [`src/lib/maps.ts`](./src/lib/maps.ts) (note: file forthcoming)
- Typography: **[Fraunces](https://fonts.google.com/specimen/Fraunces)** (display), **[Inter](https://rsms.me/inter/)** (UI)
- Inspired by [Falling Fruit](https://fallingfruit.org), [iNaturalist](https://inaturalist.org), and every neighbor who's ever handed a stranger a bag of lemons

---

<div align="center">

*"Eating is an agricultural act." — Wendell Berry*

Made with 🫐 by volunteers. [Join us.](./CONTRIBUTING.md)

</div>
