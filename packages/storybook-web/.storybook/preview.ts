import { provideZard } from '@justin-croyable/design-system';
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

const preview: Preview = {
  decorators: [
    withColorScheme,
    applicationConfig({
      providers: [
        // `provideZard()` installe les plugins d'event manager dont dépend la
        // syntaxe `(keydown.{arrowdown,enter,escape}.prevent)` utilisée par
        // select et command : sans lui, la navigation clavier est muette.
        provideZard(),
        // Breadcrumb et header rendent des `routerLink` : sans Router injecté,
        // ces stories lèvent une erreur au rendu.
        provideRouter([]),
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
