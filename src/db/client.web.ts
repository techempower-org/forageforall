/**
 * Web-specific InstantDB client — uses @instantdb/react instead of
 * @instantdb/react-native. Metro resolves .web.ts before .ts on web.
 *
 * Reads the same app.config.ts `extra` as the native client. (process.env.INSTANT_APP_ID
 * is NOT inlined into the browser bundle — only EXPO_PUBLIC_* is — so reading it here
 * silently ignored the CI secret and used a hard-coded id.)
 */

import { init } from "@instantdb/react";
import Constants from "expo-constants";
import schema from "./schema";

const extra = Constants.expoConfig?.extra ?? {};

export const db = init({
  appId: (extra.instantAppId as string | undefined) ?? "MISSING_INSTANT_APP_ID",
  apiURI: extra.instantApiURI as string | undefined,
  websocketURI: extra.instantWebsocketURI as string | undefined,
  schema,
} as any);
export { schema };
