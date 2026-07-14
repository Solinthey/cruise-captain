export type WaypointType = 'start' | 'waypoint' | 'end';

export interface Waypoint {
  sequence: number;
  label: string;
  lat: number;
  lng: number;
  type: WaypointType;
}

export interface Route {
  routeId: string;
  name: string;
  createdAt: string;
  waypoints: Waypoint[];
}
