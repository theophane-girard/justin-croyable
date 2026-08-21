import {
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { provideEchartsCore } from 'ngx-echarts';

import { provideDesignSystemI18n, type DesignSystemI18nOptions } from '../i18n';
import { provideZard } from '../core';
import { CHART_DEFAULTS, TABLE_DEFAULTS, type ChartDefaults, type TableDefaults } from './tokens';

export type DesignSystemFeatureKind = 'icons' | 'tables' | 'charts' | 'translations' | 'three';

export type DesignSystemFeature = {
  readonly kind: DesignSystemFeatureKind;
  readonly providers: (Provider | EnvironmentProviders)[];
};

/**
 * Point d'entrée unique de la configuration du Design System.
 *
 * `provideZard()` est toujours inclus : les composants select, command et
 * sidebar dépendent de ses plugins d'event manager pour la syntaxe
 * `(keydown.{arrowdown,enter,escape}.prevent)`.
 *
 * Le reste est optionnel, chaque fonctionnalité n'apportant que ses propres
 * providers — une application sans tableaux ne charge pas AG Grid.
 *
 * @example
 * provideJustinCroyableDS(
 *   withIcons(SCOPED_APP_ICONS),
 *   withTables(),
 *   withCharts(),
 * )
 */
export function provideJustinCroyableDS(
  ...features: DesignSystemFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideZard(),
    ...features.flatMap(feature => feature.providers),
  ]);
}

/**
 * Enregistre un jeu d'icônes `@ng-icons` pour toute l'application.
 *
 * Le jeu est fourni par l'application (Phosphor, Lucide ou autre) : les
 * composants du DS déclarent déjà les icônes de leurs propres templates, seules
 * celles passées *par nom* à une entrée — `app-empty [icon]`,
 * `app-command-option [icon]` — ont besoin de cet enregistrement.
 */
export function withIcons(icons: Record<string, string>): DesignSystemFeature {
  return { kind: 'icons', providers: [provideIcons(icons)] };
}

export type TablesFeatureOptions = Partial<TableDefaults>;

/**
 * Configure AG Grid : enregistrement des modules community et valeurs par
 * défaut appliquées par `app-table`.
 *
 * L'enregistrement passe par un initialiseur d'application afin de rester
 * paresseux — il ne se produit que si l'application déclare cette
 * fonctionnalité.
 */
export function withTables(options: TablesFeatureOptions = {}): DesignSystemFeature {
  return {
    kind: 'tables',
    providers: [
      provideAppInitializer(() => {
        ModuleRegistry.registerModules([AllCommunityModule]);
      }),
      {
        provide: TABLE_DEFAULTS,
        useValue: { ...DEFAULT_TABLE_DEFAULTS, ...options } satisfies TableDefaults,
      },
    ],
  };
}

export type ChartsFeatureOptions = Partial<ChartDefaults> & {
  /**
   * Instance d'ECharts, ou chargeur paresseux. Par défaut le bundle complet est
   * importé à la demande : c'est le réglage qui marche sans configuration. Une
   * application soucieuse du poids passe ici un `echarts/core` où elle
   * n'enregistre que les composants qu'elle utilise.
   */
  echarts?: unknown | (() => Promise<unknown>);
};

export function withCharts(options: ChartsFeatureOptions = {}): DesignSystemFeature {
  const { echarts, ...defaults } = options;

  return {
    kind: 'charts',
    providers: [
      provideEchartsCore({ echarts: echarts ?? (() => import('echarts')) }),
      {
        provide: CHART_DEFAULTS,
        useValue: { ...DEFAULT_CHART_DEFAULTS, ...defaults } satisfies ChartDefaults,
      },
    ],
  };
}

/**
 * Configure Transloco avec les traductions du DS. À omettre si l'application
 * gère déjà Transloco : les deux configurations se remplaceraient.
 */
export function withTranslations(options: DesignSystemI18nOptions = {}): DesignSystemFeature {
  return { kind: 'translations', providers: [provideDesignSystemI18n(options)] };
}

const DEFAULT_TABLE_DEFAULTS: TableDefaults = {
  rowHeight: 40,
  headerHeight: 40,
  pagination: false,
  paginationPageSize: 25,
};

const DEFAULT_CHART_DEFAULTS: ChartDefaults = {
  height: '20rem',
};
