import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { ThemeService } from './theme.service';

export const SEMANTIC_COLOR_NAMES = ['success', 'warning', 'error', 'info'] as const;
export type SemanticColorName = (typeof SEMANTIC_COLOR_NAMES)[number];

export const DECORATIVE_COLOR_NAMES = ['orange', 'lime', 'cyan', 'violet', 'rose'] as const;
export type DecorativeColorName = (typeof DECORATIVE_COLOR_NAMES)[number];

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
  decorative: Record<DecorativeColorName, string>;
  semantic: Record<SemanticColorName, string>;
};

const CHART_SERIES_VARIABLES = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
];

const DECORATIVE_COLOR_VARIABLES: Record<DecorativeColorName, string> = {
  orange: '--orange-500',
  lime: '--lime-500',
  cyan: '--cyan-500',
  violet: '--violet-500',
  rose: '--rose-500',
};

const SEMANTIC_COLOR_VARIABLES: Record<SemanticColorName, string> = {
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
};

const SSR_CHART_SERIES = [
  'oklch(0.64 0.16 323)',
  'oklch(0.64 0.106 197)',
  'oklch(0.64 0.16 51)',
  'oklch(0.64 0.16 286)',
  'oklch(0.64 0.134 108)',
  'oklch(0.64 0.16 355)',
];

const SSR_DECORATIVE_COLORS: Record<DecorativeColorName, string> = {
  orange: 'oklch(0.64 0.16 51)',
  lime: 'oklch(0.64 0.134 108)',
  cyan: 'oklch(0.64 0.106 197)',
  violet: 'oklch(0.64 0.16 286)',
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
  series: SSR_CHART_SERIES,
  decorative: SSR_DECORATIVE_COLORS,
  semantic: SSR_SEMANTIC_COLORS,
};

@Injectable({ providedIn: 'root' })
export class ThemePaletteService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(ThemeService);

  readonly #revision = signal(0);

  readonly palette = computed<ThemePalette>(() => {
    this.#revision();
    const isDark = this.themeService.isDark();

    if (!isPlatformBrowser(this.platformId)) {
      return SSR_PALETTE;
    }

    return this.readPalette(isDark);
  });

  refresh(): void {
    this.#revision.update(revision => revision + 1);
  }

  private readPalette(isDark: boolean): ThemePalette {
    const probe = this.document.createElement('div');
    probe.className = isDark ? 'dark' : '';
    probe.style.display = 'none';
    this.document.body.appendChild(probe);

    const styles = getComputedStyle(probe);
    const read = (variable: string, fallback: string) =>
      styles.getPropertyValue(variable).trim() || fallback;

    const series = CHART_SERIES_VARIABLES.map((variable, index) =>
      read(variable, SSR_CHART_SERIES[index]),
    );

    const decorative = DECORATIVE_COLOR_NAMES.reduce<Record<DecorativeColorName, string>>(
      (acc, name) => ({
        ...acc,
        [name]: read(DECORATIVE_COLOR_VARIABLES[name], SSR_DECORATIVE_COLORS[name]),
      }),
      {} as Record<DecorativeColorName, string>,
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
      series,
      decorative,
      semantic,
    };

    probe.remove();

    return palette;
  }
}
