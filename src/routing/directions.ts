import { LatLng } from './geo';
import { decodePolyline } from './polyline';

export interface TurnStep {
  instruction: string;
  distanceMeters: number;
  end: LatLng;
}

export interface RoadSnappedRoute {
  path: LatLng[];
  steps: TurnStep[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Fetches a road-snapped path through the given waypoints, plus Google's own
// turn-by-turn steps within it (e.g. "Turn right onto Stoller Rd") — both
// for display only. Guidance's *advancement* logic (arrival, off-route
// skip-ahead) still uses the raw waypoints (see useLiveNavigation); this is
// a separate, finer-grained layer just for what the banner displays while
// online. Falls through to the caller's straight-line fallback if the
// request fails for any reason (missing/invalid key, no network, Directions
// API not enabled yet, etc.) — this is a visual nicety, not something the
// app depends on to function.
export async function fetchRoadSnappedRoute(
  waypoints: LatLng[],
  apiKey: string,
): Promise<RoadSnappedRoute> {
  if (waypoints.length < 2) {
    return { path: waypoints, steps: [] };
  }

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediate = waypoints.slice(1, -1);

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    key: apiKey,
  });
  if (intermediate.length > 0) {
    // "via:" preserves our sequence order instead of letting Google
    // reorder waypoints for a shorter trip.
    params.set(
      'waypoints',
      intermediate.map(w => `via:${w.lat},${w.lng}`).join('|'),
    );
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Directions request failed (${response.status})`);
  }
  const data = await response.json();
  const route = data.routes?.[0];
  if (data.status !== 'OK' || !route?.overview_polyline?.points) {
    throw new Error(`Directions API returned status ${data.status}`);
  }

  const steps: TurnStep[] = (route.legs ?? []).flatMap((leg: any) =>
    (leg.steps ?? []).map((step: any) => ({
      instruction: stripHtml(step.html_instructions ?? ''),
      distanceMeters: step.distance?.value ?? 0,
      end: { lat: step.end_location.lat, lng: step.end_location.lng },
    })),
  );

  return {
    path: decodePolyline(route.overview_polyline.points),
    steps,
  };
}
