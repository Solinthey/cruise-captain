import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Waypoint } from './routeModel';
import { bearingDegrees, distanceMeters, LatLng } from './geo';

// How close (in meters) the driver needs to get to a waypoint before we
// consider it "reached" and advance to the next one. Not yet validated
// against real driving — see docs/architecture-spec.md open questions.
export const ARRIVAL_RADIUS_METERS = 50;

// If the driver is this much closer to the *next* waypoint than to the
// current target, we treat the current target as missed (off-route) and
// skip ahead to the next one rather than trying to route back to it — the
// one custom piece of logic this app has. The margin exists so ordinary GPS
// jitter near two closely-spaced waypoints doesn't cause a false skip.
export const OFF_ROUTE_SKIP_MARGIN_METERS = 30;

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS: @react-native-community/geolocation prompts via this call.
  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

export type AdvanceReason = 'arrived' | 'rerouted';

export interface LiveNavigationState {
  currentPosition: LatLng | null;
  target: Waypoint | null;
  distanceToTargetMeters: number | null;
  bearingToTargetDegrees: number | null;
  isComplete: boolean;
  permissionDenied: boolean;
  lastAdvanceReason: AdvanceReason | null;
}

// Ordered waypoints are assumed sorted by `sequence` ascending. Guidance
// starts at index 1 (the first turn after the start point) since the
// participant is expected to already be at the `start` waypoint when the
// cruise begins.
export function useLiveNavigation(
  orderedWaypoints: Waypoint[],
): LiveNavigationState {
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [targetIndex, setTargetIndex] = useState(
    orderedWaypoints.length > 1 ? 1 : 0,
  );
  const [lastAdvanceReason, setLastAdvanceReason] =
    useState<AdvanceReason | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let watchId: number | null = null;
    let cancelled = false;

    ensureLocationPermission().then(granted => {
      if (cancelled) {
        return;
      }
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      watchId = Geolocation.watchPosition(
        position => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 3000,
        },
      );
    });

    return () => {
      cancelled = true;
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const target =
    targetIndex < orderedWaypoints.length ? orderedWaypoints[targetIndex] : null;
  const nextAfterTarget =
    targetIndex + 1 < orderedWaypoints.length
      ? orderedWaypoints[targetIndex + 1]
      : null;
  const isComplete = targetIndex >= orderedWaypoints.length;

  const distanceToTargetMeters =
    currentPosition && target
      ? distanceMeters(currentPosition, { lat: target.lat, lng: target.lng })
      : null;
  const bearingToTargetDegrees =
    currentPosition && target
      ? bearingDegrees(currentPosition, { lat: target.lat, lng: target.lng })
      : null;
  const distanceToNextMeters =
    currentPosition && nextAfterTarget
      ? distanceMeters(currentPosition, {
          lat: nextAfterTarget.lat,
          lng: nextAfterTarget.lng,
        })
      : null;

  useEffect(() => {
    if (distanceToTargetMeters === null) {
      return;
    }
    if (distanceToTargetMeters <= ARRIVAL_RADIUS_METERS) {
      setTargetIndex(i => Math.min(i + 1, orderedWaypoints.length));
      setLastAdvanceReason('arrived');
      return;
    }
    if (
      distanceToNextMeters !== null &&
      distanceToNextMeters + OFF_ROUTE_SKIP_MARGIN_METERS < distanceToTargetMeters
    ) {
      setTargetIndex(i => Math.min(i + 1, orderedWaypoints.length));
      setLastAdvanceReason('rerouted');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceToTargetMeters, distanceToNextMeters]);

  return {
    currentPosition,
    target,
    distanceToTargetMeters,
    bearingToTargetDegrees,
    isComplete,
    permissionDenied,
    lastAdvanceReason,
  };
}
