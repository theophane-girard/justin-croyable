import { provideHttpClient, withFetch } from '@angular/common/http';
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';

import {
  provideJustinCroyableDS,
  withCharts,
  withIcons,
  withTables,
  withTranslations,
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
      withPreloading(PreloadAllModules),
    ),
    provideJustinCroyableDS(
      withIcons(APP_ICONS),
      withTables(),
      withCharts(),
      withTranslations(),
    ),
  ],
};
