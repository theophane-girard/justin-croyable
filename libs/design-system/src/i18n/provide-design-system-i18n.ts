import { Injectable, isDevMode, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { provideTransloco, type Translation, type TranslocoLoader } from '@jsverse/transloco';
import { of, type Observable } from 'rxjs';

import {
  DESIGN_SYSTEM_DEFAULT_LANG,
  DESIGN_SYSTEM_LANGS,
  DESIGN_SYSTEM_TRANSLATIONS,
  type DesignSystemLang,
} from './translations';

/**
 * Les traductions du DS sont embarquées dans le bundle, pas servies en HTTP :
 * une lib n'a pas d'`assets/` à elle, et un chargeur réseau obligerait chaque
 * application consommatrice à recopier ces fichiers.
 */
@Injectable({ providedIn: 'root' })
export class DesignSystemTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(DESIGN_SYSTEM_TRANSLATIONS[lang as DesignSystemLang] ?? {});
  }
}

export type DesignSystemI18nOptions = {
  defaultLang?: DesignSystemLang;
  availableLangs?: readonly string[];
};

/**
 * Configure Transloco avec les traductions du DS.
 *
 * À n'appeler que si l'application n'a pas déjà son propre `provideTransloco()` :
 * les deux se remplaceraient l'un l'autre. Une application qui gère déjà
 * Transloco doit fusionner `DESIGN_SYSTEM_TRANSLATIONS` dans son propre
 * chargeur, ou appeler `setTranslation(..., { merge: true })`.
 */
export function provideDesignSystemI18n(
  options: DesignSystemI18nOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...(options.availableLangs ?? DESIGN_SYSTEM_LANGS)],
        defaultLang: options.defaultLang ?? DESIGN_SYSTEM_DEFAULT_LANG,
        fallbackLang: 'en-US',
        missingHandler: { useFallbackTranslation: true },
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: DesignSystemTranslocoLoader,
    }),
  ]);
}
