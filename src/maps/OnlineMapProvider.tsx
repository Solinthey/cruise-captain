import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Waypoint } from '../routing/routeModel';
import { LatLng } from '../routing/geo';
import RecenterButton from './RecenterButton';

const markerColor = (type: string) => {
  switch (type) {
    case 'start':
      return 'green';
    case 'end':
      return 'red';
    default:
      return 'orange';
  }
};

interface OnlineMapProviderProps {
  waypoints: Waypoint[];
  displayPath: LatLng[];
  currentPosition: LatLng | null;
  permissionDenied: boolean;
}

export default function OnlineMapProvider({
  waypoints,
  displayPath,
  currentPosition,
  permissionDenied,
}: OnlineMapProviderProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  const initialRegion = {
    latitude: waypoints[0].lat,
    longitude: waypoints[0].lng,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // Re-fit the camera any time the route changes, not just on first mount —
  // initialRegion only applies once, so a route swap after launch (e.g. a
  // new deep link while the app is already running) would otherwise leave
  // the camera pointed at the old route's area.
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    mapRef.current?.fitToCoordinates(
      waypoints.map(w => ({ latitude: w.lat, longitude: w.lng })),
      {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      },
    );
  }, [mapReady, waypoints]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!permissionDenied}
        onMapReady={() => setMapReady(true)}>
        {waypoints.map(w => (
          <Marker
            key={w.sequence}
            coordinate={{ latitude: w.lat, longitude: w.lng }}
            title={w.label}
            pinColor={markerColor(w.type)}
          />
        ))}
        <Polyline
          coordinates={displayPath.map(p => ({
            latitude: p.lat,
            longitude: p.lng,
          }))}
          strokeColor="#1a73e8"
          strokeWidth={4}
        />
      </MapView>
      {currentPosition && (
        <RecenterButton
          onPress={() =>
            mapRef.current?.animateToRegion(
              {
                latitude: currentPosition.lat,
                longitude: currentPosition.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              400,
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
