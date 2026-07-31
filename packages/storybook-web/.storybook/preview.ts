import {
  DESIGN_SYSTEM_LANGS,
  provideDesignSystemI18n,
  provideZard,
  type DesignSystemLang,
} from '@justin-croyable/design-system';
import { TranslocoService } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
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
import { provideRouter } from '@angular/router';
import { applicationConfig, type Decorator, type Preview } from '@storybook/angular';

// Le CSS global n'est pas importé ici : il est déclaré dans l'option `styles`
// du builder (`angular.json`), donc traité par le pipeline de styles d'Angular
// — c'est ce qui applique PostCSS/Tailwind v4 via `.postcssrc.json`.

/**
 * Bascule light/dark : le DS pose son thème sombre via la classe `.dark` sur
 * l'élément racine (cf. `@custom-variant dark` du preset). On la pilote depuis
 * la toolbar plutôt que via `ThemeService`, pour que le choix survive au
 * remontage d'une story et reste indépendant du `localStorage` du service.
 */
const withColorScheme: Decorator = (storyFn, context) => {
  const isDark = context.globals['theme'] === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  return storyFn();
};

/**
 * Langue active du DS. Un décorateur n'a pas accès à l'injecteur de la story,
 * donc il mémorise le choix de la toolbar ici et un initialiseur d'application
 * l'applique à Transloco au démarrage de la story.
 */
let activeLang: DesignSystemLang = 'fr-FR';

const withLocale: Decorator = (storyFn, context) => {
  activeLang = (context.globals['locale'] as DesignSystemLang) ?? 'fr-FR';
  return storyFn();
};

const preview: Preview = {
  decorators: [
    withColorScheme,
    withLocale,
    applicationConfig({
      providers: [
        // `provideZard()` installe les plugins d'event manager dont dépend la
        // syntaxe `(keydown.{arrowdown,enter,escape}.prevent)` utilisée par
        // select et command : sans lui, la navigation clavier est muette.
        provideZard(),
        // Breadcrumb et header rendent des `routerLink` : sans Router injecté,
        // ces stories lèvent une erreur au rendu.
        provideRouter([]),
        // Traductions du DS, en mémoire : le sélecteur de langue de la toolbar
        // appelle ensuite setActiveLang sur le service.
        provideDesignSystemI18n(),
        provideAppInitializer(() => {
          const transloco = inject(TranslocoService);
          transloco.setActiveLang(activeLang);
          // translate() est synchrone : sans ce préchargement, les premières
          // ouvertures de modale afficheraient la clé au lieu du libellé.
          return transloco.load(activeLang);
        }),
        // Les composants du DS enregistrent eux-mêmes leurs icônes internes.
        // Ici on ne déclare que celles passées *par nom* depuis les stories
        // (`app-empty [icon]`, `app-command-option [icon]`).
        provideIcons({
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
      ],
    }),
  ],
  globalTypes: {
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
    theme: 'light',
    locale: 'fr-FR',
    backgrounds: { value: 'ds-white' },
  },
  parameters: {
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
