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

export const TABLE_DEFAULTS = new InjectionToken<TableDefaults>('DS_TABLE_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({ rowHeight: 40, headerHeight: 40, pagination: false, paginationPageSize: 25 }),
});

export const CHART_DEFAULTS = new InjectionToken<ChartDefaults>('DS_CHART_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({ height: '20rem' }),
});
