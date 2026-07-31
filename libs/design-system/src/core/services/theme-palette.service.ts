import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

import { ThemeService } from './theme.service';

export type ThemePalette = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  popover: string;
  popoverForeground: string;
  series: string[];
};

/**
 * Repli utilisé côté serveur, où aucun style calculé n'existe. Les valeurs sont
 * celles du thème clair du DS.
 */
const SSR_PALETTE: ThemePalette = {
  background: 'oklch(0.972 0.006 323)',
  foreground: 'oklch(0.33 0.008 323)',
  muted: 'oklch(0.94 0.007 323)',
  mutedForeground: 'oklch(0.545 0 323)',
  border: 'oklch(0.885 0.009 323)',
  primary: 'oklch(0.58 0.16 323)',
  popover: 'oklch(0.995 0.002 323)',
  popoverForeground: 'oklch(0.33 0.008 323)',
  series: [
    'oklch(0.64 0.16 323)',
    'oklch(0.808 0.128 323)',
    'oklch(0.485 0.131 323)',
    'oklch(0.55 0.15 250)',
    'oklch(0.55 0.15 145)',
  ],
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

    const palette: ThemePalette = {
      background: read('--background', SSR_PALETTE.background),
      foreground: read('--foreground', SSR_PALETTE.foreground),
      muted: read('--muted', SSR_PALETTE.muted),
      mutedForeground: read('--muted-foreground', SSR_PALETTE.mutedForeground),
      border: read('--border', SSR_PALETTE.border),
      primary: read('--primary', SSR_PALETTE.primary),
      popover: read('--popover', SSR_PALETTE.popover),
      popoverForeground: read('--popover-foreground', SSR_PALETTE.popoverForeground),
      series: [1, 2, 3, 4, 5].map((index, position) =>
        read(`--chart-${index}`, SSR_PALETTE.series[position]),
      ),
    };

    probe.remove();

    return palette;
  }
}
