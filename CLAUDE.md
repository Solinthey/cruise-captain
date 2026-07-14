# Cruise Captain

React Native (iOS + Android, single codebase) app for car club cruises (WVCA/NWCA). An organizer shares a route link; participants load it, get turn-by-turn guidance to each waypoint in sequence, and get auto-rerouted to the *next* waypoint (not the missed one) if they go off-route.

Full context: [docs/project-brief.md](docs/project-brief.md) (product scope) and [docs/architecture-spec.md](docs/architecture-spec.md) (technical shape). Read those before making scope or architecture decisions — this file is just the fast-recall summary.

## Key decisions already locked in

- **No backend for MVP.** Routes are static JSON files (organizer's own waypoint data, exported from Google My Maps) hosted at a URL and resolved via deep link. No accounts/login/payments/ads in MVP.
- **Online mode:** Google Maps Platform SDK for tiles, live tracking, turn-by-turn, recalculation.
- **Offline mode:** MapLibre + OpenStreetMap tiles, pre-fetched for the route corridor while still online. Guidance falls back to straight-line bearing/distance to the next waypoint — explicitly reduced-fidelity, not parity with online mode. (Google's ToS forbids caching Google tiles/routes offline — only the organizer's own waypoint data is cached.)
- **The one custom piece of logic:** off-route reroute targets `waypoints[currentIndex + 1]` (skip ahead by `sequence`), never the missed waypoint. Same logic online (via SDK recalculation trigger) and offline (via bearing/distance).
- **Monetization is undecided** but architecturally deferred behind a single `userHasAccess(routeId)` call at route-load time, which always returns `true` in MVP. Don't scatter access checks elsewhere.
- **Route data model:** see architecture-spec.md §2 — `sequence` (ordering), `type: start|waypoint|end` (drives UI, e.g. cruise-complete screen).
- Target users skew 50-70 — favor plain naming and low-friction UI over trendy/dense UI.

## Explicitly out of scope for MVP

In-app route creation/editing, accounts, payments, ads, multiple concurrent cruises, the My Maps→JSON converter tool (planning workflow is manual for now).

## Environment notes (this machine)

- Node.js, Android SDK (`%LOCALAPPDATA%\Android\Sdk`), and Android Studio (`D:\Program Files (x86)\Android\Android Studio`, JBR used as `JAVA_HOME`) are already installed/configured.
- No Xcode on this machine (Windows) — iOS builds/testing happen via the rented Mac at rentamac.io.
- There was an earlier, unrelated native-Android (Kotlin) prototype at `C:\Users\kelly\AndroidStudioProjects\ClubCruiseApp` — it's just the default Android Studio template with no custom code, superseded by this React Native project. Not part of this repo.

## Open questions (not yet decided — flag before assuming)

- Where route JSON gets hosted for deep links to resolve against (GitHub raw file vs. a cloud storage bucket).
- Universal link (`https://...`) vs. custom scheme (`cruisecaptain://`) for the route link — universal + app-store fallback is the current leaning given the older target audience, but not decided.
- Arrival-radius threshold for "reached a waypoint."
