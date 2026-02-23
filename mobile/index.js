import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Static path so Metro can resolve require.context at build time (fixes EXPO_ROUTER_APP_ROOT error).
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
