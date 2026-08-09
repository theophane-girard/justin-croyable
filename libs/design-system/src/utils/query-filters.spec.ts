import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, type ParamMap, type Params, Router } from '@angular/router';
import { BehaviorSubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  arrayFilter,
  booleanFilter,
  enumFilter,
  injectQueryFilters,
  numberFilter,
  type QueryFilterDefinitions,
  type QueryFiltersOptions,
  sortFilter,
  stringFilter,
} from './query-filters';

describe('codecs', () => {
  describe('stringFilter', () => {
    it('décode une valeur absente vers le défaut', () => {
      expect(stringFilter('def').decode(null)).toBe('def');
    });

    it('décode la valeur brute telle quelle', () => {
      expect(stringFilter().decode('hello')).toBe('hello');
    });

    it('ne sérialise ni le défaut ni la chaîne vide', () => {
      expect(stringFilter('def').encode('def')).toBeNull();
      expect(stringFilter().encode('')).toBeNull();
    });

    it('sérialise une valeur non-défaut', () => {
      expect(stringFilter().encode('hello')).toBe('hello');
    });
  });

  describe('numberFilter', () => {
    it('décode vers le défaut quand absent ou invalide', () => {
      expect(numberFilter(3).decode(null)).toBe(3);
      expect(numberFilter(3).decode('abc')).toBe(3);
    });

    it('décode une valeur numérique', () => {
      expect(numberFilter().decode('42')).toBe(42);
    });

    it('ne sérialise pas le défaut', () => {
      expect(numberFilter(0).encode(0)).toBeNull();
      expect(numberFilter(0).encode(5)).toBe('5');
    });
  });

  describe('booleanFilter', () => {
    it('décode false/true et le défaut', () => {
      expect(booleanFilter(false).decode(null)).toBe(false);
      expect(booleanFilter(false).decode('true')).toBe(true);
      expect(booleanFilter(true).decode('false')).toBe(false);
    });

    it('ne sérialise pas le défaut', () => {
      expect(booleanFilter(false).encode(false)).toBeNull();
      expect(booleanFilter(false).encode(true)).toBe('true');
    });
  });

  describe('enumFilter', () => {
    const codec = enumFilter(['a', 'b', 'c'], 'a');

    it('retombe sur le défaut pour une valeur hors liste', () => {
      expect(codec.decode('z')).toBe('a');
      expect(codec.decode(null)).toBe('a');
    });

    it('décode une valeur autorisée', () => {
      expect(codec.decode('b')).toBe('b');
    });

    it('ne sérialise pas le défaut', () => {
      expect(codec.encode('a')).toBeNull();
      expect(codec.encode('c')).toBe('c');
    });
  });

  describe('arrayFilter', () => {
    it('décode une liste séparée par des virgules', () => {
      expect(arrayFilter().decode('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(arrayFilter().decode(null)).toEqual([]);
    });

    it('ne sérialise ni le défaut ni une liste vide', () => {
      expect(arrayFilter(['x']).encode(['x'])).toBeNull();
      expect(arrayFilter().encode([])).toBeNull();
      expect(arrayFilter().encode(['a', 'b'])).toBe('a,b');
    });

    it('respecte un séparateur personnalisé', () => {
      const codec = arrayFilter([], '|');
      expect(codec.encode(['a', 'b'])).toBe('a|b');
      expect(codec.decode('a|b')).toEqual(['a', 'b']);
    });
  });

  describe('sortFilter', () => {
    const codec = sortFilter(['name', 'date'], { field: 'name', direction: 'asc' });

    it('décode le défaut quand absent', () => {
      expect(codec.decode(null)).toEqual({ field: 'name', direction: 'asc' });
    });

    it('décode ascendant et descendant', () => {
      expect(codec.decode('date')).toEqual({ field: 'date', direction: 'asc' });
      expect(codec.decode('-date')).toEqual({ field: 'date', direction: 'desc' });
    });

    it('retombe sur le défaut pour un champ hors liste', () => {
      expect(codec.decode('-unknown')).toEqual({ field: 'name', direction: 'asc' });
    });

    it('sérialise avec le préfixe de direction et ignore le défaut', () => {
      expect(codec.encode({ field: 'name', direction: 'asc' })).toBeNull();
      expect(codec.encode({ field: 'date', direction: 'desc' })).toBe('-date');
      expect(codec.encode({ field: 'date', direction: 'asc' })).toBe('date');
    });

    it('sérialise null (aucun tri) vers null', () => {
      expect(sortFilter(['name']).encode(null)).toBeNull();
    });
  });
});

class FakeActivatedRoute {
  private readonly subject: BehaviorSubject<ParamMap>;
  readonly queryParamMap: Observable<ParamMap>;
  snapshot: { queryParamMap: ParamMap };

  constructor(initial: Record<string, string>) {
    const paramMap = convertToParamMap(initial);
    this.subject = new BehaviorSubject<ParamMap>(paramMap);
    this.queryParamMap = this.subject.asObservable();
    this.snapshot = { queryParamMap: paramMap };
  }

  applyMerge(queryParams: Params): void {
    const current = this.snapshot.queryParamMap;
    const merged = current.keys.reduce<Record<string, string>>((accumulator, key) => {
      accumulator[key] = current.get(key) ?? '';
      return accumulator;
    }, {});
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        delete merged[key];
        return;
      }
      merged[key] = String(value);
    });
    const paramMap = convertToParamMap(merged);
    this.snapshot = { queryParamMap: paramMap };
    this.subject.next(paramMap);
  }

  currentParams(): Record<string, string> {
    const paramMap = this.snapshot.queryParamMap;
    return paramMap.keys.reduce<Record<string, string>>((accumulator, key) => {
      accumulator[key] = paramMap.get(key) ?? '';
      return accumulator;
    }, {});
  }
}

