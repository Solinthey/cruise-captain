import { OfflineManager } from '@maplibre/maplibre-react-native';
import { Waypoint } from '../routing/routeModel';
import { osmStyleUrl } from './osmStyle';

// Buffer around the route's bounding box, in degrees (~5km at these
// latitudes), so the corridor covers a bit either side of the road, not just
// the exact waypoint coordinates.
const CORRIDOR_PADDING_DEGREES = 0.05;
// Country-level zooms (below ~11) are wasted tiles for a driving route —
// keep the range tight to street-level detail so there's less to download.
const MIN_ZOOM = 11;
const MAX_ZOOM = 15;

// Pre-fetches OSM tiles for the route's corridor while still online, so
// OfflineMapProvider has something to render once connectivity drops. Safe
// to call every time a route loads — skips re-downloading if a pack for
// this routeId already exists.
export async function prefetchRouteCorridor(
  routeId: string,
  waypoints: Waypoint[],
): Promise<void> {
  const existingPacks = await OfflineManager.getPacks();
  const alreadyDownloaded = existingPacks.some(pack => {
    try {
      // pack.metadata is already parsed once by the OfflinePack class, but
      // the metadata *we* passed to createPack got wrapped a second time by
      // the native layer (alongside its own migration bookkeeping), so our
      // routeId is under a nested, still-stringified "metadata" field.
      const inner = pack.metadata?.metadata;
      const ours = typeof inner === 'string' ? JSON.parse(inner) : inner;
      return ours?.routeId === routeId;
    } catch {
      return false;
    }
  });
  if (alreadyDownloaded) {
    return;
  }

  const lats = waypoints.map(w => w.lat);
  const lngs = waypoints.map(w => w.lng);
  const bounds: [number, number, number, number] = [
    Math.min(...lngs) - CORRIDOR_PADDING_DEGREES,
    Math.min(...lats) - CORRIDOR_PADDING_DEGREES,
    Math.max(...lngs) + CORRIDOR_PADDING_DEGREES,
    Math.max(...lats) + CORRIDOR_PADDING_DEGREES,
  ];

  await OfflineManager.createPack(
    {
      mapStyle: osmStyleUrl,
      bounds,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      metadata: { routeId },
    },
    () => {},
    () => {},
  );
}
