import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import KeepAwake from '@sayem314/react-native-keep-awake';
import NetInfo from '@react-native-community/netinfo';
import { Route } from '../routing/routeModel';
import { useLiveNavigation } from '../routing/useLiveNavigation';
import { useStepGuidance } from '../routing/useStepGuidance';
import { fetchRoadSnappedRoute, TurnStep } from '../routing/directions';
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

  // Road-snapped path + Google's own turn-by-turn steps, for display only —
  // guidance's arrival/reroute logic above always uses the raw waypoints.
  // Falls back to straight lines and no steps if the Directions API call
  // fails for any reason (including being offline, which is exactly when
  // the fallback matters most).
  const [displayPath, setDisplayPath] = useState<LatLng[]>(ordered);
  const [steps, setSteps] = useState<TurnStep[]>([]);
  useEffect(() => {
    let cancelled = false;
    setDisplayPath(ordered);
    setSteps([]);
    fetchRoadSnappedRoute(ordered, DIRECTIONS_API_KEY)
      .then(result => {
        if (!cancelled) {
          setDisplayPath(result.path);
          setSteps(result.steps);
        }
      })
      .catch(() => {
        // Keep the straight-line fallback (and empty steps) already set above.
      });
    return () => {
      cancelled = true;
    };
  }, [ordered]);

  // Finer-grained banner guidance from the real turn-by-turn steps above
  // (e.g. "Turn right onto Stoller Rd"), independent of the pin-level
  // arrival/reroute logic in useLiveNavigation. Falls back to the pin-based
  // target/distance whenever steps aren't available (offline, fetch
  // failed, or still loading).
  const { currentStep, distanceToStepMeters } = useStepGuidance(
    steps,
    currentPosition,
  );
  const bannerLabel = currentStep ? currentStep.instruction : target?.label ?? null;
  const bannerDistanceMeters = currentStep
    ? distanceToStepMeters
    : distanceToTargetMeters;

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
      <KeepAwake />
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
          currentPosition={currentPosition}
          permissionDenied={permissionDenied}
        />
      )}
      <TurnBanner
        label={bannerLabel}
        distanceMeters={bannerDistanceMeters}
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
