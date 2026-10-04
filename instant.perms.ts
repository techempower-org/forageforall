/**
 * InstantDB permission rules — push with `npm run perms:push`.
 *
 * Keys to remember:
 *  - All writes require auth.
 *  - Only authors can edit their own listings/reports/comments; only you can edit your profile.
 *  - Species are admin-only to write (the seed scripts use the admin token, which bypasses rules).
 *  - Ownership checks use `data.ref('<link>.id')` (Instant's documented form for links).
 *  - Creates must link the caller as owner/author in the same transaction (no posting as someone else).
 *  - Non-owners may update ONLY a listing's report aggregates (submitReport in src/db/actions.ts
 *    writes them as the reporter). `size(...) > 0` matters: a bare link/unlink arrives with an empty
 *    modifiedFields, and `.all()` over an empty list is true, so without it anyone could unlink a
 *    listing's creator.
 *
 * saves / flags are CLOSED for reading (create-only) until the schema is pushed:
 * on the production app the `saves.user` and `flags.author` links were auto-created
 * pointing at phantom namespaces (`user`, `author`) instead of `profiles`, so
 * `data.ref('user.id')` errors (HTTP 400 "Record not found: attr") and the
 * profile screen's `profiles.saves` never resolves anyway. After `npm run schema:push`
 * fixes the links, reopen them with:
 *   saves.view/delete: "auth.id != null && auth.id in data.ref('user.id')"
 *   flags.view:        "auth.isAdmin == true || auth.id in data.ref('author.id')"
 * Verified with creek-watch scratch/forage/bin/perms_ab.py (56 checks) on a restored copy.
 */

const owner = (link: string) => `auth.id != null && auth.id in data.ref('${link}.id')`;

// Fields any signed-in user may change on any listing (report aggregates, see submitReport).
const REPORT_AGGREGATES = "['currentRipeness','reportCount','stillThereScore','lastConfirmedAt']";
const aggregatesOnly =
  `auth.id != null && size(request.modifiedFields) > 0 && request.modifiedFields.all(f, f in ${REPORT_AGGREGATES})`;

const rules = {
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
      create: owner("createdBy"),
      update: `(${owner("createdBy")}) || (${aggregatesOnly})`,
      delete: owner("createdBy"),
    },
  },
  reports: {
    allow: {
      view: "true",
      create: owner("author"),
      update: owner("author"),
      delete: owner("author"),
    },
  },
  comments: {
    allow: {
      view: "true",
      create: owner("author"),
      update: owner("author"),
      delete: owner("author"),
    },
  },
  profiles: {
    allow: {
      view: "true",
      // A profile's id is its user's id (useAuthedProfile); nobody creates one for someone else.
      create: "auth.id != null && data.id == auth.id",
      update: "auth.id != null && data.id == auth.id",
      delete: "auth.id != null && data.id == auth.id",
    },
  },
  saves: {
    allow: {
      view: "false",
      create: "auth.id != null",
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
