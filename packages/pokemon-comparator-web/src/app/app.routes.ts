import { type Route } from '@angular/router';

export const APP_PATHS = {
  comparator: '',
  pokedex: 'pokedex',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.comparator,
    loadComponent: () =>
      import('./features/comparator/comparator.component').then(m => m.ComparatorComponent),
    title: 'Comparateur — Pokémon Comparator',
  },
  {
    path: APP_PATHS.pokedex,
    loadComponent: () => import('./features/pokedex/pokedex.component').then(m => m.PokedexComponent),
    title: 'Pokédex — Pokémon Comparator',
  },
  {
    path: `${APP_PATHS.pokedex}/:id`,
    loadComponent: () =>
      import('./features/pokedex/pokemon-detail.component').then(m => m.PokemonDetailComponent),
    title: 'Détail — Pokédex',
  },
  {
    path: '**',
    redirectTo: APP_PATHS.comparator,
  },
];
