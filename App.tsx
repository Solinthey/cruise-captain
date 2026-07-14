/**
 * Cruise Captain
 *
 * @format
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapScreen from './src/screens/MapScreen';
import { sampleRoute } from './src/routing/sampleRoute';
import { Route } from './src/routing/routeModel';
import { resolveRouteFromDeepLink } from './src/navigation/DeepLinkHandler';
import { userHasAccess } from './src/entitlement/userHasAccess';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFromDeepLink = async (deepLink: string) => {
      try {
        const loadedRoute = await resolveRouteFromDeepLink(deepLink);
        const hasAccess = await userHasAccess(loadedRoute.routeId);
        if (!hasAccess) {
          setError('This route is not available on your account.');
          return;
        }
        setRoute(loadedRoute);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load that route.');
      }
    };

    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        loadFromDeepLink(initialUrl);
      } else {
        // No deep link — fall back to the sample route so the map screen is
        // reachable during development. Production launches always go
        // through a route deep link (see docs/architecture-spec.md §3).
        setRoute(sampleRoute);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      loadFromDeepLink(url);
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : route ? (
        <MapScreen route={route} />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default App;