class FakeRouter {
  constructor(private readonly route: FakeActivatedRoute) {}

  navigate(_commands: unknown[], extras: { queryParams: Params }): Promise<boolean> {
    this.route.applyMerge(extras.queryParams);
    return Promise.resolve(true);
  }
}

type GuardedDefinitions<TDefinitions extends QueryFilterDefinitions> = TDefinitions & {
  [K in keyof TDefinitions & ('value' | 'set' | 'patch' | 'reset')]: never;
};

function setup<TDefinitions extends QueryFilterDefinitions>(
  initial: Record<string, string>,
  definitions: GuardedDefinitions<TDefinitions>,
  options?: QueryFiltersOptions,
) {
  const route = new FakeActivatedRoute(initial);
  const router = new FakeRouter(route);
  TestBed.configureTestingModule({
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
    ],
  });
  const filters = TestBed.runInInjectionContext(() => injectQueryFilters(definitions, options));
  return { filters, route, router };
}

describe('injectQueryFilters', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("lit les filtres depuis l'URL à l'initialisation", () => {
    const { filters } = setup(
      { culture: 'tomate', page: '2' },
      { culture: enumFilter(['all', 'tomate'], 'all'), page: numberFilter(1) },
    );

    expect(filters.culture()).toBe('tomate');
    expect(filters.page()).toBe(2);
    expect(filters.value()).toEqual({ culture: 'tomate', page: 2 });
  });

  it('applique le défaut quand le param est absent', () => {
    const { filters } = setup({}, { culture: enumFilter(['all', 'tomate'], 'all') });
    expect(filters.culture()).toBe('all');
  });

  it("écrit la valeur dans l'URL via set", () => {
    const { filters, route } = setup({}, { culture: enumFilter(['all', 'tomate'], 'all') });

    filters.set('culture', 'tomate');

    expect(route.currentParams()).toEqual({ culture: 'tomate' });
    expect(filters.culture()).toBe('tomate');
  });

  it("retire le param de l'URL quand la valeur revient au défaut", () => {
    const { filters, route } = setup(
      { culture: 'tomate' },
      { culture: enumFilter(['all', 'tomate'], 'all') },
    );

    filters.set('culture', 'all');

    expect(route.currentParams()).toEqual({});
    expect(filters.culture()).toBe('all');
  });

  it('préserve les autres query params (merge)', () => {
    const { filters, route } = setup(
      { page: '3' },
      { culture: enumFilter(['all', 'tomate'], 'all') },
    );

    filters.set('culture', 'tomate');

    expect(route.currentParams()).toEqual({ page: '3', culture: 'tomate' });
  });

  it('applique plusieurs filtres en une seule navigation via patch', () => {
    const { filters, route, router } = setup(
      {},
      { search: stringFilter(), inStock: booleanFilter(false) },
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    filters.patch({ search: 'tomate', inStock: true });

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(route.currentParams()).toEqual({ search: 'tomate', inStock: 'true' });
  });

  it('réinitialise tous les filtres du jeu via reset', () => {
    const { filters, route } = setup(
      { search: 'tomate', extra: 'keep' },
      { search: stringFilter(), inStock: booleanFilter(false) },
    );

    filters.reset();

    expect(route.currentParams()).toEqual({ extra: 'keep' });
    expect(filters.search()).toBe('');
  });

  it('réagit à une navigation externe (retour/avant, lien partagé)', () => {
    const { filters, route } = setup({}, { culture: enumFilter(['all', 'tomate'], 'all') });

    expect(filters.culture()).toBe('all');
    route.applyMerge({ culture: 'tomate' });

    expect(filters.culture()).toBe('tomate');
  });

  it('préfixe les noms de params via option prefix', () => {
    const { filters, route } = setup(
      { 'garden.culture': 'tomate' },
      { culture: enumFilter(['all', 'tomate'], 'all') },
      { prefix: 'garden.' },
    );

    expect(filters.culture()).toBe('tomate');

    filters.set('culture', 'all');
    expect(route.currentParams()).toEqual({});
  });

  it('gère un cycle complet de tri via sortFilter', () => {
    const { filters, route } = setup(
      {},
      { sort: sortFilter(['name', 'date'], { field: 'name', direction: 'asc' }) },
    );

    filters.set('sort', { field: 'date', direction: 'desc' });
    expect(route.currentParams()).toEqual({ sort: '-date' });
    expect(filters.sort()).toEqual({ field: 'date', direction: 'desc' });

    filters.set('sort', { field: 'name', direction: 'asc' });
    expect(route.currentParams()).toEqual({});
  });
});
