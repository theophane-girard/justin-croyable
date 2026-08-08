import { type Route } from '@angular/router';

export const APP_PATHS = {
  comparator: '',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.comparator,
    loadComponent: () =>
      import('./features/comparator/comparator.component').then(m => m.ComparatorComponent),
    title: 'Pokémon Comparator',
  },
  {
    path: '**',
    redirectTo: APP_PATHS.comparator,
  },
];
