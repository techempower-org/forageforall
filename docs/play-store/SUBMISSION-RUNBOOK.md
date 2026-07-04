# Google Play submission runbook — Forage for All

Goal: submission day is ~20–30 minutes of clicking. Everything derivable was done
on branch `feat/play-store-submission`; this file sequences the rest.

**Companion sheets** (all in `docs/play-store/`):
`listing.md` (paste-ready copy EN/ES) · `data-safety.md` (form answers + citations) ·
`content-rating.md` (IARC answers) · `assets.md` (graphics + screenshot capture list)

**Already done on this branch — no action needed:**
- `eas.json`: `production` profile → AAB, remote versionCode (`autoIncrement`), submit lane pre-wired
- `app.config.ts`: stable applicationId `org.forageforall.app`, permissions minimized
  (location only; unused camera/audio/storage **blocked**), `targetSdkVersion 35` via
  `expo-build-properties` (Play hard-requires ≥35 for new apps since 2025-08-31)
- Hosted privacy policy → `https://techempower.org/forageforall/privacy` (live; on the
  publisher's own domain, auto-generated from this repo's `PRIVACY.md` — see
  maintenance note in 2.3)
- Hosted deletion page → `https://forage.techempower.org/delete-account.html`
  (+ in-app Profile → Delete account entry point, as Play's deletion policy requires)
- Play icon 512 + feature graphic 1024×500 generated (`assets/` here)

**Genuinely JP-only:** Play Console account (+ payment), Expo account (owner
`kasdf`), Google Cloud console for the Maps key, real-device screenshots.

---

## Phase 0 — Lead-time items (start these NOW; they gate everything)

**0.1 · Play Console developer account — ORGANIZATION type** — *JP, ~30 min + wait*

- Register at play.google.com/console → **Organization** account, $25 one-time.
- Use a TechEmpower Google account (e.g. Workspace identity on techempower.org),
  **not** a personal gmail — the account owns the app forever.
- Org accounts require a **D-U-N-S number** for TechEmpower. Check first at
  dnb.com (many 501(c)(3)s already have one via grants/SAM.gov). If none, the
  free request can take **up to 30 days** → this is the long pole; start today.
- Why org (not personal): personal accounts created after Nov 2023 must run a
  closed test with **12 testers for 14 days** before production access.
  Org accounts skip that entirely, and the listing shows the nonprofit's name.
- Also prepare: org website `https://techempower.org`, support email
  `jp@techempower.org`, and expect identity/website verification steps.

**0.2 · Confirm Expo access** — *JP, 2 min*

```bash
npx eas whoami        # must be (or belong to org) `kasdf` — app.config.ts `owner`
```
Project is already linked: `extra.eas.projectId = 19ec7145-38b0-4627-bf42-7ae7332d44e8`.
(`EXPO_TOKEN` also already exists as a GitHub Actions secret — release.yml uses it.)

---

## Phase 1 — One-time technical setup (terminal, ~15 min + build wait)

**1.1 · Build env.** `app.config.ts` reads env at build time. Simplest (dynamic
config resolves env when the CLI runs):

```bash
cd ~/Projects/forageforall && git checkout main && git pull   # after this branch merges
set -a; source .env; set +a    # needs GOOGLE_MAPS_ANDROID_KEY, INSTANT_APP_ID
```

More durable alternative (set once, builds never depend on local .env again):

```bash
npx eas env:create --scope project --name GOOGLE_MAPS_ANDROID_KEY --value '<key>' --visibility secret
npx eas env:create --scope project --name INSTANT_APP_ID --value '32870e24-647d-452a-ab13-fdaa0a8d8564' --visibility plaintext
# older EAS CLIs: `eas secret:create` — same idea
```

**1.2 · First production build (AAB):**

```bash
npx eas build --platform android --profile production
```

- First run prompts *“Generate a new Android Keystore?”* → **Yes** (EAS-managed
  upload key — never lives on disk here).
- `autoIncrement` + remote version source → versionCode is managed by EAS,
  starting at 1. (Optional: `npx eas build:version:set --platform android` to
  choose a starting number.)
- Artifact: the build page on expo.dev → download the `.aab`.

> **⚠️ Contingency — if Gradle fails around SDK/API 35:** Expo SDK 51 defaults to
> targetSdk 34; this branch overrides to 35 (`expo-build-properties`), which is the
> minimal path past Play's ≥35 gate but is not an officially blessed SDK 51 combo
> (RN 0.74 / AGP 8.2 era). If the cloud build breaks on it, the correct fix is the
> **Expo SDK 52+ upgrade** (targets 35 natively) — a separate epic, not a tweak.
> Do NOT ship targetSdk 34; Play rejects the upload. Also note the next cliff:
> **~2026-08-31 Play's bar for new apps moves to API 36** — submit before then,
> or the SDK upgrade stops being optional.

**1.3 · Maps API key restriction — the classic blank-map bug.** *JP (GCP console).*

The Android Maps key must be restricted to the app signature or maps render blank
tiles in release builds:

1. `npx eas credentials --platform android` → note the **upload keystore SHA-1**.
2. GCP console → APIs & Services → Credentials → the Android Maps key →
   Application restrictions: Android apps → add
   `org.forageforall.app` + the upload SHA-1.
3. **After the first Play upload** (step 2.4): Play Console → Test and release →
   Setup → App integrity → copy the **App signing key certificate SHA-1**
   (Google re-signs with its own key) and add it to the same restriction.
   Miss this and the map is blank *only* for Play-installed builds — the
   most confusing possible failure.

**1.4 · Smoke test on Android 15.** Because targetSdk 35 turns on edge-to-edge
enforcement on Android 15 devices: run the app on an **API 35 emulator** and check
headers/footers aren't drawn under system bars (screens use
`react-native-safe-area-context` throughout, so this should pass — but look).
This doubles as the screenshot session — capture list in `assets.md`.

