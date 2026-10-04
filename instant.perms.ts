/**
 * InstantDB permission rules — push with `npm run perms:push`.
 *
 * Keys to remember:
 *  - All writes require auth. Species are admin-only to write (seed scripts use the admin token,
 *    which bypasses rules).
 *  - Creates must link the caller as owner/author in the same transaction (no posting as someone else).
 *  - Owners may edit their rows' FIELDS but never re-point the owner link (`createdBy` / `author`),
 *    so nobody can hand a row to someone else after creating it.
 *  - Non-owners may update ONLY a listing's report aggregates (submitReport in src/db/actions.ts
 *    writes them as the reporter), within sane bounds.
 *  - Profile stats (badges, pinsCount, confirmsCount) start at zero and can't be self-edited.
 *  - `$default` denies every namespace not listed here; `attrs.create` stays open so new fields
 *    (e.g. flags.note / flags.createdAt, absent from prod's schema) can still be written.
 *
 * Instant rule semantics this relies on (measured on self-hosted Instant, 2026-10-04):
 *  - A link/unlink can arrive with an EMPTY request.modifiedFields, and `.all()` over an empty list is
 *    true, hence every `size(request.modifiedFields) > 0`.
 *  - Do NOT add `allow.link` rules: they REPLACE the update check for link operations, which re-opened
 *    a full ownership takeover in testing.
 *  - `newData.ref(...)` and `request.time.unixMillis()` are not supported, so `lastConfirmedAt`
 *    cannot be bounded against the clock.
 *  - `size()` on a JSON-typed attr (e.g. badges) makes the server error (HTTP 500): use `== []`.
 *  - Omitting an action allows it, so every namespace lists all four.
 *
 * saves / flags are CLOSED for reading (create-only) until the schema is pushed: on the production app
 * the `saves.user` and `flags.author` links point at phantom namespaces (`user`, `author`), not
 * `profiles`, so any `data.ref('user.id')` rule errors (HTTP 400) and the profile screen's
 * `profiles.saves` never resolves anyway. After `npm run schema:push`, reopen them with
 *   saves.view/delete: "auth.id != null && auth.id in data.ref('user.id')"
 *   flags.view:        "auth.isAdmin == true || auth.id in data.ref('author.id')"
 * Verified with creek-watch scratch/forage/bin/{perms_ab,code_probe,bypass_probe,link_probe}.py.
 */

const changed = "size(request.modifiedFields) > 0";

// Owner may edit fields, never the owner link itself.
const ownerEdit = (link: string) =>
  `auth.id != null && auth.id in data.ref('${link}.id') && ${changed} && !('${link}' in request.modifiedFields)`;
const ownerOf = (link: string) => `auth.id != null && auth.id in data.ref('${link}.id')`;

// Fields any signed-in user may change on any listing (report aggregates, see submitReport).
const REPORT_AGGREGATES = "['currentRipeness','reportCount','stillThereScore','lastConfirmedAt']";
const prevCount = "(data.reportCount == null ? 0 : data.reportCount)";
const aggregatesOnly = [
  "auth.id != null",
  changed,
  `request.modifiedFields.all(f, f in ${REPORT_AGGREGATES})`,
  "(!('currentRipeness' in request.modifiedFields) || (newData.currentRipeness >= 0 && newData.currentRipeness <= 4))",
  "(!('stillThereScore' in request.modifiedFields) || (double(newData.stillThereScore) >= 0.0 && double(newData.stillThereScore) <= 1.0))",
  `(!('reportCount' in request.modifiedFields) || (newData.reportCount >= ${prevCount} && newData.reportCount <= ${prevCount} + 2))`,
].join(" && ");

const PROFILE_STATS = "['badges','pinsCount','confirmsCount']";

const rules = {
  $default: {
    allow: {
      $default: "false",
    },
  },
  attrs: {
    allow: {
      create: "true",
    },
  },
  species: {
    allow: {
      view: "true",
      create: "auth.id != null && auth.isAdmin == true",
      update: "auth.isAdmin == true",
      delete: "auth.isAdmin == true",
    },
  },
  listings: {
    allow: {
      view: "true",
      create: ownerOf("createdBy"),
      update: `(${ownerEdit("createdBy")}) || (${aggregatesOnly})`,
      delete: ownerOf("createdBy"),
    },
  },
  reports: {
    allow: {
      view: "true",
      create: ownerOf("author"),
      update: ownerEdit("author"),
      delete: ownerOf("author"),
    },
  },
  comments: {
    allow: {
      view: "true",
      create: ownerOf("author"),
      update: ownerEdit("author"),
      delete: ownerOf("author"),
    },
  },
  profiles: {
    allow: {
      view: "true",
      // A profile's id is its user's id (useAuthedProfile); nobody creates one for someone else.
      create: [
        "auth.id != null && data.id == auth.id",
        "(data.badges == null || data.badges == [])",
        "(data.pinsCount == null || data.pinsCount == 0)",
        "(data.confirmsCount == null || data.confirmsCount == 0)",
      ].join(" && "),
      update: `auth.id != null && data.id == auth.id && ${changed} && !request.modifiedFields.exists(f, f in ${PROFILE_STATS})`,
      delete: "auth.id != null && data.id == auth.id",
    },
  },
  saves: {
    allow: {
      view: "false",
      create: "auth.id != null",
      update: "false",
      delete: "false",
    },
  },
  flags: {
    allow: {
      view: "auth.isAdmin == true",
      create: "auth.id != null",
      update: "auth.isAdmin == true",
      delete: "auth.isAdmin == true",
    },
  },
};

export default rules;
