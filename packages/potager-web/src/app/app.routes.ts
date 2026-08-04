import { type Route } from '@angular/router';

export const APP_PATHS = {
  dashboard: '',
  harvests: 'recoltes',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.dashboard,
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Tableau de bord — Potager',
  },
  {
    path: APP_PATHS.harvests,
    loadComponent: () =>
      import('./features/harvests/harvests.component').then(m => m.HarvestsComponent),
    title: 'Récoltes — Potager',
  },
  {
    path: '**',
    redirectTo: APP_PATHS.dashboard,
  },
];
