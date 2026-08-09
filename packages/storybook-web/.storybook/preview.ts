import {
  DESIGN_SYSTEM_DEFAULT_LANG,
  DESIGN_SYSTEM_LANGS,
  provideJustinCroyableDS,
  ThemePaletteService,
  ThemeService,
  withCharts,
  withIcons,
  withTables,
  withTranslations,
  type DesignSystemLang,
  type Theme,
} from '@justin-croyable/design-system';
import { TranslocoService } from '@jsverse/transloco';
import {
  lucideCalendar,
  lucideFileText,
  lucideFolder,
  lucideHouse,
  lucideInbox,
  lucideMoon,
  lucidePanelLeft,
  lucideRefreshCw,
  lucideSearch,
  lucideSun,
} from '@ng-icons/lucide';
import { inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { applicationConfig, type Decorator, type Preview } from '@storybook/angular-vite';

import designSystemPackage from '@justin-croyable/design-system/package.json';

import '../src/styles.css';

import fuchsiaPalette from '@justin-croyable/design-system/palettes/fuchsia.css?raw';
import emeraldPalette from '@justin-croyable/design-system/palettes/emerald.css?raw';

const [major = '0', minor = '0', patch = '0'] = designSystemPackage.version.split('.');

let activeTheme: Theme = 'light';
let themeRef: ThemeService | null = null;

const withColorScheme: Decorator = (storyFn, context) => {
  activeTheme = context.globals['theme'] === 'dark' ? 'dark' : 'light';
  themeRef?.set(activeTheme);
  return storyFn();
};

const PALETTES = { fuchsia: fuchsiaPalette, emerald: emeraldPalette } as const;
type PaletteName = keyof typeof PALETTES;

const PALETTE_STYLE_ID = 'ds-active-palette';

let paletteServiceRef: ThemePaletteService | null = null;

function applyPalette(name: PaletteName): void {
  const existing = document.getElementById(PALETTE_STYLE_ID);
  const style = existing instanceof HTMLStyleElement ? existing : document.createElement('style');
  style.id = PALETTE_STYLE_ID;
  style.textContent = PALETTES[name];
  if (!existing) {
    document.head.appendChild(style);
  }
}

const withPalette: Decorator = (storyFn, context) => {
  applyPalette(context.globals['palette'] === 'emerald' ? 'emerald' : 'fuchsia');
  paletteServiceRef?.refresh();
  return storyFn();
};

let activeLang: DesignSystemLang = DESIGN_SYSTEM_DEFAULT_LANG;
let translocoRef: TranslocoService | null = null;

function applyLang(lang: DesignSystemLang): void {
  activeLang = lang;
  if (!translocoRef) {
    return;
  }
  translocoRef.setActiveLang(lang);

  translocoRef.load(lang).subscribe({ error: () => undefined });
}

const withLocale: Decorator = (storyFn, context) => {
  applyLang((context.globals['locale'] as DesignSystemLang) ?? DESIGN_SYSTEM_DEFAULT_LANG);
  return storyFn();
};

const preview: Preview = {
  decorators: [
    withPalette,
    withColorScheme,
    withLocale,
    applicationConfig({
      providers: [

        provideJustinCroyableDS(

          withIcons({
            lucideCalendar,
            lucideFileText,
            lucideFolder,
            lucideHouse,
            lucideInbox,
            lucideMoon,
            lucidePanelLeft,
            lucideRefreshCw,
            lucideSearch,
            lucideSun,
          }),
          withTables(),
          withCharts(),
          withTranslations(),
        ),

        provideRouter([], withDisabledInitialNavigation()),
        provideAppInitializer(() => {
          themeRef = inject(ThemeService);
          themeRef.set(activeTheme);

          paletteServiceRef = inject(ThemePaletteService);

          const transloco = inject(TranslocoService);
          translocoRef = transloco;
          transloco.setActiveLang(activeLang);
          return transloco.load(activeLang);
        }),
      ],
    }),
  ],
  globalTypes: {
    palette: {
      description: 'Palette de couleurs du Design System',
      toolbar: {
        title: 'Palette',
        icon: 'swatchbook',
        items: [
          { value: 'fuchsia', title: 'Fuchsia (323)' },
          { value: 'emerald', title: 'Emerald (160)' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Langue des libellés du Design System',
      toolbar: {
        title: 'Langue',
        icon: 'globe',
        items: DESIGN_SYSTEM_LANGS.map(lang => ({ value: lang, title: lang })),
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Thème du Design System',
      toolbar: {
        title: 'Thème',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    palette: 'fuchsia',
    theme: 'light',
    locale: DESIGN_SYSTEM_DEFAULT_LANG,
    backgrounds: { value: 'ds-white' },
  },
  parameters: {
    version: { major, minor, patch },
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        'ds-white': { name: 'DS white', value: 'oklch(0.972 0.006 323)' },
        'ds-black': { name: 'DS black', value: 'oklch(0.22 0.012 323)' },
      },
    },
    a11y: { test: 'todo' },
  },
};

export default preview;
