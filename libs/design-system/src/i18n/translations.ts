import type { Translation } from '@jsverse/transloco';

import { deDE } from './de-DE';
import { enUS } from './en-US';
import { esES } from './es-ES';
import { frFR } from './fr-FR';
import { itIT } from './it-IT';

export const DESIGN_SYSTEM_LANGS = ['fr-FR', 'en-US', 'es-ES', 'it-IT', 'de-DE'] as const;

export type DesignSystemLang = (typeof DESIGN_SYSTEM_LANGS)[number];

export const DESIGN_SYSTEM_DEFAULT_LANG: DesignSystemLang = 'fr-FR';

export const DESIGN_SYSTEM_TRANSLATIONS: Record<DesignSystemLang, Translation> = {
  'fr-FR': frFR,
  'en-US': enUS,
  'es-ES': esES,
  'it-IT': itIT,
  'de-DE': deDE,
};

export function isDesignSystemLang(lang: string | undefined | null): lang is DesignSystemLang {
  return !!lang && (DESIGN_SYSTEM_LANGS as readonly string[]).includes(lang);
}

/**
 * Traduit une clé sans passer par Transloco.
 *
 * Sert de repli aux composants du DS quand l'application consommatrice n'a pas
 * appelé `provideDesignSystemI18n()` : ils restent utilisables et affichent la
 * langue par défaut, au lieu d'échouer à l'injection de `TranslocoService`.
 */
export function translateDesignSystem(
  key: string,
  params: Record<string, string> = {},
  lang: DesignSystemLang = DESIGN_SYSTEM_DEFAULT_LANG,
): string {
  const raw = readKey(DESIGN_SYSTEM_TRANSLATIONS[lang], key) ?? key;
  return raw.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, name: string) => params[name] ?? match);
}

function readKey(translation: Translation, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, translation);

  return typeof value === 'string' ? value : undefined;
}
