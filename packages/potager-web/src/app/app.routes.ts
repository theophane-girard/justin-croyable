import { type Route } from '@angular/router';

import { SKELETON_KIND } from '@justin-croyable/design-system';

export const APP_PATHS = {
  dashboard: '',
  harvests: 'recoltes',
  expenses: 'depenses',
  garden: 'jardin',
  prices: 'prix',
  rankings: 'classement',
  add: 'ajouter',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const DASHBOARD_LINK = '/';
export const HARVESTS_LINK = `/${APP_PATHS.harvests}`;
export const HARVEST_ADD_LINK = `/${APP_PATHS.harvests}/${APP_PATHS.add}`;
export const EXPENSES_LINK = `/${APP_PATHS.expenses}`;
export const EXPENSE_ADD_LINK = `/${APP_PATHS.expenses}/${APP_PATHS.add}`;
export const GARDEN_LINK = `/${APP_PATHS.garden}`;
export const GARDEN_ADD_LINK = `/${APP_PATHS.garden}/${APP_PATHS.add}`;
export const PRICES_LINK = `/${APP_PATHS.prices}`;
export const RANKINGS_LINK = `/${APP_PATHS.rankings}`;

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.dashboard,
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Tableau de bord — Potager',
    data: { skeleton: SKELETON_KIND.dashboard },
  },
  {
    path: APP_PATHS.harvests,
    data: { breadcrumb: 'Récoltes' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/harvests/harvests.component').then(m => m.HarvestsComponent),
        title: 'Récoltes — Potager',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/harvests/add-harvest.component').then(m => m.AddHarvestComponent),
        title: 'Ajouter une récolte — Potager',
        data: { skeleton: SKELETON_KIND.form, breadcrumb: 'Ajouter une récolte' },
      },
    ],
  },
  {
    path: APP_PATHS.expenses,
    data: { breadcrumb: 'Dépenses' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        title: 'Dépenses — Potager',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/expenses/add-expense.component').then(m => m.AddExpenseComponent),
        title: 'Ajouter une dépense — Potager',
        data: { skeleton: SKELETON_KIND.form, breadcrumb: 'Ajouter une dépense' },
      },
    ],
  },
  {
    path: APP_PATHS.garden,
    data: { breadcrumb: 'Mon jardin' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/garden/garden.component').then(m => m.GardenComponent),
        title: 'Mon jardin — Potager',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/garden/add-plant.component').then(m => m.AddPlantComponent),
        title: 'Ajouter un plant — Potager',
        data: { skeleton: SKELETON_KIND.form, breadcrumb: 'Ajouter un plant' },
      },
    ],
  },
  {
    path: APP_PATHS.prices,
    loadComponent: () => import('./features/prices/prices.component').then(m => m.PricesComponent),
    title: 'Prix — Potager',
    data: { skeleton: SKELETON_KIND.list },
  },
  {
    path: APP_PATHS.rankings,
    loadComponent: () =>
      import('./features/rankings/rankings.component').then(m => m.RankingsComponent),
    title: 'Classement — Potager',
    data: { skeleton: SKELETON_KIND.dashboard },
  },
  {
    path: '**',
    redirectTo: APP_PATHS.dashboard,
  },
];
