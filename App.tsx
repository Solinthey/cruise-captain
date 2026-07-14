/**
 * Cruise Captain
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapScreen from './src/screens/MapScreen';
import { sampleRoute } from './src/routing/sampleRoute';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MapScreen route={sampleRoute} />
    </SafeAreaProvider>
  );
}

export default App;
