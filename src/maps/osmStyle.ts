import type { StyleSpecification } from '@maplibre/maplibre-react-native';

// Plain OSM raster tiles. For dev/testing only — OpenStreetMap's own tile
// server explicitly isn't meant for production app traffic at scale; before
// real users are on this, switch to a proper tile provider (MapTiler,
// Stadia Maps, etc.) — see CLAUDE.md pre-launch follow-ups.
export const osmStyleSpec: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// OfflineManager.createPack requires a fetchable style *URL* — inline
// objects (fine for <Map mapStyle={...}>) aren't accepted there, and
// this native library's HTTP layer can't parse asset:// or data: URIs
// either (both tried and failed), so this has to be a real https:// URL.
// Mirror of osmStyleSpec above, hosted at hosting/osm-style.json.
export const osmStyleUrl =
  'https://raw.githubusercontent.com/Solinthey/cruise-captain/main/hosting/osm-style.json';
