import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Waypoint } from '../routing/routeModel';
import { formatDistance } from '../routing/geo';
import { AdvanceReason } from '../routing/useLiveNavigation';

interface TurnBannerProps {
  target: Waypoint | null;
  distanceMeters: number | null;
  permissionDenied: boolean;
  lastAdvanceReason: AdvanceReason | null;
}

export default function TurnBanner({
  target,
  distanceMeters,
  permissionDenied,
  lastAdvanceReason,
}: TurnBannerProps) {
  const insets = useSafeAreaInsets();
  let message: string;
  const rerouted = lastAdvanceReason === 'rerouted';

  if (permissionDenied) {
    message = 'Turn on location access to get directions to each stop.';
  } else if (!target) {
    message = 'Finding your location…';
  } else if (distanceMeters === null) {
    message = `Next: ${target.label}`;
  } else {
    message = `${formatDistance(distanceMeters)} — ${target.label}`;
  }

  return (
    <View
      style={[
        styles.banner,
        { paddingTop: insets.top + 16 },
        rerouted && styles.rerouted,
      ]}>
      {rerouted && (
        <Text style={styles.rerouteLabel}>Missed a turn — heading to next stop</Text>
      )}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rerouted: {
    backgroundColor: 'rgba(178, 58, 12, 0.92)',
  },
  rerouteLabel: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.9,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
