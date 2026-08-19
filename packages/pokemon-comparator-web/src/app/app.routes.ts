import { type Route } from '@angular/router';

import { SKELETON_KIND } from '@justin-croyable/design-system';

export const APP_PATHS = {
  comparator: '',
  pokedex: 'pokedex',
  types: 'types',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.comparator,
    loadComponent: () =>
      import('./features/comparator/comparator.component').then(m => m.ComparatorComponent),
    title: 'Comparateur — Pokémon Comparator',
    data: { skeleton: SKELETON_KIND.generic },
  },
  {
    path: APP_PATHS.pokedex,
    loadComponent: () => import('./features/pokedex/pokedex.component').then(m => m.PokedexComponent),
    title: 'Pokédex — Pokémon Comparator',
    data: { skeleton: SKELETON_KIND.grid },
  },
  {
    path: `${APP_PATHS.pokedex}/:id`,
    loadComponent: () =>
      import('./features/pokedex/pokemon-detail.component').then(m => m.PokemonDetailComponent),
    title: 'Détail — Pokédex',
    data: { skeleton: SKELETON_KIND.detail },
  },
  {
    path: APP_PATHS.types,
    loadComponent: () =>
      import('./features/types/type-chart.component').then(m => m.TypeChartComponent),
    title: 'Types & Faiblesses — Pokémon Comparator',
    data: { skeleton: SKELETON_KIND.generic },
  },
  {
    path: '**',
    redirectTo: APP_PATHS.comparator,
  },
];
