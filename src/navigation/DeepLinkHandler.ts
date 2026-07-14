import { Route } from '../routing/routeModel';

// Deep link shape: cruisecaptain://route?url=<url-encoded route JSON URL>
// The route JSON itself can be hosted anywhere static (GitHub raw, a cloud
// bucket, etc.) — the deep link just points at it, so we don't have to lock
// in a hosting decision here.
// Parsed by hand (not the URL/URLSearchParams globals) since RN's polyfill
// support for those varies across engines/versions and this app only ever
// needs one query param off a custom-scheme link.
export function extractRouteJsonUrl(deepLink: string): string | null {
  const queryIndex = deepLink.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  const query = deepLink.slice(queryIndex + 1);
  for (const pair of query.split('&')) {
    const [key, value] = pair.split('=');
    if (key === 'url' && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function isRoute(data: any): data is Route {
  return (
    data &&
    typeof data.routeId === 'string' &&
    Array.isArray(data.waypoints) &&
    data.waypoints.every(
      (w: any) =>
        typeof w.sequence === 'number' &&
        typeof w.lat === 'number' &&
        typeof w.lng === 'number',
    )
  );
}

export async function fetchRoute(routeJsonUrl: string): Promise<Route> {
  const response = await fetch(routeJsonUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch route (${response.status})`);
  }
  const data = await response.json();
  if (!isRoute(data)) {
    throw new Error('Route JSON is missing required fields');
  }
  return data;
}

export async function resolveRouteFromDeepLink(
  deepLink: string,
): Promise<Route> {
  const routeJsonUrl = extractRouteJsonUrl(deepLink);
  if (!routeJsonUrl) {
    throw new Error('Deep link is missing a "url" parameter');
  }
  return fetchRoute(routeJsonUrl);
}
