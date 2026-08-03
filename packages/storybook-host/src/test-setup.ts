import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// NativeWind s'appuie sur `react-native-css-interop`, dont le runtime tire des
// modules natifs de React Native (source Flow) non transpilables par Vite. Les
// tests valident le rendu et l'intégration, pas l'application des classes
// utilitaires : on substitue donc un stub web-safe de NativeWind.
vi.mock('nativewind', () => ({
  vars: (values: Record<string, string>) => values,
  useColorScheme: () => ({
    colorScheme: 'light' as const,
    setColorScheme: () => undefined,
    toggleColorScheme: () => undefined,
  }),
  cssInterop: () => undefined,
  remapProps: () => undefined,
}));

afterEach(() => cleanup());
