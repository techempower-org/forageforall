/**
 * InstantDB client singleton.
 * Points at self-hosted Instant (realm-cloud); app id / API / WebSocket come from
 * app.config.ts `extra` (env INSTANT_APP_ID, INSTANT_API_URI, INSTANT_WEBSOCKET_URI).
 */

import { init } from "@instantdb/react-native";
import Constants from "expo-constants";
import schema from "./schema";

const appId =
  (Constants.expoConfig?.extra?.instantAppId as string | undefined) ??
  process.env.INSTANT_APP_ID;

if (!appId) {
  // Fatal but developer-friendly — the app will render a fallback screen.
  console.warn(
    "[forage] INSTANT_APP_ID is not set. Copy .env.example to .env and fill it in.",
  );
}

const extra = Constants.expoConfig?.extra ?? {};

export const db = init({
  appId: appId ?? "MISSING_INSTANT_APP_ID",
  apiURI: extra.instantApiURI as string | undefined,
  websocketURI: extra.instantWebsocketURI as string | undefined,
  schema,
});

export { schema };
