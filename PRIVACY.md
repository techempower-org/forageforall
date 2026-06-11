# Privacy Policy

**Last updated: April 2026**

This is the whole policy. No dark patterns, no legalese.

## What we collect

| Data | Why | Stored where | Retention |
|---|---|---|---|
| Email (if you sign up) | Magic-link auth only | InstantDB | Until you delete your account |
| Pins you create | The product | InstantDB | Until you delete them |
| Photos you upload | Shown on pins | InstantDB file storage | Until you delete them |
| Coarse device location (while app open) | To center the map | Device only, never sent | Session only |

## What we do NOT collect

- Analytics. No Google Analytics, no PostHog, no Amplitude, no Mixpanel, no Segment.
- Crash reports that phone home. (If enabled opt-in later, will be self-hosted Sentry with PII stripped.)
- Advertising IDs (IDFA / AAID).
- Social graph, contacts, calendar, photos beyond what you explicitly share.
- Precise location history.

## What's public vs private

**Public** (anyone using the app can see):
- Pins you create (with fuzzy location ~110m by default)
- Photos on pins
- Your display name on pins and comments
- Ripeness confirmations you add to other pins

**Private** (only you can see):
- Pins you explicitly mark private
- Pins you've saved/bookmarked
- Your email
- Your precise device location (never leaves your device)

## Fuzzy locations

By default, coordinates are rounded to a ~110m grid before we save them. This means:
- A pin at `47.6205°N, 122.3493°W` gets stored as `47.621°N, 122.349°W`
- Foragers can find the general spot; stalkers can't pinpoint your garden
- You can opt-in to precise coords on your own pins (stays private to you)

## Sharing with third parties

None, except:
- **Google Maps** sees the map bounds you're viewing (standard maps SDK behavior)
- **InstantDB** stores our data (they're our backend provider — see [their privacy policy](https://instantdb.com/privacy))

We have never sold and will never sell user data. If this project is ever transferred, this policy transfers with it or users are notified and can export+delete.

## Your rights

- **Export:** Settings → Export my data → downloadable JSON
- **Delete:** Settings → Delete account → wipes everything within 30 days
- **Correct:** Edit any pin or profile field directly

## Children

Not directed at under-13s. We don't knowingly collect data from them.

## Changes

We'll post updates here and notify in-app for any material change.

## Contact

jp@techempower.org
