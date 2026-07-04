# Content rating questionnaire (IARC) — answer sheet

**Console path:** App content → Content ratings → Start questionnaire.
Email of record: `jp@techempower.org`.

The IARC questionnaire generates ratings for all regions at once (ESRB, PEGI,
USK, etc.). Same discipline as the data-safety sheet: answers derived from code,
citations included. Misrepresenting answers here is an enforcement offense —
over-disclosure costs only a milder-looking label, so the two “Yes” answers below
are deliberate conservatism.

## Category selection

**“All other app types”** (a.k.a. Utility / Productivity / Communication / Other) —
the app is a map/reference tool with community features. It is not a game, not a
social network at its core, not a content aggregator.

## Questionnaire answers

| Question (paraphrased) | Answer | Why / evidence |
|---|---|---|
| Violence — realistic, fantasy, or otherwise | **No** | Map + plant catalog; nothing depicts violence |
| Sexuality / nudity | **No** | n/a |
| Profanity or crude humor | **No** | All strings are utility copy; UGC is covered by the interaction questions below |
| Drugs, alcohol, tobacco — depiction, use, or references | **No** | The species catalog is food: fruit, nuts, herbs, culinary mushrooms (`scripts/seed-species.ts`). No psychoactive framing anywhere; toxic species carry *warnings* (`species.isToxic`, `lookAlikes` — `src/db/schema.ts:18-19`) to keep people safe, which is the opposite of promoting substance use |
| Gambling — simulated or real | **No** | n/a |
| Does the app contain user-generated content or allow users to interact/exchange content? | **Yes** | Pins, notes, ripeness reports, comments visible to all users (`src/db/actions.ts`; `instant.perms.ts` `view: "true"`) |
| Does the app share the user's current physical location with other users? | **Yes** (conservative) | Pins are user-authored locations, prefilled from device GPS and published publicly (fuzzed to ~110 m — `src/db/actions.ts:34-35`). It is *chosen places*, not live tracking, but a reviewer could reasonably read pins as revealing where the user is/was — answer Yes and take the “Shares Location” interactive-elements label |
| Can users purchase digital goods? | **No** | Nothing purchasable; no billing library in `package.json` |
| Does the app contain ads / promotional content? | **No** | Hard rule — no ad SDKs (AGENTS.md “What we will NOT merge”) |
| Unrestricted web access (built-in browser)? | **No** | No browser component; external links open the system browser |

## Expected outcome

**ESRB: Everyone · PEGI 3** (or regional equivalents), with **Interactive
Elements: Users Interact, Shares Location** labels. That label set is normal for
community map apps and does not restrict distribution.

## UGC policy compliance (reviewers check this for any “Yes” on UGC)

Play's UGC policy expects in-app moderation affordances. Status:

| Requirement | Status | Evidence |
|---|---|---|
| Users can report/flag content | ✅ | Flag flow on every listing — `app/listing/[id].tsx:117` `flagListing(...)`; flags land in a moderator queue (`flags` entity; only admins view/resolve — `instant.perms.ts:60-67`) |
| Content rules published | ✅ | `FORAGING_ETHICS.md` + `CODE_OF_CONDUCT.md`, enforced by moderators; sensitive-species blocklist policy |
| Moderation capability | ✅ | Admin-gated flag resolution + species-catalog control (`instant.perms.ts` `auth.isAdmin`) |
| Block abusive **users** (not just content) | ⚠️ Not yet | No user-level block. For an app of this size flagging + moderation generally satisfies review; note as a fast-follow if Play asks (low risk, don't preempt) |

## Target audience (separate form: App content → Target audience and content)

- Age groups: **13–15, 16–17, 18+** (do NOT select under-13 — PRIVACY.md: “Not
  directed at under-13s”). Selecting any under-13 group triggers Families policy
  requirements we do not want.
- “Appeals to children” follow-up: answer **No** — earth-tone map/reference tool,
  no child-directed characters or gameplay.
