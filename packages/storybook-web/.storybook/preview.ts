import {
  DESIGN_SYSTEM_DEFAULT_LANG,
  DESIGN_SYSTEM_LANGS,
  provideJustinCroyableDS,
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
  lucideSearch,
  lucideSun,
} from '@ng-icons/lucide';
import { inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { applicationConfig, type Decorator, type Preview } from '@storybook/angular-vite';

import designSystemPackage from '@justin-croyable/design-system/package.json';

// Le CSS global est importé ici, et non déclaré dans un builder Angular : c'est
// Vite qui le traite, en appliquant PostCSS et Tailwind v4 via `.postcssrc.json`.
import '../src/styles.css';

// Palettes du DS, importées en `?raw` : le contenu CSS réel des fichiers de
// palette, injecté au runtime par le décorateur `withPalette` pour permettre de
// basculer d'une palette à l'autre depuis la toolbar (cf. plus bas). On réutilise
// les fichiers source, il n'y a donc aucune valeur de couleur dupliquée ici.
import fuchsiaPalette from '@justin-croyable/design-system/palettes/fuchsia.css?raw';
import emeraldPalette from '@justin-croyable/design-system/palettes/emerald.css?raw';

const [major = '0', minor = '0', patch = '0'] = designSystemPackage.version.split('.');

/**
 * Bascule light/dark, pilotée par le `ThemeService` du DS et non par la classe
 * `.dark` en direct.
 *
 * C'est ce qui rend le thème observable : `app-chart` et `app-table` réagissent
 * au signal `isDark()` du service. Poser la classe soi-même les laisserait sur
 * le thème du démarrage, et se battrait avec l'effet du service.
 *
 * Même mécanique que pour la langue : le décorateur mémorise le choix, un
 * initialiseur d'application l'applique au démarrage, et la référence permet de
 * l'appliquer à l'instance vivante quand la story est seulement re-rendue.
 */
let activeTheme: Theme = 'light';
let themeRef: ThemeService | null = null;

const withColorScheme: Decorator = (storyFn, context) => {
  activeTheme = context.globals['theme'] === 'dark' ? 'dark' : 'light';
  themeRef?.set(activeTheme);
  return storyFn();
};

/**
 * Palette active du DS.
 *
 * Une palette réelle se choisit à la compilation, en important son fichier CSS
 * (cf. README). Pour la visualiser sans rebuild, on injecte ici le CSS de la
 * palette choisie dans un `<style>` unique de l'aperçu : ses blocs `:root` et
 * `.dark` arrivent après le preset (fuchsia par défaut), donc ils l'emportent.
 * Basculer la toolbar remplace le contenu de ce `<style>`.
 */
const PALETTES = { fuchsia: fuchsiaPalette, emerald: emeraldPalette } as const;
type PaletteName = keyof typeof PALETTES;

const PALETTE_STYLE_ID = 'ds-active-palette';

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
  return storyFn();
};

/**
 * Langue active du DS.
 *
 * Changer un global re-rend la story mais ne re-bootstrappe pas l'application
 * Angular : appliquer la langue depuis le seul initialiseur d'application ne
 * suffit donc pas, elle resterait figée sur celle du premier rendu. On garde une
 * référence au service pour l'appliquer à l'instance vivante à chaque rendu, et
 * la variable sert d'amorce quand une nouvelle application démarre.
 *
 * Un décorateur n'a pas accès à l'injecteur de la story, d'où cette référence de
 * module plutôt qu'une injection.
 */
let activeLang: DesignSystemLang = DESIGN_SYSTEM_DEFAULT_LANG;
let translocoRef: TranslocoService | null = null;

function applyLang(lang: DesignSystemLang): void {
  activeLang = lang;
  if (!translocoRef) {
    return;
  }
  translocoRef.setActiveLang(lang);
  // `translate()` est synchrone : sans ce chargement, une langue jamais affichée
  // rendrait la clé brute côté pipes et directives.
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
        // Configuration du DS par fonctionnalités. `provideZard()` y est inclus
        // d'office : select, command et sidebar dépendent de ses plugins d'event
        // manager pour la syntaxe `(keydown.{arrowdown,enter,escape}.prevent)`.
        provideJustinCroyableDS(
          // Les composants du DS déclarent les icônes de leurs propres templates.
          // Seules celles passées par nom à une entrée ont besoin d'être ici.
          withIcons({
            lucideCalendar,
            lucideFileText,
            lucideFolder,
            lucideHouse,
            lucideInbox,
            lucideMoon,
            lucidePanelLeft,
            lucideSearch,
            lucideSun,
          }),
          withTables(),
          withCharts(),
          withTranslations(),
        ),
        // Router injecté pour les `routerLink` (breadcrumb, header), navigation
        // initiale désactivée : sinon elle réécrit l'URL `/iframe.html` de
        // l'aperçu en `/` et un rechargement dur y charge le manager.
        provideRouter([], withDisabledInitialNavigation()),
        provideAppInitializer(() => {
          // Le thème vient de la toolbar, pas du localStorage du service.
          themeRef = inject(ThemeService);
          themeRef.set(activeTheme);

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
    // Version de la lib DS, affichée dans la toolbar par `storybook-version`.
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
