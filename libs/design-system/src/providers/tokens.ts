import { InjectionToken } from '@angular/core';

export type TableDefaults = {
  rowHeight: number;
  headerHeight: number;
  pagination: boolean;
  paginationPageSize: number;
};

export type ChartDefaults = {
  /** Hauteur CSS appliquée par `app-chart` quand l'appelant n'en donne pas. */
  height: string;
};

export type SceneDefaults = {
  /** Hauteur CSS appliquée par `app-scene-canvas` quand l'appelant n'en donne pas. */
  height: string;
  /** Bornes de `devicePixelRatio` sur écran large. */
  dpr: [number, number];
  /** Bornes de `devicePixelRatio` sous le breakpoint `sm`, pour ménager le GPU. */
  mobileDpr: [number, number];
};

export const TABLE_DEFAULTS = new InjectionToken<TableDefaults>('DS_TABLE_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({ rowHeight: 40, headerHeight: 40, pagination: false, paginationPageSize: 25 }),
});

export const CHART_DEFAULTS = new InjectionToken<ChartDefaults>('DS_CHART_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({ height: '20rem' }),
});

export const SCENE_DEFAULTS = new InjectionToken<SceneDefaults>('DS_SCENE_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({ height: '24rem', dpr: [1, 2], mobileDpr: [1, 1.5] }),
});
