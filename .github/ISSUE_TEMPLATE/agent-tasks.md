# Good first issues for agents

A curated list of tasks that are well-scoped, self-contained, and safe for AI agents to pick up. Each one names the files involved and the expected shape of the change.

Copy these into GitHub Issues when the repo goes live; tag them `agent-friendly` and `good first issue`.

---

## 1. Add empty-state to Browse screen
**Files:** `app/(tabs)/browse.tsx`, `components/EmptyState.tsx` (new)
**Scope:** When the filtered species list is empty, show a paper-textured empty state with a fig-leaf illustration and the copy "Nothing matches. Try widening the season filter."
**Acceptance:** Renders when `filteredSpecies.length === 0`. Uses `theme/` tokens. No network changes.

## 2. Persist filter state across app launches
**Files:** `lib/filters.ts`, `app/(tabs)/index.tsx`
**Scope:** Save the current filter set (categories, season window) to `AsyncStorage` on change; hydrate on mount.
**Acceptance:** Kill the app with filters applied; reopen; filters still applied. Add a unit test.

## 3. Species detail: show "nearest pin" distance
**Files:** `app/species/[id].tsx` (new), `lib/geo.ts` (add `haversine`)
**Scope:** On species detail, show distance to the nearest pin of that species from user's current location.
**Acceptance:** Renders "2.3 km away" or "No pins nearby" if none within 50km.

## 4. Share pin as deep link
**Files:** `app/listing/[id].tsx`, `app.config.ts`
**Scope:** Tap the share button → generate a `forage://listing/<id>` link that opens the pin (the registered scheme is `forage`, app.config.ts:14). Also include an `https://forage.techempower.org/app/listing/<id>` universal-link fallback (requires adding iOS associatedDomains + Android intentFilters).
**Acceptance:** Link works cold-launch on iOS + Android.

## 5. Dark map style toggle
**Files:** `lib/maps.ts` (already has `darkStyle`), `app/(tabs)/index.tsx`, Settings
**Scope:** Follow the system appearance by default; let the user override in Settings.
**Acceptance:** Toggle persists. Changing system theme while app is open updates immediately.

## 6. Add Spanish translation (es)
**Files:** `i18n/es.json` (new), `i18n/index.ts` (register locale)
**Scope:** Translate every key from `i18n/en.json`. Prefer community-reviewed translations over machine.
**Acceptance:** Device set to Spanish → UI is in Spanish end-to-end.

## 7. Confirm prompt on "mark as gone"
**Files:** `app/listing/[id].tsx`
**Scope:** Before marking a pin as no-longer-there, confirm via alert. Too many accidental taps reported.
**Acceptance:** Alert fires; Cancel leaves state unchanged.

## 8. Add `lastVerified` badge to pin cards
**Files:** `components/PinCard.tsx`, `lib/ripeness.ts`
**Scope:** Show "✓ confirmed 3 days ago" / "⚠ stale — 2 months" / "new" badge based on most recent confirmation timestamp.
**Acceptance:** Three visual variants, pulled from `tokens.color`.

## 9. Offline queue indicator
**Files:** `components/OfflineBanner.tsx` (new), root layout
**Scope:** When Instant detects offline + there are pending writes, show a non-blocking banner: "Offline — X pins will sync when you reconnect."
**Acceptance:** Airplane mode → banner appears; reconnect → banner dismisses + writes flush.

## 10. Species catalog: toxicity warnings visible on pin creation
**Files:** `app/add/species.tsx`, `lib/toxicity.ts`
**Scope:** When selecting a species with `toxicity != null`, show a yellow warning card with the toxicity code expanded ("pit is cyanogenic — do not chew seeds").
**Acceptance:** Warning blocks nothing but forces a "I understand" tap before continuing.

---

## Harder but well-scoped

## 11. PostHog-free error reporting
**Scope:** Self-hosted Sentry via Docker Compose in `infra/`. Opt-in only, off by default. PII stripped before send.

## 12. Accessibility audit pass
**Scope:** Every interactive element has `accessibilityLabel`, `accessibilityRole`, hit slop ≥ 44pt. Run VoiceOver end-to-end.

## 13. Photo blur tool
**Scope:** Before uploading, let user blur parts of the photo (license plates, faces, house numbers). Privacy-preserving.

---

Not on this list: anything that changes the schema, licensing, or privacy defaults. Those need design discussion first.
