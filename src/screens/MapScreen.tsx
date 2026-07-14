import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Route } from '../routing/routeModel';
import { useLiveNavigation } from '../routing/useLiveNavigation';
import TurnBanner from './TurnBanner';

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

interface MapScreenProps {
  route: Route;
}

export default function MapScreen({ route }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const ordered = useMemo(
    () => [...route.waypoints].sort((a, b) => a.sequence - b.sequence),
    [route.waypoints],
  );
  const {
    target,
    distanceToTargetMeters,
    isComplete,
    permissionDenied,
    lastAdvanceReason,
  } = useLiveNavigation(ordered);

  const initialRegion = {
    latitude: ordered[0].lat,
    longitude: ordered[0].lng,
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
      ordered.map(w => ({ latitude: w.lat, longitude: w.lng })),
      {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      },
    );
  }, [mapReady, ordered]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!permissionDenied}
        onMapReady={() => setMapReady(true)}>
        {ordered.map(w => (
          <Marker
            key={w.sequence}
            coordinate={{ latitude: w.lat, longitude: w.lng }}
            title={w.label}
            pinColor={markerColor(w.type)}
          />
        ))}
        <Polyline
          coordinates={ordered.map(w => ({ latitude: w.lat, longitude: w.lng }))}
          strokeColor="#1a73e8"
          strokeWidth={4}
        />
      </MapView>
      <TurnBanner
        target={target}
        distanceMeters={distanceToTargetMeters}
        isComplete={isComplete}
        permissionDenied={permissionDenied}
        lastAdvanceReason={lastAdvanceReason}
      />
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
