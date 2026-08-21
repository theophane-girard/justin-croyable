import { type Route } from '@angular/router';

import { provideJustinCroyableDS, SKELETON_KIND } from '@justin-croyable/design-system';
import { withThree } from '@justin-croyable/design-system/components/scene';

import { APP_PATHS } from '../../app.routes';

export const GARDEN_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./garden.component').then(m => m.GardenComponent),
    title: 'Mon jardin — Potager',
    data: { skeleton: SKELETON_KIND.map },
    providers: [provideJustinCroyableDS(withThree())],
  },
  {
    path: APP_PATHS.add,
    loadComponent: () => import('./add-plant.component').then(m => m.AddPlantComponent),
    title: 'Ajouter un plant — Potager',
    data: { skeleton: SKELETON_KIND.form, breadcrumb: 'Ajouter un plant' },
  },
];
