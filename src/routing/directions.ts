import { LatLng } from './geo';
import { decodePolyline } from './polyline';

// Fetches a road-snapped path through the given waypoints, for display only —
// turn-by-turn guidance still uses straight-line distance/bearing (see
// useLiveNavigation). Falls through to the caller's straight-line fallback
// if the request fails for any reason (missing/invalid key, no network,
// Directions API not enabled yet, etc.) — this is a visual nicety, not
// something the app depends on to function.
export async function fetchRoadSnappedPath(
  waypoints: LatLng[],
  apiKey: string,
): Promise<LatLng[]> {
  if (waypoints.length < 2) {
    return waypoints;
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
  if (data.status !== 'OK' || !data.routes?.[0]?.overview_polyline?.points) {
    throw new Error(`Directions API returned status ${data.status}`);
  }
  return decodePolyline(data.routes[0].overview_polyline.points);
}
