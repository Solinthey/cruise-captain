import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Route } from '../routing/routeModel';

interface CruiseCompleteScreenProps {
  route: Route;
}

export default function CruiseCompleteScreen({
  route,
}: CruiseCompleteScreenProps) {
  const finish = route.waypoints.find(w => w.type === 'end');

  return (
    <View style={styles.container}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
      <Text style={styles.title}>Cruise Complete</Text>
      <Text style={styles.subtitle}>{route.name}</Text>
      {finish && <Text style={styles.finishLabel}>{finish.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkMark: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    marginBottom: 4,
    textAlign: 'center',
  },
  finishLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
