/**
 * Tokens de thème du Design System.
 *
 * Les couleurs sont stockées sous forme de canaux RGB ("R G B", ex. "37 99 235")
 * pour rester compatibles avec l'opacité Tailwind (`bg-primary/50`). Elles sont
 * injectées au runtime en variables CSS par le `ThemeProvider`.
 */

/** Jeu de couleurs sémantiques pour un mode (light ou dark). */
export interface ThemeColors {
  /** Fond de l'écran. */
  background: string;
  /** Texte par défaut sur le fond. */
  foreground: string;
  /** Couleur de bordure par défaut. */
  border: string;
  /** Bordure des champs de saisie. */
  input: string;
  /** Halo de focus. */
  ring: string;
  /** Fond des surfaces surélevées (cartes, modales). */
  card: string;
  cardForeground: string;
  /** Couleur de marque principale. */
  primary: string;
  primaryForeground: string;
  /** Couleur secondaire (actions discrètes). */
  secondary: string;
  secondaryForeground: string;
  /** Tons atténués (placeholders, légendes). */
  muted: string;
  mutedForeground: string;
  /** Accent (survol, sélection). */
  accent: string;
  accentForeground: string;
  /** Actions destructrices / erreurs. */
  destructive: string;
  destructiveForeground: string;
  /** Succès / validation. */
  success: string;
  successForeground: string;
}

/** Thème complet : un jeu de couleurs par mode + le rayon de bordure de base. */
export interface Theme {
  light: ThemeColors;
  dark: ThemeColors;
  /** Rayon de bordure de référence en px (token `rounded-lg`). */
  radius: number;
}

export type ThemeMode = 'light' | 'dark';

/** Thème clair par défaut (palette neutre type slate + bleu de marque). */
export const lightColors: ThemeColors = {
  background: '255 255 255',
  foreground: '15 23 42',
  border: '226 232 240',
  input: '226 232 240',
  ring: '37 99 235',
  card: '255 255 255',
  cardForeground: '15 23 42',
  primary: '37 99 235',
  primaryForeground: '248 250 252',
  secondary: '241 245 249',
  secondaryForeground: '15 23 42',
  muted: '241 245 249',
  mutedForeground: '100 116 139',
  accent: '241 245 249',
  accentForeground: '15 23 42',
  destructive: '220 38 38',
  destructiveForeground: '248 250 252',
  success: '22 163 74',
  successForeground: '248 250 252',
};

/** Thème sombre par défaut. */
export const darkColors: ThemeColors = {
  background: '2 6 23',
  foreground: '248 250 252',
  border: '30 41 59',
  input: '30 41 59',
  ring: '59 130 246',
  card: '15 23 42',
  cardForeground: '248 250 252',
  primary: '59 130 246',
  primaryForeground: '15 23 42',
  secondary: '30 41 59',
  secondaryForeground: '248 250 252',
  muted: '30 41 59',
  mutedForeground: '148 163 184',
  accent: '30 41 59',
  accentForeground: '248 250 252',
  destructive: '239 68 68',
  destructiveForeground: '15 23 42',
  success: '34 197 94',
  successForeground: '15 23 42',
};

/** Thème par défaut du Design System. */
export const defaultTheme: Theme = {
  light: lightColors,
  dark: darkColors,
  radius: 8,
};

/** Surcharge partielle d'un thème (chaque projet ne redéfinit que ce qu'il veut). */
export type ThemeOverride = {
  light?: Partial<ThemeColors>;
  dark?: Partial<ThemeColors>;
  radius?: number;
};

/**
 * Crée un thème personnalisé en fusionnant des surcharges sur un thème de base.
 *
 * @example
 * const theme = createTheme({
 *   light: { primary: '124 58 237' },   // violet
 *   dark:  { primary: '167 139 250' },
 *   radius: 12,
 * });
 */
export function createTheme(
  override: ThemeOverride = {},
  base: Theme = defaultTheme
): Theme {
  return {
    light: { ...base.light, ...override.light },
    dark: { ...base.dark, ...override.dark },
    radius: override.radius ?? base.radius,
  };
}

/** Convertit un jeu de couleurs en variables CSS consommables par le preset Tailwind. */
export function colorsToCssVars(
  colors: ThemeColors,
  radius: number
): Record<string, string> {
  return {
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-border': colors.border,
    '--color-input': colors.input,
    '--color-ring': colors.ring,
    '--color-card': colors.card,
    '--color-card-foreground': colors.cardForeground,
    '--color-primary': colors.primary,
    '--color-primary-foreground': colors.primaryForeground,
    '--color-secondary': colors.secondary,
    '--color-secondary-foreground': colors.secondaryForeground,
    '--color-muted': colors.muted,
    '--color-muted-foreground': colors.mutedForeground,
    '--color-accent': colors.accent,
    '--color-accent-foreground': colors.accentForeground,
    '--color-destructive': colors.destructive,
    '--color-destructive-foreground': colors.destructiveForeground,
    '--color-success': colors.success,
    '--color-success-foreground': colors.successForeground,
    '--radius': `${radius}px`,
  };
}
