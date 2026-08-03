import { Animated } from 'react-native';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// NativeWind s'appuie sur `react-native-css-interop`, dont le runtime tire des
// modules natifs de React Native (source Flow) non transpilables par Vite. Les
// tests unitaires valident le comportement des composants, pas l'application des
// classes utilitaires : on substitue donc un stub web-safe de NativeWind.
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

// Les animations JS de React Native planifient des callbacks via des timers.
// S'ils se déclenchent après le teardown d'un test, l'assertion tombe. On rend
// `timing`/`spring` synchrones : les composants restent dans leur état initial,
// ce qui suffit aux assertions (présence de texte, callbacks).
const synchronousAnimation = () => ({
  start: (callback?: (result: { finished: boolean }) => void) =>
    callback?.({ finished: true }),
  stop: () => undefined,
  reset: () => undefined,
});

vi.spyOn(Animated, 'timing').mockImplementation(synchronousAnimation as never);
vi.spyOn(Animated, 'spring').mockImplementation(synchronousAnimation as never);