---

## Phase 2 — Play Console (submission day, ~20–30 min of clicking)

**2.1 · Create the app.** All apps → Create app →
App name: `Forage for All: wild food map` (see listing.md; editable later) ·
Default language `en-US` · **App** · **Free** (⚠️ free is permanent — fine, that's the mission) ·
accept declarations.

**2.2 · Main store listing.** Paste everything from **`listing.md`**: short +
full descriptions, upload `assets/play-icon-512.png`, `assets/feature-graphic-1024x500.png`,
and ≥2 phone screenshots (from the 1.4 session). Then *Manage translations →
es-US* and paste the Spanish set.

**2.3 · App content forms** (Policy → App content; do them in one sitting):

| Form | Answer | Source |
|---|---|---|
| Privacy policy | `https://techempower.org/forageforall/privacy` | — |
| App access | “All functionality available without special access” — browsing is anonymous; publishing uses open self-serve signup (any email, magic code — a reviewer can create an account in seconds; pre-provisioned test credentials are impossible with magic-code auth) | — |
| Ads | **No** | AGENTS.md hard rule |
| Content rating | Fill per **`content-rating.md`** | sheet |
| Target audience | 13–15, 16–17, 18+ · not appealing to children | sheet |
| News app | No | — |
| COVID-19 tracing | No | — |
| Data safety | Fill per **`data-safety.md`** — incl. the Maps-SDK-guidance check flagged ⚠️ there | sheet |
| Data deletion | `https://forage.techempower.org/delete-account.html` | sheet |
| Government app | No | — |
| Financial features | None | — |
| Health | None | — |

> **Keeping the hosted policy in sync:** the privacy URL above is a static page
> on techempower.org generated **from this repo's `PRIVACY.md`**. If `PRIVACY.md`
> changes, regenerate the page in the techempower.org repo via `npx marked` →
> `lib/data/privacy-forageforall.ts` (documented in that repo's commit `19ad615`)
> and redeploy. PRIVACY.md stays the single source of truth — never edit the
> hosted page directly.

**2.4 · First upload → Internal testing.** Test and release → Internal testing →
Create release → upload the `.aab` from 1.2 → release notes (one line:
“First Play build — community map of edible plants on public land.”) → add a
tester email list (JP + team) → roll out.

> Note: the **first** artifact of a new app must be uploaded manually in the
> Console — `eas submit` (Google's API) only works from the second release on.

Complete step **1.3.3** (Play App Signing SHA-1 → Maps key) right after this upload.

**2.5 · Verify on-device via the internal opt-in link:** map tiles render
(Maps key!), browse + layer toggles, magic-code sign-in, pin creation
(check the created pin's coords are 3-decimal fuzzed), Profile → Delete account
opens the hosted page.

**2.6 · Optional closed beta.** Promote the internal release → Closed testing →
share the opt-in URL (nice tie-in for the Nevada County audience / the show).
Not required for an org account — skip if eager.

**2.7 · Production.** Promote the same release → Production → staged rollout
(20% → 100% after a quiet day or two). New-app review typically takes **1–7 days**;
don't schedule anything against it.

**2.8 · After approval:** add the Play listing link to README “Install”,
`docs/index.html`, and the show's get-help resources; confirm the GitHub-Releases
APK section points people to Play as the preferred path.

---

## Phase 3 — Every release after this one

One-time (~10 min): Play Console → Setup → API access → link a GCP project →
create a service account → grant it **Release manager** on the app → download the
JSON key → save as `./play-service-account.json` (already gitignored; eas.json
already points at it, track `internal`).

Then the loop is:

```bash
# 1. bump `version` in app.config.ts + package.json (versionCode is automatic/remote)
# 2. build + submit:
npx eas build --platform android --profile production --auto-submit
# (or: npx eas build ... && npx eas submit --platform android --profile production)
# 3. promote internal → production in the Console (or raise the track in eas.json)
```

Optionally wire this into `.github/workflows/release.yml` later — `EXPO_TOKEN`
is already there; add the service-account JSON as a GH secret and a
`--profile production --auto-submit` job on version tags.

---

## Risk register (ranked)

1. **targetSdk 35 on Expo SDK 51** — the AAB now *uploads* (≥35 required), but the
   combo is unvalidated until the first EAS build + Android 15 smoke test pass
   (steps 1.2/1.4). Fallback: Expo SDK 52+ upgrade. Deadline pressure: API 36
   becomes the bar for new apps ~2026-08-31.
2. **D-U-N-S / org-account verification lead time** — up to ~30 days worst case.
   Start Phase 0 immediately; everything else can proceed in parallel.
3. **Maps key restriction misses the Play App Signing SHA-1** — blank maps only in
   Play-delivered builds (step 1.3.3 exists precisely for this).
4. **Data-safety drift** — the sheet is code-derived *today*; photo upload or any
   analytics/crash SDK flips answers. The sheet's final section has a 5-minute
   re-verify script — run it every submission.
5. **Review friction on UGC** — flagging + moderation + ethics doc satisfy the UGC
   policy; user-level blocking is a noted fast-follow if a reviewer asks.
