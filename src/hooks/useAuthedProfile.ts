/**
 * useAuthedProfile — the signed-in user's Instant profile, auto-created on first use.
 * Uses InstantDB's magic-code auth under the hood (see screens/auth.tsx).
 */

import { useEffect } from "react";
import { db } from "../db/client";
import { id as newId } from "@instantdb/react-native";

export function useAuthedProfile() {
  const { user } = db.useAuth();
  const { data } = db.useQuery(
    user ? { profiles: { $: { where: { id: user.id } } } } : null,
  );
  const profile = (data?.profiles?.[0] ?? null) as any | null;

  // Auto-create a profile on first sign-in.
  useEffect(() => {
    if (user && !profile) {
      db.transact(
        db.tx.profiles[user.id].update({
          // Never derive public names from the login email: profiles are public, so the local part
          // would publish half of the address the magic code goes to (security scan 2026-10-22, F2).
          handle: randomHandle(),
          displayName: "New forager",
          joinedAt: Date.now(),
          pinsCount: 0,
          confirmsCount: 0,
          badges: [],
          fuzzyLocation: true,
          anonymizeReports: false,
        }),
      );
    }
  }, [user?.id, profile?.id]);

  return { user, profile };
}

/** `forager-` + 10 hex chars from a fresh random (v4) Instant id: opaque, and nothing to do with the email. */
function randomHandle(): string {
  return `forager-${newId().replace(/-/g, "").slice(-10)}`;
}

export { newId };
