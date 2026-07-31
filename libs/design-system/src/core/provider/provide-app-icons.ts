import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideFileText,
  lucideFolder,
  lucideHouse,
  lucideInbox,
  lucideMoon,
  lucidePanelLeft,
  lucideSearch,
  lucideSun,
} from '@ng-icons/lucide';

/**
 * Registers the lucide icons referenced at the application level (sidebar menu,
 * toolbar) so `<ng-icon>` can resolve them without a per-component
 * `provideIcons()`. Provided once at the root injector via `appConfig`.
 */
export function provideAppIcons(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideIcons({
      lucideCalendar,
      lucideFileText,
      lucideFolder,
      lucideHouse,
      lucideInbox,
      lucideMoon,
      lucidePanelLeft,
      lucideSearch,
      lucideSun,
    }),
  ]);
}
