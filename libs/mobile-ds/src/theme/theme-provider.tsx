import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { vars, useColorScheme } from 'nativewind';

import {
  colorsToCssVars,
  defaultTheme,
  type Theme,
  type ThemeColors,
  type ThemeMode,
} from './tokens';

interface ThemeContextValue {
  /** Thème complet en cours. */
  theme: Theme;
  /** Mode actif résolu. */
  mode: ThemeMode;
  /** Couleurs du mode actif (utile hors className, ex. props natives). */
  colors: ThemeColors;
  /** Force un mode, ou `'system'` pour suivre l'appareil. */
  setMode: (mode: ThemeMode | 'system') => void;
  /** Bascule light <-> dark. */
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Thème du projet. Voir `createTheme`. Par défaut : thème du Design System. */
  theme?: Theme;
  /** Mode initial. `'system'` suit le réglage de l'appareil. */
  defaultMode?: ThemeMode | 'system';
  /** Style additionnel appliqué au conteneur racine. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Fournit le thème à toute l'arborescence.
 *
 * Injecte les couleurs du mode actif en variables CSS (consommées par les
 * classes Tailwind `bg-primary`, `text-foreground`, …) et gère le dark mode.
 *
 * @example
 * <ThemeProvider theme={createTheme({ light: { primary: '124 58 237' } })}>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  theme = defaultTheme,
  defaultMode = 'system',
  style,
  children,
}: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();

  // Applique le mode initial demandé une seule fois au montage.
  // En mode `'system'` on ne force rien : NativeWind suit déjà l'appareil.
  useEffect(() => {
    if (defaultMode !== 'system') {
      setColorScheme(defaultMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  const themeVars = useMemo(
    () => vars(colorsToCssVars(theme[mode], theme.radius)),
    [theme, mode]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      colors: theme[mode],
      setMode: setColorScheme,
      toggleMode: () => setColorScheme(mode === 'dark' ? 'light' : 'dark'),
    }),
    [theme, mode, setColorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars, style]}>{children}</View>
    </ThemeContext.Provider>
  );
}

/** Accède au thème courant (mode, couleurs, bascule). À utiliser sous `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé à l’intérieur d’un <ThemeProvider>.');
  }
  return ctx;
}

/**
 * Style de variables CSS du thème courant.
 *
 * Utile pour ré-appliquer le thème sur un sous-arbre rendu dans une racine
 * native séparée (ex. contenu d'un `Modal`), où l'héritage des variables n'est
 * pas garanti.
 */
export function useThemeVars() {
  const { theme, mode } = useTheme();
  return useMemo(
    () => vars(colorsToCssVars(theme[mode], theme.radius)),
    [theme, mode]
  );
}
