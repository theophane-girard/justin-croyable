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
import type { FilterModel, IDatasource, IGetRowsParams, SortModelItem } from 'ag-grid-community';
import { map, type Observable, of } from 'rxjs';

/**
 * Fenêtre de lignes réclamée par AG Grid pour le row model `infinite`.
 * Reprend les champs utiles d'`IGetRowsParams` sans exposer les callbacks
 * impératifs de la grille à l'appelant.
 */
export interface LazyLoadRequest {
  /** Index (inclus) de la première ligne du bloc demandé. */
  readonly startRow: number;
  /** Index (exclu) de la ligne suivant le bloc demandé. */
  readonly endRow: number;
  /** Tri courant de la grille, dans l'ordre de priorité. */
  readonly sortModel: SortModelItem[];
  /**
   * Modèle de filtre courant, tel que renvoyé par `gridApi.getFilterModel()` :
   * une map indexée par identifiant de colonne. La valeur de chaque entrée
   * dépend du filtre concerné (`TextFilterModel`, `NumberFilterModel`, …), d'où
   * son typage `any` côté AG Grid.
   */
  readonly filterModel: FilterModel;
}

/** Résultat d'un chargement paresseux : le bloc de lignes et, si connu, le total. */
export interface LazyLoadBlock<TRow> {
  readonly rows: TRow[];
  /**
   * Nombre total de lignes du jeu de données. Laissez `undefined` tant qu'il
   * est inconnu : AG Grid continuera alors de réclamer des blocs jusqu'à en
   * recevoir un plus court que `blockSize`.
   */
  readonly lastRow?: number;
}

/**
 * Fabrique le flux d'un bloc. Doit émettre **un seul** {@link LazyLoadBlock}
 * puis compléter, à la manière d'un appel `HttpClient`. C'est le désabonnement
 * de cet `Observable` qui annule la requête en vol (un `HttpClient` Angular
 * coupe alors le XHR). `abortSignal` est fourni en complément pour les appelants
 * qui s'appuient sur `fetch` plutôt que sur RxJS.
 */
export type LazyLoadFetcher<TRow> = (
  request: LazyLoadRequest,
  abortSignal: AbortSignal,
) => Observable<LazyLoadBlock<TRow>>;

/** Configuration du mode lazy-loading (infinite scroll) du tableau. */
export interface LazyLoadConfig<TRow> {
  /** Builder de datasource : produit le flux de chaque bloc réclamé. */
  readonly fetchRows: LazyLoadFetcher<TRow>;
  /** Taille des blocs réclamés (défaut : `paginationPageSize` des tokens). */
  readonly blockSize?: number;
  /** Requêtes concurrentes autorisées par AG Grid (défaut : 1). */
  readonly maxConcurrentRequests?: number;
  /** Nombre de lignes affichées avant le premier chargement (défaut : 1). */
  readonly initialRowCount?: number;
  /** Nombre de blocs gardés en cache ; au-delà, les plus anciens sont purgés. */
  readonly maxBlocksInCache?: number;
}

/** Bloc résolu, accompagné des `params` du `getRows` qui l'a déclenché. */
type LazyLoadResolved<TRow> = { readonly params: IGetRowsParams; readonly block: LazyLoadBlock<TRow> };

/** Datasource `infinite` prête pour AG Grid, plus l'état de chargement observable. */
export interface LazyLoadDatasource<TRow> {
  /** À passer telle quelle à AG Grid (`gridOptions.datasource`). */
  readonly datasource: IDatasource;
  /** Resource signal exposant l'état courant (`isLoading`, `error`, `status`, …). */
  readonly resource: ResourceRef<LazyLoadResolved<TRow> | undefined>;
  /** Vrai tant qu'un bloc est en cours de chargement. */
  readonly loading: Signal<boolean>;
}

function toLazyLoadRequest(params: IGetRowsParams): LazyLoadRequest {
  return {
    startRow: params.startRow,
    endRow: params.endRow,
    sortModel: params.sortModel,
    filterModel: params.filterModel,
  };
}

/**
 * Construit la datasource `infinite` d'AG Grid à partir d'un {@link LazyLoadConfig}.
 *
 * Le cœur est un `rxResource` piloté par un signal de requête : chaque appel de
 * `getRows` remplace le signal, ce qui **annule** le flux précédent encore en
 * vol (le `rxResource` se désabonne de l'ancien `Observable` et passe un nouvel
 * `AbortSignal`) avant d'en démarrer un neuf. On câble ensuite la valeur résolue
 * de la resource vers le `successCallback` du bloc qui l'a déclenchée — la
 * resource emporte ses propres `params`, de sorte qu'une réponse tardive ne peut
 * jamais alimenter le mauvais bloc.
 *
 * À créer dans un contexte d'injection (le composant fournit son `Injector`) :
 * `rxResource` et `effect` en dépendent, et leur nettoyage suit alors le cycle
 * de vie du composant.
 */
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
        // On transporte `params` avec le bloc pour recoller la réponse au
        // callback exact qui l'a demandée, indépendamment de l'ordre d'arrivée.
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
