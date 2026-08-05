import { type Route } from '@angular/router';

export const APP_PATHS = {
  dashboard: '',
  harvests: 'recoltes',
  expenses: 'depenses',
  garden: 'jardin',
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
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/harvests/add-harvest.component').then(m => m.AddHarvestComponent),
        title: 'Ajouter une récolte — Potager',
      },
    ],
  },
  {
    path: APP_PATHS.expenses,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        title: 'Dépenses — Potager',
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/expenses/add-expense.component').then(m => m.AddExpenseComponent),
        title: 'Ajouter une dépense — Potager',
      },
    ],
  },
  {
    path: APP_PATHS.garden,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/garden/garden.component').then(m => m.GardenComponent),
        title: 'Mon jardin — Potager',
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/garden/add-plant.component').then(m => m.AddPlantComponent),
        title: 'Ajouter un plant — Potager',
      },
    ],
  },
  {
    path: '**',
    redirectTo: APP_PATHS.dashboard,
  },
];
