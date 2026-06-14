import type { ComponentType } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// La racine Storybook s'appuie sur `.storybook/storybook.requires.ts`, généré
// par Metro et hors du programme TypeScript : on la charge via `require`.
const StorybookUIRoot: ComponentType = require('../../.storybook').default;

export const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StorybookUIRoot />
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default App;
