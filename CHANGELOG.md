# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.6] — 2026-10-04

Forage for All now runs on its own backend (self-hosted Instant on realm-cloud).

- **Update to keep saving pins.** Older versions can still browse the map, but they can no longer
  add pins, reports, comments, saves or flags.
- **Sign in again by email code** after updating. Your pins, reports and profile carried over.
- Tighter data permissions: only you can edit or delete what you posted; signed-out visitors can
  browse but not change anything; "Anonymize my reports" now hides you from others everywhere.

## [0.1.5] — 2026-04-24

Add pin flow fixes + map pin emoji clipping fix.

- Auth gate now shows an explanatory dialog ("Sign in to publish — it's free…")
  with Cancel / Sign in buttons instead of silently redirecting to the auth
  screen. Users are no longer stranded wondering what happened.
- After signing in and returning to the add flow, state (location, species,
  ripeness, notes) is fully preserved so tapping "Publish pin" again works
  without repeating the 3 steps.
- Species search now matches on Latin name as well as common name — typing
  "plantago" (or any genus/species name) surfaces the right species.
- Community pins now have `source: "community"` and `kind` written directly
  on the listing at creation time, so Browse kind filters and layer toggles
  work for user-submitted pins (previously they relied on the joined species
  entity and could be invisible to the "community" layer toggle).
- Map pin emoji (🍎 🌿 🍄 etc.) no longer get clipped at the top. Root
  cause: tall emoji ascenders (🍎's leaf, 🌰's cap) overflowed the top of
  the rasterised marker bitmap. Fix: 6 px of `paddingTop` on the pin wrap
  gives ascenders headroom; `lineHeight` set explicitly to prevent Android
  text-layout inflation from shifting glyphs off-centre.

## [0.1.4] — 2026-04-24

- Browse and In Season (calendar) tabs: horizontal chip / month rows no
  longer stretch vertically when the list below them is sparse (or squash
  when it's full). Root cause: horizontal ScrollViews inside a flex-column
  parent with a FlatList sibling were expanding to fill the column's
  unused height. Fix: `flexGrow: 0` + `flexShrink: 0` on the scroller.
- Browse filter chips expanded to the full 12-kind set (Pears, Grapes,
  Figs, Flowers, Mushrooms added, already matched the map).

## [0.1.3] — 2026-04-24

Bug fix on 0.1.2.

- Tapping the bottom preview card now actually navigates to the listing detail
  page. 0.1.2 wrapped the ListingCard (itself a Pressable) in an outer
  Pressable — the inner one claimed the touch but had no handler, so taps
  went nowhere. Fix: pass onPress directly to ListingCard instead of
  nesting.

## [0.1.2] — 2026-04-24

UX polish on top of 0.1.1.

- Ripeness legend hides when a pin is selected (was overlapping the bottom
  preview card).
- Pin preview card gets a close (×) button so users can dismiss without
  tapping another pin.
- Preview card shows toxicity badge (⚠ caution) for species with `isToxic`,
  a description preview line, and a look-alike warning callout when toxic
  species have lookAlikes recorded.
- "tap for details" affordance added to the source attribution row.

## [0.1.1] — 2026-04-24

Shipped the same day as 0.1.0 — fixes all the things that were half-plumbed when
seeded open-data pins landed in the app for the first time.

### Map
- Pin rings now reflect ripeness (the legend actually matches the pins). Marker
  keys include ripeness bucket so cached views don't swallow updates.
- Cluster bubbles take the average ripeness of the pins they cover — zoomed-out
  views now show a useful "what's ripe here" heat gradient instead of all-green.
- Kind emoji on each pin (apple 🍎, berry 🫐, citrus 🍊, nut 🌰, etc.) —
  previously every imported pin rendered as 🌿 because only community pins had
  a linked species.
- Filter chips expanded to all 12 catalog kinds (added pears, grapes, figs,
  flowers, mushrooms).

### Data
- Seeded listings now **link to species entities** in InstantDB (deterministic
  IDs mean this is idempotent on re-seed). Species photos, seasonality, toxicity
  warnings, and look-alikes now surface on imported pins just like community ones.
- New `kind` field denormalised onto every listing — lets the map filter by
  category without forcing a server-side join.
- Ripeness computed per-listing from species seasonMonths × current month
  at seed time. April re-seed result for Nevada County's 3,603 pins:
  604 ripe (bay laurel, citrus, loquat, dandelion, spring greens), 294 soon,
  377 forming, 2,328 unripe.

### Listing card
- Source attribution badge (dot + "via iNaturalist" etc.) on every card.
- Kind emoji fallback when a species photo isn't available — no more blanket
  🌿 for imports.
- Season strip only renders when the species has a season — cleaner card for
  sparse imports.

## [0.1.0] — 2026-04-24

First public preview. Everything you need to try the app and start dropping pins.

### App
- React Native + Expo SDK 51 scaffold with file-based routing (Expo Router v3)
- Core screens: Map (clustered), Listing detail, Add flow, Browse, Calendar, Profile, About, Onboarding
- Google Maps integration with a custom paper-textured style (and a dark variant)
- Privacy-first: coordinates fuzzed to ~110m on community pins
- Ripeness ring math (14-day half-life) blends species seasonality with community confirmations

### Data
- InstantDB realtime backend, no custom server
- `source`-tagged listings render as toggleable map layers with per-source pin colors
- Open-data aggregator `npm run seed:listings` pulls from iNaturalist, GBIF, OpenStreetMap, Falling Fruit, and SF/NYC/Portland street-tree inventories
- Weekly GitHub Action re-syncs stale open-data pins
- Seed catalog of ~85 edibles — worldwide staples plus Sierra Nevada + California natives (manzanita, toyon, oaks, elderberry, bay laurel, pine nuts)
- Nevada County, CA seeded with 3,198 iNaturalist + GBIF pins on first run

### Builds
- EAS preview profile producing installable Android APK + iOS simulator bundle
- Release pipeline (GitHub Actions) attaches APK + iOS bundle to every tag
- Weekly `sync-data.yml` refresh workflow

### Meta
- AGPLv3 — non-negotiable, protects the community data from closed forks
- Agent-friendly docs (AGENTS.md, CLAUDE.md, `.cursorrules`, `copilot-instructions.md`)
- GitHub Pages marketing site with generated OG image
- Foraging ethics, privacy policy, security policy, code of conduct, governance
- Issue + PR templates, `llms.txt`
