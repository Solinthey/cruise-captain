import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Waypoint } from '../routing/routeModel';
import { formatDistance } from '../routing/geo';

interface TurnBannerProps {
  target: Waypoint | null;
  distanceMeters: number | null;
  isComplete: boolean;
  permissionDenied: boolean;
}

export default function TurnBanner({
  target,
  distanceMeters,
  isComplete,
  permissionDenied,
}: TurnBannerProps) {
  let message: string;
  if (permissionDenied) {
    message = 'Turn on location access to get directions to each stop.';
  } else if (isComplete) {
    message = "You've reached the end of the cruise.";
  } else if (!target) {
    message = 'Finding your location…';
  } else if (distanceMeters === null) {
    message = `Next: ${target.label}`;
  } else {
    message = `${formatDistance(distanceMeters)} — ${target.label}`;
  }

  return (
    <View style={styles.banner}>
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
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
