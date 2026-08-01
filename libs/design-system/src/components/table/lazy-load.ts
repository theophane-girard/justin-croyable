import {
  computed,
  effect,
  type Injector,
  type ResourceRef,
  runInInjectionContext,
  type Signal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type {
  DateFilterModel,
  ICombinedSimpleModel,
  IDatasource,
  IGetRowsParams,
  NumberFilterModel,
  SortModelItem,
  TextFilterModel,
} from 'ag-grid-community';
import { map, type Observable, of } from 'rxjs';

type ColId<TRow> = Extract<keyof TRow, string>;

export type ColumnFilterModel =
  | TextFilterModel
  | NumberFilterModel
  | DateFilterModel
  | ICombinedSimpleModel<TextFilterModel>
  | ICombinedSimpleModel<NumberFilterModel>
  | ICombinedSimpleModel<DateFilterModel>;

export type LazyLoadSort<TRow> = Omit<SortModelItem, 'colId'> & { readonly colId: ColId<TRow> };

export type LazyLoadFilterModel<TRow> = Partial<Record<ColId<TRow>, ColumnFilterModel>>;

export interface LazyLoadRequest<TRow> {
  readonly startRow: number;
  readonly endRow: number;
  readonly sortModel: LazyLoadSort<TRow>[];
  readonly filterModel: LazyLoadFilterModel<TRow>;
}

export interface LazyLoadBlock<TRow> {
  readonly rows: TRow[];
  readonly lastRow?: number;
}

export type LazyLoadFetcher<TRow> = (
  request: LazyLoadRequest<TRow>,
  abortSignal: AbortSignal,
) => Observable<LazyLoadBlock<TRow>>;

export interface LazyLoadConfig<TRow> {
  readonly fetchRows: LazyLoadFetcher<TRow>;
  readonly blockSize?: number;
  readonly maxConcurrentRequests?: number;
  readonly initialRowCount?: number;
  readonly maxBlocksInCache?: number;
}

type LazyLoadResolved<TRow> = { readonly params: IGetRowsParams; readonly block: LazyLoadBlock<TRow> };

export interface LazyLoadDatasource<TRow> {
  readonly datasource: IDatasource;
  readonly resource: ResourceRef<LazyLoadResolved<TRow> | undefined>;
  readonly loading: Signal<boolean>;
}

function toLazyLoadRequest<TRow>(params: IGetRowsParams): LazyLoadRequest<TRow> {
  return {
    startRow: params.startRow,
    endRow: params.endRow,
    sortModel: params.sortModel as LazyLoadSort<TRow>[],
    filterModel: (params.filterModel ?? {}) as LazyLoadFilterModel<TRow>,
  };
}

export function buildLazyLoadDatasource<TRow>(
  config: Signal<LazyLoadConfig<TRow> | undefined>,
  injector: Injector,
): LazyLoadDatasource<TRow> {
  const requestParams = signal<IGetRowsParams | undefined>(undefined);

  const resource = runInInjectionContext(injector, () =>
    rxResource<LazyLoadResolved<TRow> | undefined, IGetRowsParams | undefined>({
      params: () => requestParams(),
      stream: ({ params, abortSignal }) => {
        const cfg = config();
        if (!params || !cfg) {
          return of(undefined);
        }
        return cfg.fetchRows(toLazyLoadRequest(params), abortSignal).pipe(map(block => ({ params, block })));
      },
    }),
  );

  runInInjectionContext(injector, () =>
    effect(() => {
      const status = resource.status();
      if (status === 'resolved') {
        const resolved = resource.value();
        resolved?.params.successCallback(resolved.block.rows, resolved.block.lastRow ?? -1);
      } else if (status === 'error') {
        untracked(requestParams)?.failCallback();
      }
    }),
  );

  return {
    datasource: { getRows: params => requestParams.set(params) },
    resource,
    loading: computed(() => resource.isLoading()),
  };
}
