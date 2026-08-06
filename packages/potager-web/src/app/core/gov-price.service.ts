import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, type Observable, of, switchMap } from 'rxjs';

import { type PricePerKgByVariety, type PriceSource, type VarietyId } from './potager.model';
import { matchVarietyId, normalizeLabel } from './reference-prices';

const RNM_DATASET_API =
  'https://www.data.gouv.fr/api/1/datasets/cotations-du-reseau-des-nouvelles-des-marches/';
const TABULAR_API = 'https://tabular-api.data.gouv.fr/api/resources';
const TABULAR_PAGE_SIZE = 500;
const CSV_FORMAT = 'csv';
const RETAIL_STAGE_KEYWORDS = ['detail', 'gms'] as const;
const PRODUCT_LABEL_KEYS = ['LIBELLE', 'PRODUIT', 'LIBELLE_PRODUIT', 'libelle', 'produit'] as const;
const PRICE_KEYS = ['PRIX', 'COURS', 'PRIX_MOYEN', 'prix', 'cours'] as const;

type DataGouvResource = {
  readonly id: string;
  readonly format: string;
  readonly title: string;
  readonly last_modified?: string;
};

type DataGouvDataset = { readonly resources: readonly DataGouvResource[] };

type TabularRow = Readonly<Record<string, unknown>>;

type TabularResponse = { readonly data: readonly TabularRow[] };

type PriceAccumulator = Partial<Record<VarietyId, { sum: number; count: number }>>;

type LivePriceResult = { readonly source: PriceSource; readonly prices: PricePerKgByVariety | null };

const FALLBACK_RESULT: LivePriceResult = { source: 'reference', prices: null };

@Injectable({ providedIn: 'root' })
export class GovPriceService {
  readonly #http = inject(HttpClient);

  readonly #result = toSignal(this.#loadLivePrices(), { initialValue: FALLBACK_RESULT });

  readonly livePrices = computed(() => this.#result().prices);
  readonly priceSource = computed<PriceSource>(() => this.#result().source);

  #loadLivePrices(): Observable<LivePriceResult> {
    return this.#http.get<DataGouvDataset>(RNM_DATASET_API).pipe(
      map(dataset => this.#pickLatestRetailResourceId(dataset)),
      switchMap(resourceId => this.#http.get<TabularResponse>(this.#tabularUrl(resourceId))),
      map(response => this.#averageRetailPrices(response.data)),
      map(prices => this.#toResult(prices)),
      catchError(() => of(FALLBACK_RESULT)),
    );
  }

  #tabularUrl(resourceId: string): string {
    return `${TABULAR_API}/${resourceId}/data/?page_size=${TABULAR_PAGE_SIZE}`;
  }

  #pickLatestRetailResourceId(dataset: DataGouvDataset): string {
    const retailResource = dataset.resources
      .filter(resource => resource.format.toLowerCase() === CSV_FORMAT)
      .filter(resource => this.#isRetailResource(resource.title))
      .sort((a, b) => (b.last_modified ?? '').localeCompare(a.last_modified ?? ''))
      .at(0);

    if (!retailResource) {
      throw new Error('Aucune cotation détail publiée sur le jeu de données RNM.');
    }
    return retailResource.id;
  }

  #isRetailResource(title: string): boolean {
    const normalized = normalizeLabel(title);
    return RETAIL_STAGE_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  #averageRetailPrices(rows: readonly TabularRow[]): PricePerKgByVariety {
    const accumulator = rows.reduce<PriceAccumulator>(
      (totals, row) => this.#accumulateRow(totals, row),
      {},
    );

    return Object.entries(accumulator).reduce<PricePerKgByVariety>((prices, [varietyId, tally]) => {
      if (!tally || tally.count === 0) {
        return prices;
      }
      return { ...prices, [varietyId as VarietyId]: this.#roundToCents(tally.sum / tally.count) };
    }, {});
  }

  #accumulateRow(totals: PriceAccumulator, row: TabularRow): PriceAccumulator {
    const label = this.#readString(row, PRODUCT_LABEL_KEYS);
    const price = this.#readNumber(row, PRICE_KEYS);
    if (label === null || price === null) {
      return totals;
    }

    const varietyId = matchVarietyId(label);
    if (varietyId === null) {
      return totals;
    }

    const current = totals[varietyId] ?? { sum: 0, count: 0 };
    return { ...totals, [varietyId]: { sum: current.sum + price, count: current.count + 1 } };
  }

  #toResult(prices: PricePerKgByVariety): LivePriceResult {
    if (Object.keys(prices).length === 0) {
      return FALLBACK_RESULT;
    }
    return { source: 'live', prices };
  }

  #readString(row: TabularRow, keys: readonly string[]): string | null {
    const key = keys.find(candidate => typeof row[candidate] === 'string');
    return key ? (row[key] as string) : null;
  }

  #readNumber(row: TabularRow, keys: readonly string[]): number | null {
    const rawKey = keys.find(candidate => row[candidate] !== undefined && row[candidate] !== null);
    if (!rawKey) {
      return null;
    }
    return this.#parseFrenchNumber(row[rawKey]);
  }

  #parseFrenchNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string') {
      return null;
    }
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
