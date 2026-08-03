import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

import { ThemeService } from './theme.service';

/**
 * Couleurs de graphique nommées par teinte, dans l'ordre des `--chart-1`…`--chart-6`
 * du thème. `brand` est la couleur de marque (`--chart-1`), les suivantes sont les
 * familles décoratives du DS. Permet de piocher une couleur précise pour un chart
 * custom, sans suivre l'ordre d'attribution par défaut.
 */
export const CHART_COLOR_NAMES = ['brand', 'cyan', 'orange', 'violet', 'lime', 'rose'] as const;
export type ChartColorName = (typeof CHART_COLOR_NAMES)[number];

/** Couleurs sémantiques exposées aux charts custom (états : succès, alerte, erreur, info). */
export const SEMANTIC_COLOR_NAMES = ['success', 'warning', 'error', 'info'] as const;
export type SemanticColorName = (typeof SEMANTIC_COLOR_NAMES)[number];

export type ThemePalette = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  popover: string;
  popoverForeground: string;
  /** Couleurs de graphique dans l'ordre d'attribution par défaut (`--chart-1`…`--chart-6`). */
  series: string[];
  /** Mêmes couleurs, adressées par teinte pour un usage hors ordre par défaut. */
  chart: Record<ChartColorName, string>;
  /** Couleurs sémantiques résolues (canvas ECharts ne lit pas les `var(--…)`). */
  semantic: Record<SemanticColorName, string>;
};

/** Variable CSS `--chart-N` correspondant à chaque couleur nommée, dans l'ordre. */
const CHART_COLOR_VARIABLES: Record<ChartColorName, string> = {
  brand: '--chart-1',
  cyan: '--chart-2',
  orange: '--chart-3',
  violet: '--chart-4',
  lime: '--chart-5',
  rose: '--chart-6',
};

/** Variable CSS de chaque couleur sémantique. */
const SEMANTIC_COLOR_VARIABLES: Record<SemanticColorName, string> = {
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
};

/**
 * Repli utilisé côté serveur, où aucun style calculé n'existe. Les valeurs sont
 * celles du thème clair du DS.
 */
const SSR_CHART_COLORS: Record<ChartColorName, string> = {
  brand: 'oklch(0.64 0.16 323)',
  cyan: 'oklch(0.64 0.106 197)',
  orange: 'oklch(0.64 0.16 51)',
  violet: 'oklch(0.64 0.16 286)',
  lime: 'oklch(0.64 0.134 108)',
  rose: 'oklch(0.64 0.16 355)',
};

const SSR_SEMANTIC_COLORS: Record<SemanticColorName, string> = {
  success: 'oklch(0.55 0.15 145)',
  warning: 'oklch(0.62 0.13 75)',
  error: 'oklch(0.55 0.18 28)',
  info: 'oklch(0.55 0.15 250)',
};

const SSR_PALETTE: ThemePalette = {
  background: 'oklch(0.972 0.006 323)',
  foreground: 'oklch(0.33 0.008 323)',
  muted: 'oklch(0.94 0.007 323)',
  mutedForeground: 'oklch(0.545 0 323)',
  border: 'oklch(0.885 0.009 323)',
  primary: 'oklch(0.58 0.16 323)',
  popover: 'oklch(0.995 0.002 323)',
  popoverForeground: 'oklch(0.33 0.008 323)',
  series: CHART_COLOR_NAMES.map(name => SSR_CHART_COLORS[name]),
  chart: SSR_CHART_COLORS,
  semantic: SSR_SEMANTIC_COLORS,
};

/**
 * Couleurs du thème résolues en valeurs concrètes.
 *
 * Nécessaire pour tout rendu qui ne passe pas par le CSS : ECharts dessine dans
 * un canvas et ne sait pas interpréter `var(--primary)`. AG Grid, lui, reste sur
 * les variables — c'est du DOM.
 *
 * La lecture se fait sur un élément sonde auquel on applique la classe `dark`
 * explicitement, et non sur la racine du document : le service du thème bascule
 * cette classe dans un effet, et lire la racine ferait dépendre le résultat de
 * l'ordre d'exécution des effets.
 */
@Injectable({ providedIn: 'root' })
export class ThemePaletteService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(ThemeService);

  readonly palette = computed<ThemePalette>(() => {
    const isDark = this.themeService.isDark();

    if (!isPlatformBrowser(this.platformId)) {
      return SSR_PALETTE;
    }

    return this.readPalette(isDark);
  });

  private readPalette(isDark: boolean): ThemePalette {
    const probe = this.document.createElement('div');
    probe.className = isDark ? 'dark' : '';
    probe.style.display = 'none';
    this.document.body.appendChild(probe);

    const styles = getComputedStyle(probe);
    const read = (variable: string, fallback: string) =>
      styles.getPropertyValue(variable).trim() || fallback;

    const chart = CHART_COLOR_NAMES.reduce<Record<ChartColorName, string>>(
      (acc, name) => ({ ...acc, [name]: read(CHART_COLOR_VARIABLES[name], SSR_CHART_COLORS[name]) }),
      {} as Record<ChartColorName, string>,
    );

    const semantic = SEMANTIC_COLOR_NAMES.reduce<Record<SemanticColorName, string>>(
      (acc, name) => ({ ...acc, [name]: read(SEMANTIC_COLOR_VARIABLES[name], SSR_SEMANTIC_COLORS[name]) }),
      {} as Record<SemanticColorName, string>,
    );

    const palette: ThemePalette = {
      background: read('--background', SSR_PALETTE.background),
      foreground: read('--foreground', SSR_PALETTE.foreground),
      muted: read('--muted', SSR_PALETTE.muted),
      mutedForeground: read('--muted-foreground', SSR_PALETTE.mutedForeground),
      border: read('--border', SSR_PALETTE.border),
      primary: read('--primary', SSR_PALETTE.primary),
      popover: read('--popover', SSR_PALETTE.popover),
      popoverForeground: read('--popover-foreground', SSR_PALETTE.popoverForeground),
      series: CHART_COLOR_NAMES.map(name => chart[name]),
      chart,
      semantic,
    };

    probe.remove();

    return palette;
  }
}
