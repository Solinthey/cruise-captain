# Cruise Captain — Architecture Spec (MVP)

This doc translates the project brief into concrete technical decisions a coding
session can build directly from. It intentionally leaves implementation details
(exact function signatures, file names) to whoever writes the code — it fixes the
*shape* of the system, not the syntax.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | React Native | Single codebase for iOS + Android |
| Online maps/routing | Google Maps Platform SDK | Live tiles, live turn-by-turn, live recalculation |
| Offline maps | MapLibre + OpenStreetMap tiles | Pre-fetched per-route, before entering a dead zone |
| Route planning (organizer-side) | Google My Maps → KML/GeoJSON export | Converter script is post-MVP |
| Backend | None for MVP | Routes are static files served from a link, no server logic needed |
| Distribution | Deep link per event (text/email) | No in-app discovery |

No backend/database is needed for MVP — this significantly simplifies the build.
A route is just a data file reachable by URL.

---

## 2. Route Data Model

A route is the one piece of domain data the whole app revolves around. Suggested
shape (organizer's own data — safe to cache offline, not Google content):

```json
{
  "routeId": "wvca-2026-fall-cruise",
  "name": "WVCA Fall Color Cruise",
  "createdAt": "2026-09-01T00:00:00Z",
  "waypoints": [
    {
      "sequence": 0,
      "label": "Start — Dayton City Park",
      "lat": 45.2107,
      "lng": -123.0779,
      "type": "start"
    },
    {
      "sequence": 1,
      "label": "Turn right on Hwy 18",
      "lat": 45.2201,
      "lng": -123.1105,
      "type": "waypoint"
    },
    {
      "sequence": 99,
      "label": "Finish — McMinnville Airfest",
      "lat": 45.1951,
      "lng": -123.1959,
      "type": "end"
    }
  ]
}
```

Notes:
- `sequence` defines strict ordering — this is what "reroute to *next* waypoint"
  keys off of, regardless of which waypoint was missed.
- `type: start | waypoint | end` drives UI state (e.g. triggers the "cruise
  complete" screen when the participant reaches an `end` waypoint).
- This same JSON shape is what the (post-MVP) My Maps→app converter script needs
  to produce, so it's worth locking down now even though the converter itself
  isn't built yet.

---

## 3. Deep Link Handling

- A route link (e.g. `cruisecaptain://route/wvca-2026-fall-cruise` or a universal
  `https://` link that falls back to app store install) resolves to a hosted
  route JSON file.
- Tapping the link → app opens directly to a map pre-loaded with that route's
  waypoints, no home screen / route picker needed for MVP (single active route
  at a time).
- Route JSON can be hosted anywhere static (e.g. a GitHub raw URL, or simple
  cloud storage) — no custom backend required.

---

## 4. Live Navigation & Reroute Logic

**Online mode (default):**
1. Google Maps SDK tracks live location.
2. App shows turn guidance toward `waypoints[currentIndex]`.
3. On arrival within a threshold radius of the current waypoint, advance
   `currentIndex += 1`.
4. **Off-route detection:** use the SDK's built-in recalculation. When it
   fires, don't recalculate toward the *missed* waypoint — recalculate toward
   `waypoints[currentIndex + 1]` (skip ahead). This skip-ahead-on-miss behavior
   is the one genuinely custom piece of MVP logic; everything else leans on the
   SDK.
5. On reaching the final (`type: end`) waypoint, show the "cruise complete"
   screen.

**Offline mode (fallback, triggered when connectivity drops):**
1. MapLibre renders pre-fetched OSM tiles for the route corridor instead of
   Google tiles.
2. Guidance drops from full road-routed turn-by-turn to straight-line
   distance/bearing toward `waypoints[currentIndex]`, computed locally from GPS
   — no network call needed.
3. Off-route handling is the same skip-ahead-by-sequence logic, just computed
   via bearing/distance instead of SDK recalculation.
4. This is explicitly reduced-fidelity, not parity with online mode.

**Trigger for offline fallback:** connectivity loss (no Google Maps tile
response / no network). Route corridor tiles must be pre-fetched *while still
online*, ideally as soon as a route loads.

---

## 5. Entitlement Placeholder (Monetization Hook)

One function, called at the point a route loads:

```
userHasAccess(routeId) -> boolean
```

- MVP: always returns `true`. No accounts, no payment check, no ads.
- Whatever monetization model gets picked later (free/ad-supported vs.
  subscription vs. other) only changes what's *behind* this function — the
  call site and the app's control flow around it don't change.
- Placed once, at route-load time, not scattered through the codebase.

---

## 6. Suggested Project Structure (React Native)

```
cruise-captain/
├── src/
│   ├── screens/
│   │   ├── MapScreen.tsx          # main nav view (online + offline)
│   │   └── CruiseCompleteScreen.tsx
│   ├── navigation/
│   │   └── DeepLinkHandler.ts     # resolves route link → route JSON
│   ├── maps/
│   │   ├── OnlineMapProvider.tsx  # Google Maps SDK wrapper
│   │   └── OfflineMapProvider.tsx # MapLibre + OSM wrapper
│   ├── routing/
│   │   ├── routeModel.ts          # types for Route / Waypoint
│   │   ├── rerouteLogic.ts        # skip-ahead-to-next-waypoint (online + offline)
│   │   └── offlineTilePrefetch.ts # pre-fetch OSM tiles for route corridor
│   ├── entitlement/
│   │   └── userHasAccess.ts       # MVP: always true
│   └── App.tsx
├── android/
├── ios/
└── package.json
```

---

## 7. MVP Build Order (mirrors the brief's feature list)

1. RN project scaffold, builds on both platforms
2. Google Maps SDK integration — hardcoded route rendered on map
3. Deep link handling — link opens app to that route
4. Live tracking + turn-by-turn toward waypoints in sequence
5. Off-route detection + skip-ahead reroute logic
6. Offline fallback — OSM/MapLibre tiles + local bearing/distance guidance
7. Entitlement placeholder wired in at route load (inert)
8. Cruise-complete screen at final waypoint
9. Real-device testing — iOS via rentamac.io, Android via emulator/device

Explicitly deferred: in-app route creation/editing, accounts, payments, ads,
multiple concurrent cruises, My Maps→JSON converter tool.

---

## 8. Open Questions Before Coding Starts

- Where will route JSON files actually be hosted for the deep link to resolve
  against (GitHub raw file vs. simple cloud storage bucket)?
- Universal link (`https://`, works without app installed) vs. custom scheme
  (`cruisecaptain://`, requires app already installed) — MVP audience skews
  older, so a universal link with an app-store fallback is probably the more
  forgiving choice, but worth deciding explicitly.
- Arrival-radius threshold for "reached a waypoint" (affects both battery use
  and false-positive advances).
