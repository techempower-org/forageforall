# Play Console Data Safety form — answer sheet

**Console path:** App content → Data safety.
**Discipline:** every answer below is derived from code on this branch, with the file
that proves it. If the code changes (photo upload ships, analytics get added — they
won't — auth changes), re-derive before resubmitting. Under-declaring is what gets
apps rejected and strikes issued; there is no penalty for this sheet's precision.

Verified against commit on branch `feat/play-store-submission` (Expo SDK 51 app,
InstantDB backend, Google Maps SDK).

---

## Overview questions

| Question | Answer | Evidence |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Email + pins are transmitted to InstantDB (`src/db/client.ts`, `src/db/actions.ts`) |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | InstantDB client connects over HTTPS/WSS (`@instantdb/react-native`); Google Maps SDK uses HTTPS. No custom network code in the app (no `fetch`/`XMLHttpRequest` to plain-HTTP hosts anywhere in `app/` or `src/`) |
| Do you provide a way for users to request that their data is deleted? | **Yes** | In-app: Profile → Delete account (`app/(tabs)/profile.tsx`) linking to the hosted request page; web: `https://forage.techempower.org/delete-account.html`. Users can also delete individual pins/reports/comments directly — `instant.perms.ts` grants owners delete on `listings`, `reports`, `comments`, `saves` |

## Account deletion (separate form: App content → Data deletion)

- Account creation supported? **Yes** — email magic-code (`app/auth.tsx:27` `db.auth.sendMagicCode`).
- Deletion request URL: **`https://forage.techempower.org/delete-account.html`**
- In-app deletion path: Profile → *Delete account* (opens the URL above — the policy
  explicitly permits a link-out; `app/(tabs)/profile.tsx`).
- Can users delete some data without deleting the account? **Yes** — own
  pins/reports/comments/saves, enforced by `instant.perms.ts` owner rules.

---

## Data types — what IS collected

“Collected” per Play = transmitted off the device. Everything below goes to
InstantDB (our backend/service provider) and nowhere else.

### 1. Location → **Precise location: COLLECTED**

| Sub-question | Answer |
|---|---|
| Collected | Yes |
| Shared | No (service-provider processing only — see third-party section) |
| Processed ephemerally | No (pins persist) |
| Required or optional | **Optional** — only transmitted when a signed-in user publishes a pin; browsing sends nothing |
| Purposes | App functionality |

**Evidence and the reasoning for “Precise” (read before changing this answer):**

- The add-pin flow prefills the pin coordinate from device GPS
  (`app/add.tsx:54-56` seeds `coord` from `useCurrentLocation`), so the uploaded
  pin coordinate is user location data, not just arbitrary map content.
- Before ANY write, coordinates are rounded to a ~110 m grid:
  `app/add.tsx:106` passes `fuzzy: true` → `src/db/actions.ts:34-35` applies
  `fuzzCoord` → `src/lib/geo.ts:85-88` rounds to 3 decimals.
- The raw GPS fix itself never leaves the device: `src/hooks/useCurrentLocation.ts`
  keeps it in component state; nothing transmits it. It only centers the map.
- **Why declare “Precise” anyway:** Google defines “approximate” as an area of
  **≥ 3 km²**. A ~110 m grid cell is ~0.012 km² — finer than Google's threshold —
  so the honest checkbox is Precise. Declaring Approximate instead would be
  under-declaration (rejection/strike risk). Do not “optimize” this answer.
- Declare **Precise location only** (leave Approximate unchecked): the form wants
  the granularity actually collected, and one truthful entry beats two overlapping ones.

Note on permissions: the manifest requests `ACCESS_FINE_LOCATION` +
`ACCESS_COARSE_LOCATION` (foreground only — `app.config.ts`). There is **no**
`ACCESS_BACKGROUND_LOCATION`, so Play's separate location-permissions declaration
(+ demo video) is **not** triggered. Never add background location casually.

### 2. Personal info → **Email address: COLLECTED**

| Sub-question | Answer |
|---|---|
| Collected | Yes |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | **Optional** — browsing works signed-out; only publishing requires an account (`app/add.tsx:69-94` gates submit behind sign-in) |
| Purposes | Account management |

Evidence: `app/auth.tsx:27,39` — `db.auth.sendMagicCode` / `signInWithMagicCode`;
email is the entire credential (no passwords). Stored by InstantDB auth.

### 3. Personal info → **Name: COLLECTED**

| Sub-question | Answer |
|---|---|
| Collected | Yes |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | Optional (user-chosen display name/handle; pseudonyms fine) |
| Purposes | App functionality (shown on pins/comments), Account management |

Evidence: `src/db/schema.ts:69-79` — `profiles.handle`, `profiles.displayName`;
shown publicly per PRIVACY.md. Visible to other app users, which Play does **not**
count as “sharing” (sharing = transfer to third parties).

### 4. Personal info → **User IDs: COLLECTED**

| Sub-question | Answer |
|---|---|
| Collected | Yes |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | Optional (exists only if an account is created) |
| Purposes | Account management, App functionality |

Evidence: InstantDB `auth.id` links content to authors — `instant.perms.ts`
(`data.createdBy == auth.id`, `data.author == auth.id`), `src/db/actions.ts:56`
(`.link({ ..., createdBy: input.userId })`).

### 5. App activity → **Other user-generated content: COLLECTED**

| Sub-question | Answer |
|---|---|
| Collected | Yes |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | Optional |
| Purposes | App functionality |

Evidence: pin titles/notes/access flags (`src/db/actions.ts:37-56`), ripeness
reports (`:70-102`), comments (`:104-119`), moderation flags (`:137-153`).
Public by design (fuzzed coords), per PRIVACY.md “What's public vs private”.

---

## Data types — what is NOT collected (and the proof)

| Play data type | Answer | Evidence |
|---|---|---|
| Approximate location | No (Precise declared instead — see §1) | — |
| Photos and videos | **No** | Zero usages: `grep -rn "expo-camera\|expo-image-picker" app/ src/` → no matches. The packages are installed for a roadmap feature but no code path invokes them; their manifest permissions are blocked in `app.config.ts` (`blockedPermissions`). `reports.photoUrl` exists in the schema but no caller supplies it (`app/listing/[id].tsx` submits ripeness/note only). **When photo upload ships, this answer flips — update the form first.** |
| Audio files / voice | No | No recording code; `RECORD_AUDIO` explicitly blocked (`app.config.ts`) |
| Files and docs | No | No document APIs used |
| Calendar / Contacts | No | No such APIs or permissions |
| Financial / payment info | No | Nothing purchasable; no billing SDK in `package.json` |
| Health and fitness | No | n/a |
| Messages (email/SMS/other) | No | Comments are public content on listings, declared under “Other user-generated content”, not private messages |
| Web browsing history | No | No browser component |
| In-app search history | No | Species search filters entirely client-side — `app/add.tsx:44-52` and `app/(tabs)/browse.tsx:44-53` filter already-fetched arrays in memory; the query string is never transmitted |
| App interactions / installed apps | No | **No analytics of any kind** — no GA/Firebase/Amplitude/Mixpanel/Segment/PostHog in `package.json` (hard rule in AGENTS.md) |
| Crash logs / Diagnostics | No | No crash SDK: `grep -rn "sentry\|crashlytics\|bugsnag"` → no matches. (If self-hosted opt-in Sentry ever lands per PRIVACY.md, re-declare) |
| Device or other IDs | No | No advertising-ID SDKs; the InstantDB auth UUID is declared under User IDs |

---

## Third parties — “shared” answers

Play defines **sharing** as transfer to a third party, excluding service providers
processing on the developer's behalf.

- **InstantDB** — backend/service provider storing the data above on our behalf →
  **not “shared”** under Play's definition. (instantdb.com/privacy)
- **Google Maps SDK for Android** — serves map tiles; sees viewport + standard
  request metadata (IP). ⚠️ **VERIFY ON SUBMISSION DAY:** Google publishes
  data-safety disclosure guidance for its own Maps SDK — check
  <https://developers.google.com/maps/documentation/android-sdk/data-disclosures>
  (“Data practices disclosures”) and merge whatever it currently instructs
  (historically: possible Diagnostics/Performance entries collected by the SDK
  itself). This is the one part of the form not derivable from our code.

**No data is sold. No data goes to advertisers or data brokers — there are none.**

---

## Re-verify before submitting (5 minutes)

```bash
# photos really not collected?
grep -rn "expo-camera\|expo-image-picker\|launchCamera\|launchImageLibrary" app/ src/
# analytics really absent?
grep -rn "firebase\|amplitude\|mixpanel\|segment\|posthog\|analytics" package.json app/ src/
# crash reporting really absent?
grep -rn "sentry\|crashlytics\|bugsnag" package.json app/ src/
# fuzz still applied at write?
grep -n "fuzzCoord" src/db/actions.ts src/lib/geo.ts
# background location still absent?
grep -n "BACKGROUND" app.config.ts
```

All five should come back empty or matching the citations above. If any don't,
STOP and re-derive this sheet.
