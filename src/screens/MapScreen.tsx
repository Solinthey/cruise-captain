import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Route } from '../routing/routeModel';
import { useLiveNavigation } from '../routing/useLiveNavigation';
import { fetchRoadSnappedPath } from '../routing/directions';
import { LatLng } from '../routing/geo';
import { DIRECTIONS_API_KEY } from '../config/secrets';
import { prefetchRouteCorridor } from '../maps/offlineTilePrefetch';
import OnlineMapProvider from '../maps/OnlineMapProvider';
import OfflineMapProvider from '../maps/OfflineMapProvider';
import TurnBanner from './TurnBanner';
import CruiseCompleteScreen from './CruiseCompleteScreen';

interface MapScreenProps {
  route: Route;
}

export default function MapScreen({ route }: MapScreenProps) {
  const ordered = useMemo(
    () => [...route.waypoints].sort((a, b) => a.sequence - b.sequence),
    [route.waypoints],
  );
  const {
    currentPosition,
    target,
    distanceToTargetMeters,
    isComplete,
    permissionDenied,
    lastAdvanceReason,
  } = useLiveNavigation(ordered);

  // Road-snapped path for display only — guidance logic still uses the raw
  // waypoints (see useLiveNavigation). Falls back to straight lines between
  // waypoints if the Directions API call fails for any reason (including
  // being offline, which is exactly when the fallback matters most).
  const [displayPath, setDisplayPath] = useState<LatLng[]>(ordered);
  useEffect(() => {
    let cancelled = false;
    setDisplayPath(ordered);
    fetchRoadSnappedPath(ordered, DIRECTIONS_API_KEY)
      .then(path => {
        if (!cancelled) {
          setDisplayPath(path);
        }
      })
      .catch(() => {
        // Keep the straight-line fallback already set above.
      });
    return () => {
      cancelled = true;
    };
  }, [ordered]);

  // Pre-fetch OSM tiles for this route's corridor while we're online, so
  // OfflineMapProvider has tiles to show once connectivity drops.
  useEffect(() => {
    prefetchRouteCorridor(route.routeId, ordered).catch(() => {
      // Best-effort — if this fails (e.g. already offline on first load),
      // OfflineMapProvider just won't have cached tiles for this route yet.
    });
  }, [route.routeId, ordered]);

  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
  }, []);

  if (isComplete) {
    return <CruiseCompleteScreen route={route} />;
  }

  return (
    <View style={styles.container}>
      {isOffline ? (
        <OfflineMapProvider
          waypoints={ordered}
          displayPath={displayPath}
          currentPosition={currentPosition}
        />
      ) : (
        <OnlineMapProvider
          waypoints={ordered}
          displayPath={displayPath}
          permissionDenied={permissionDenied}
        />
      )}
      <TurnBanner
        target={target}
        distanceMeters={distanceToTargetMeters}
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
});
