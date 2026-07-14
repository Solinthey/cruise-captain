import { Route } from './routeModel';

export const sampleRoute: Route = {
  routeId: 'wvca-2026-fall-cruise',
  name: 'WVCA Fall Color Cruise',
  createdAt: '2026-09-01T00:00:00Z',
  waypoints: [
    {
      sequence: 0,
      label: 'Start — Dayton City Park',
      lat: 45.2107,
      lng: -123.0779,
      type: 'start',
    },
    {
      sequence: 1,
      label: 'Turn right on Hwy 18',
      lat: 45.2201,
      lng: -123.1105,
      type: 'waypoint',
    },
    {
      sequence: 2,
      label: 'Turn left toward Sheridan',
      lat: 45.1998,
      lng: -123.1547,
      type: 'waypoint',
    },
    {
      sequence: 99,
      label: 'Finish — McMinnville Airfest',
      lat: 45.1951,
      lng: -123.1959,
      type: 'end',
    },
  ],
};
