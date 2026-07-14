# Cruise Captain

React Native (iOS + Android, single codebase) app for car club cruises (WVCA/NWCA). An organizer shares a route link; participants load it, get turn-by-turn guidance to each waypoint in sequence, and get auto-rerouted to the *next* waypoint (not the missed one) if they go off-route.

Full context: [docs/project-brief.md](docs/project-brief.md) (product scope) and [docs/architecture-spec.md](docs/architecture-spec.md) (technical shape). Read those before making scope or architecture decisions — this file is just the fast-recall summary.

## Key decisions already locked in

- **No backend for MVP.** Routes are static JSON files (organizer's own waypoint data, exported from Google My Maps) hosted at a URL and resolved via deep link. No accounts/login/payments/ads in MVP.
- **Online mode:** Google Maps Platform SDK for tiles + live tracking. "Turn-by-turn" is **our own lightweight guidance**, not Google's Navigation SDK: live GPS + straight-line distance/bearing to the current target waypoint, showing that waypoint's own `label` as the instruction (e.g. "Turn right on Hwy 18"). Decided this way because Google's actual Navigation SDK (with real road-routed turn-by-turn and auto-recalculation) has no mature React Native wrapper and would be a much heavier, riskier integration than this MVP calls for. This also means the same distance/bearing code doubles as the offline-mode fallback. See `src/routing/geo.ts` and `src/routing/useLiveNavigation.ts`.
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
- **Project path must not contain spaces.** The project originally lived at `C:\Users\kelly\Cruise Captain Project` and was moved to `C:\Users\kelly\CruiseCaptain` because RN's Android autolinking (`autolinkLibrariesFromCommand()` in `android/settings.gradle`) shells out to Node via `cmd` during Gradle sync, and that invocation breaks on a spaced path. Keep the project at a space-free path — this will resurface for any native module (Maps SDK, MapLibre, etc.), not just autolinking.
- **`npx react-native run-android` doesn't work on this machine** — its bundled installer fails with `'gradlew.bat' is not recognized...` even from a space-free path (looks like an `@react-native-community/cli` process-spawning issue on Windows, unrelated to the path bug above). Workaround: build/install directly with Gradle instead:
  ```
  cd android
  .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
  ```
  Then start Metro separately (plain `Start-Process -FilePath npx` also fails to resolve `npx.cmd` on Windows — launch via `cmd.exe /c "npx react-native start"` instead), and `adb reverse tcp:8081 tcp:8081` before launching the app.

## Open questions (not yet decided — flag before assuming)

- Where route JSON gets hosted for deep links to resolve against (GitHub raw file vs. a cloud storage bucket). Currently sidestepped: the deep link itself carries the route JSON's URL (`cruisecaptain://route?url=...`), so hosting can be decided later without an app change.
- Universal link (`https://...`) vs. custom scheme (`cruisecaptain://`) for the route link — universal + app-store fallback is the current leaning given the older target audience, but not decided. Custom scheme is what's implemented now (simplest, no hosting/domain dependency); switching to a universal link later is additive, not a rewrite.
- Arrival-radius threshold for "reached a waypoint" — defaulted to 50m (`ARRIVAL_RADIUS_METERS` in `src/routing/useLiveNavigation.ts`), not validated against real driving yet. Worth revisiting after real-device testing (item 9 in the build order) — 50m may trigger too early/late depending on road speed and GPS accuracy in a moving vehicle.
