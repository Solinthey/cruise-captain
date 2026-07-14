import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
  type CameraRef,
  type LngLatBounds,
} from '@maplibre/maplibre-react-native';
import { Waypoint } from '../routing/routeModel';
import { LatLng } from '../routing/geo';
import { osmStyleSpec } from './osmStyle';

const markerColor = (type: string) => {
  switch (type) {
    case 'start':
      return '#2e7d32';
    case 'end':
      return '#c62828';
    default:
      return '#e08a00';
  }
};

interface OfflineMapProviderProps {
  waypoints: Waypoint[];
  displayPath: LatLng[];
  currentPosition: LatLng | null;
}

export default function OfflineMapProvider({
  waypoints,
  displayPath,
  currentPosition,
}: OfflineMapProviderProps) {
  const cameraRef = useRef<CameraRef>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const lats = waypoints.map(w => w.lat);
    const lngs = waypoints.map(w => w.lng);
    const bounds: LngLatBounds = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
    cameraRef.current?.fitBounds(
      bounds,
      { padding: { top: 80, right: 80, bottom: 80, left: 80 } },
      500,
    );
  }, [mapReady, waypoints]);

  const lineGeoJSON = {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: displayPath.map(p => [p.lng, p.lat]),
    },
    properties: {},
  };

  return (
    <Map
      style={styles.map}
      mapStyle={osmStyleSpec}
      onDidFinishLoadingMap={() => setMapReady(true)}>
      <Camera ref={cameraRef} />
      <GeoJSONSource id="route-source" data={lineGeoJSON} />
      <Layer
        id="route-line"
        type="line"
        source="route-source"
        style={{ lineColor: '#1a73e8', lineWidth: 4 }}
      />
      {waypoints.map(w => (
        <Marker key={w.sequence} lngLat={[w.lng, w.lat]}>
          <View
            style={[styles.pin, { backgroundColor: markerColor(w.type) }]}
          />
        </Marker>
      ))}
      {currentPosition && (
        <Marker lngLat={[currentPosition.lng, currentPosition.lat]}>
          <View style={styles.userDot} />
        </Marker>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    borderWidth: 2,
    borderColor: 'white',
  },
});
