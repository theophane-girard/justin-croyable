import { computed, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type ParamMap, type Params, Router } from '@angular/router';
import { map } from 'rxjs';

export interface QueryParamCodec<T> {
  readonly defaultValue: T;
  encode(value: T): string | null;
  decode(raw: string | null): T;
}

export function stringFilter(defaultValue = ''): QueryParamCodec<string> {
  return {
    defaultValue,
    encode: (value) => (value === defaultValue || value.length === 0 ? null : value),
    decode: (raw) => raw ?? defaultValue,
  };
}

export function numberFilter(defaultValue = 0): QueryParamCodec<number> {
  return {
    defaultValue,
    encode: (value) => (value === defaultValue ? null : String(value)),
    decode: (raw) => {
      const parsed = raw === null ? Number.NaN : Number(raw);
      return Number.isFinite(parsed) ? parsed : defaultValue;
    },
  };
}

export function booleanFilter(defaultValue = false): QueryParamCodec<boolean> {
  return {
    defaultValue,
    encode: (value) => (value === defaultValue ? null : String(value)),
    decode: (raw) => (raw === null ? defaultValue : raw === 'true'),
  };
}

export function enumFilter<T extends string>(
  allowedValues: readonly T[],
  defaultValue: T,
): QueryParamCodec<T> {
  const allowed = new Set<string>(allowedValues);
  return {
    defaultValue,
    encode: (value) => (value === defaultValue ? null : value),
    decode: (raw) => (raw !== null && allowed.has(raw) ? (raw as T) : defaultValue),
  };
}

export function arrayFilter(
  defaultValue: readonly string[] = [],
  separator = ',',
): QueryParamCodec<readonly string[]> {
  const defaultEncoded = defaultValue.join(separator);
  return {
    defaultValue,
    encode: (value) => {
      const encoded = value.join(separator);
      return value.length === 0 || encoded === defaultEncoded ? null : encoded;
    },
    decode: (raw) => (raw === null || raw.length === 0 ? defaultValue : raw.split(separator)),
  };
}

export const SORT_DIRECTION = { asc: 'asc', desc: 'desc' } as const;

export type SortDirection = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

export interface SortState<TField extends string = string> {
  readonly field: TField;
  readonly direction: SortDirection;
}

export function sortFilter<TField extends string>(
  allowedFields: readonly TField[],
  defaultValue: SortState<TField> | null = null,
): QueryParamCodec<SortState<TField> | null> {
  const allowed = new Set<string>(allowedFields);
  const encodeState = (state: SortState<TField> | null): string | null =>
    state === null ? null : `${state.direction === SORT_DIRECTION.desc ? '-' : ''}${state.field}`;
  const defaultEncoded = encodeState(defaultValue);
  const decodeField = (raw: string): SortState<TField> | null => {
    const descending = raw.startsWith('-');
    const field = descending ? raw.slice(1) : raw;
    if (!allowed.has(field)) {
      return defaultValue;
    }
    return {
      field: field as TField,
      direction: descending ? SORT_DIRECTION.desc : SORT_DIRECTION.asc,
    };
  };
  return {
    defaultValue,
    encode: (value) => {
      const encoded = encodeState(value);
      return encoded === defaultEncoded ? null : encoded;
    },
    decode: (raw) => (raw === null || raw.length === 0 ? defaultValue : decodeField(raw)),
  };
}

export type QueryFilterDefinitions = Record<string, QueryParamCodec<unknown>>;

export type QueryFilterValues<TDefinitions extends QueryFilterDefinitions> = {
  [K in keyof TDefinitions]: TDefinitions[K] extends QueryParamCodec<infer T> ? T : never;
};

type ReservedFilterKey = 'value' | 'set' | 'patch' | 'reset';

type WithoutReservedKeys<TDefinitions extends QueryFilterDefinitions> = {
  [K in keyof TDefinitions & ReservedFilterKey]: never;
};

export type QueryFilters<TDefinitions extends QueryFilterDefinitions> = {
  readonly [K in keyof TDefinitions]: Signal<QueryFilterValues<TDefinitions>[K]>;
} & {
  readonly value: Signal<QueryFilterValues<TDefinitions>>;
  set<K extends keyof TDefinitions>(key: K, value: QueryFilterValues<TDefinitions>[K]): void;
  patch(values: Partial<QueryFilterValues<TDefinitions>>): void;
  reset(): void;
};

export interface QueryFiltersOptions {
  readonly replaceUrl?: boolean;
  readonly prefix?: string;
}

export function injectQueryFilters<TDefinitions extends QueryFilterDefinitions>(
  definitions: TDefinitions & WithoutReservedKeys<TDefinitions>,
  options: QueryFiltersOptions = {},
): QueryFilters<TDefinitions> {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const replaceUrl = options.replaceUrl ?? true;
  const prefix = options.prefix ?? '';

  const codecs: TDefinitions = definitions;
  const keys = Object.keys(codecs) as (keyof TDefinitions)[];
  const paramName = (key: keyof TDefinitions): string => `${prefix}${String(key)}`;

  const decodeAll = (paramMap: ParamMap): QueryFilterValues<TDefinitions> =>
    keys.reduce((values, key) => {
      values[key] = codecs[key].decode(
        paramMap.get(paramName(key)),
      ) as QueryFilterValues<TDefinitions>[typeof key];
      return values;
    }, {} as QueryFilterValues<TDefinitions>);

  const value = toSignal(route.queryParamMap.pipe(map(decodeAll)), {
    initialValue: decodeAll(route.snapshot.queryParamMap),
  });

  const controls = keys.reduce(
    (accumulator, key) => {
      accumulator[key] = computed(() => value()[key]);
      return accumulator;
    },
    {} as { [K in keyof TDefinitions]: Signal<QueryFilterValues<TDefinitions>[K]> },
  );

  const navigate = (queryParams: Params): void => {
    void router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  };

  const toQueryParam = <K extends keyof TDefinitions>(
    key: K,
    filterValue: QueryFilterValues<TDefinitions>[K],
  ): Params => ({ [paramName(key)]: codecs[key].encode(filterValue) });

  const set = <K extends keyof TDefinitions>(
    key: K,
    filterValue: QueryFilterValues<TDefinitions>[K],
  ): void => navigate(toQueryParam(key, filterValue));

  const patch = (values: Partial<QueryFilterValues<TDefinitions>>): void =>
    navigate(
      (Object.keys(values) as (keyof TDefinitions)[]).reduce((queryParams, key) => {
        const filterValue = values[key] as QueryFilterValues<TDefinitions>[typeof key];
        return { ...queryParams, ...toQueryParam(key, filterValue) };
      }, {} as Params),
    );

  const reset = (): void =>
    navigate(
      keys.reduce((queryParams, key) => {
        queryParams[paramName(key)] = null;
        return queryParams;
      }, {} as Params),
    );

  return Object.assign(controls, { value, set, patch, reset }) as QueryFilters<TDefinitions>;
}
