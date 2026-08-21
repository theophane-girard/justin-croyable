import { type Route } from '@angular/router';
import { provideNgtRenderer } from 'angular-three/dom';

import { SKELETON_KIND } from '@justin-croyable/design-system';

import { APP_PATHS } from '../../app.routes';

export const GARDEN_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./garden.component').then(m => m.GardenComponent),
    title: 'Mon jardin — Potager',
    data: { skeleton: SKELETON_KIND.map },
    providers: [provideNgtRenderer()],
  },
  {
    path: APP_PATHS.add,
    loadComponent: () => import('./add-plant.component').then(m => m.AddPlantComponent),
    title: 'Ajouter un plant — Potager',
    data: { skeleton: SKELETON_KIND.form, breadcrumb: 'Ajouter un plant' },
  },
];
