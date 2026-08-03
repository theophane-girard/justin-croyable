import {
  type ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import {
  provideJustinCroyableDS,
  withIcons,
  withTranslations,
} from '@justin-croyable/design-system';

import { RESUME_ICONS } from './resume.icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter([], withDisabledInitialNavigation()),
    provideJustinCroyableDS(withIcons(RESUME_ICONS), withTranslations()),
  ],
};
