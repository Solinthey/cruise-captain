# Cruise Captain — Project Brief

## What this app does
A mobile app for car club cruises (Willamette Valley Corvette Association / Northwest Corvette Association) that lets a cruise organizer share a pre-planned route, and lets participants tap a link to load it, follow point-by-point turn guidance, and automatically get rerouted to the *next* waypoint if they miss a turn.

## Platforms
- iOS and Android from a single codebase: **React Native**

## Tooling & accounts already in place
- GitHub account (for version control)
- Google Cloud account (from a prior attempt at this project) — will host the **Google Maps Platform** API key
- Mac access via **rentamac.io** (rented Mac Mini, remote access) for iOS builds/testing when needed
- Claude Pro subscription, building via Claude Code

## Mapping & routing approach
- **Google Maps Platform** SDK for the in-app map, live location tracking, and turn-by-turn guidance
- **Google My Maps** for route *planning* by the organizer — they lay out waypoints visually in My Maps, export as KML/GeoJSON, and (later) a conversion script turns that into the app's route format. This converter is a later phase, not part of the initial MVP build.
- Off-route detection uses the SDK's built-in recalculation, redirected to the **next waypoint in sequence** (not back to the missed one) — this is the one genuinely custom piece of logic in the MVP.

## Route distribution (MVP)
- Routes shared as a link via text/email per event (no in-app browsing/discovery needed for MVP)
- No accounts, login, payments, or ads in MVP — those are post-MVP monetization decisions (free/ad-supported vs. subscription still undecided)

## Commercial ambition
- Initial use is WVCA/NWCA, but the long-term goal is to sell this more broadly to other car clubs
- Target user base skews older, roughly 50-70 — favor plain, clear naming and simple, low-friction UI over trendy/complex design
- Monetization model undecided (ads vs. subscription vs. other) — architecture should leave room to add it later without a rebuild:
  - Build a single `userHasAccess()`-style entitlement check placeholder at the point where a route loads. It always returns true for now. Whatever monetization model gets chosen later changes what's behind that one function, not the app's structure.

## Offline capability
Google's Maps Platform terms of service prohibit caching/storing Google map tiles or full route content for offline use, so offline support cannot be "download the Google map." Instead:
- **Online (default):** Google Maps SDK as normal — live tiles, live turn-by-turn, live rerouting.
- **Route waypoints are the organizer's own data** (from My Maps), not Google content — safe to store locally for offline use.
- **Offline map layer:** MapLibre + OpenStreetMap tiles (open-licensed, downloadable), pre-fetched for the cruise's route corridor while still online, before entering a dead zone.
- **Offline turn guidance:** GPS (works with no cell signal) + locally stored waypoints, using straight-line distance/bearing to the next waypoint.
- **Offline rerouting** is simplified vs. the online experience: guide back toward the next waypoint by bearing/distance rather than full recalculated road routing. This is a real but reduced-fidelity fallback, not feature parity with online mode.

## Working name
**Cruise Captain** — decided.

## MVP feature scope
1. Project scaffold — React Native building for both iOS and Android
2. Google Maps SDK integration — display a hardcoded route on a map
3. Deep link handling — tapping a link opens the app directly to that route
4. Live location tracking + turn-by-turn prompts toward each waypoint in order
5. Off-route detection + reroute-to-next-waypoint logic
6. Offline fallback — pre-fetched OSM/MapLibre tiles + local waypoint-based guidance when connectivity drops
7. Entitlement-check placeholder (see Monetization) wired in but inert
8. Arrival state — simple "cruise complete" screen at the last waypoint
9. Real-device testing on iOS (via rented Mac) and Android, bug fixes

Explicitly out of scope for MVP: in-app route creation/editing, accounts, payments, ads, multiple concurrent cruises.

## Open decisions (not yet made)
- Monetization model: free + ads vs. flat annual subscription vs. other
- Whether to eventually build a dedicated in-app/web route-builder tool for organizers (post-MVP, once My Maps + converter workflow is proven out)
