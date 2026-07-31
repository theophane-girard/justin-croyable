import type { Translation } from '@jsverse/transloco';

/**
 * L'ordre des placeholders diffère du français : en allemand le verbe passe
 * après le complément. C'est la raison pour laquelle le titre est une clé de
 * traduction et non une concaténation côté code.
 */
export const deDE: Translation = {
  designSystem: {
    dialog: {
      confirm: {
        title: '{{subject}} {{action}}',
        message: 'Möchten Sie {{subject}} wirklich {{action}}?',
      },
      cancel: 'Abbrechen',
      close: 'Schließen',
    },
  },
};
