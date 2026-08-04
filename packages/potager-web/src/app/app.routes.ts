import { type Route } from '@angular/router';

export const APP_PATHS = {
  dashboard: '',
  harvests: 'recoltes',
  harvestAdd: 'ajouter',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const DASHBOARD_LINK = '/';
export const HARVESTS_LINK = `/${APP_PATHS.harvests}`;
export const HARVEST_ADD_LINK = `/${APP_PATHS.harvests}/${APP_PATHS.harvestAdd}`;

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.dashboard,
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Tableau de bord — Potager',
  },
  {
    path: APP_PATHS.harvests,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/harvests/harvests.component').then(m => m.HarvestsComponent),
        title: 'Récoltes — Potager',
      },
      {
        path: APP_PATHS.harvestAdd,
        loadComponent: () =>
          import('./features/harvests/add-harvest.component').then(m => m.AddHarvestComponent),
        title: 'Ajouter une récolte — Potager',
      },
    ],
  },
  {
    path: '**',
    redirectTo: APP_PATHS.dashboard,
  },
];
