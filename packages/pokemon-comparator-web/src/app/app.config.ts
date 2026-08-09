import { provideHttpClient, withFetch } from '@angular/common/http';
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import {
  DEFAULT_ROUTE_SKELETONS,
  GenericSkeletonComponent,
  provideJustinCroyableDS,
  provideRouteSkeletons,
  withCharts,
  withIcons,
} from '@justin-croyable/design-system';

import { APP_ICONS } from './app.icons';
import { APP_ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(
      APP_ROUTES,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideJustinCroyableDS(withIcons(APP_ICONS), withCharts()),
    provideRouteSkeletons({
      registry: DEFAULT_ROUTE_SKELETONS,
      fallback: GenericSkeletonComponent,
    }),
  ],
};
