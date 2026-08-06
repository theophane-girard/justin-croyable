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
const PRODUCTION_MODE_KEYS = [
  'MODE_PRODUCTION',
  'PRODUCTION',
  'MODE',
  'QUALITE',
  'SEGMENT',
  'mode_production',
  'production',
  'mode',
  'qualite',
  'segment',
] as const;
const BIO_KEYWORDS = ['biologique', 'bio'] as const;
const BIO_MODE_CODE = 'ab';

type DataGouvResource = {
  readonly id: string;
  readonly format: string;
  readonly title: string;
  readonly last_modified?: string;
};

type DataGouvDataset = { readonly resources: readonly DataGouvResource[] };

type TabularRow = Readonly<Record<string, unknown>>;

type TabularResponse = { readonly data: readonly TabularRow[] };

type PriceTally = { readonly sum: number; readonly count: number };
type PriceAccumulator = Partial<Record<VarietyId, PriceTally>>;
type PriceAccumulators = { readonly conventional: PriceAccumulator; readonly bio: PriceAccumulator };
type AveragedPrices = {
  readonly conventional: PricePerKgByVariety;
  readonly bio: PricePerKgByVariety;
};

type LivePriceResult = {
  readonly source: PriceSource;
  readonly bioSource: PriceSource;
  readonly prices: PricePerKgByVariety | null;
  readonly bioPrices: PricePerKgByVariety | null;
  readonly date: Date | null;
};

const FALLBACK_RESULT: LivePriceResult = {
  source: 'reference',
  bioSource: 'reference',
  prices: null,
  bioPrices: null,
  date: null,
};

@Injectable({ providedIn: 'root' })
export class GovPriceService {
  readonly #http = inject(HttpClient);

  readonly #result = toSignal(this.#loadLivePrices(), { initialValue: FALLBACK_RESULT });

  readonly livePrices = computed(() => this.#result().prices);
  readonly liveBioPrices = computed(() => this.#result().bioPrices);
  readonly priceSource = computed<PriceSource>(() => this.#result().source);
  readonly bioPriceSource = computed<PriceSource>(() => this.#result().bioSource);
  readonly priceDate = computed<Date | null>(() => this.#result().date);

  #loadLivePrices(): Observable<LivePriceResult> {
    return this.#http.get<DataGouvDataset>(RNM_DATASET_API).pipe(
      map(dataset => this.#pickLatestRetailResource(dataset)),
      switchMap(resource => this.#pricesForResource(resource)),
      catchError(() => of(FALLBACK_RESULT)),
    );
  }

  #pricesForResource(resource: DataGouvResource): Observable<LivePriceResult> {
    return this.#http.get<TabularResponse>(this.#tabularUrl(resource.id)).pipe(
      map(response =>
        this.#toResult(this.#averageRetailPrices(response.data), this.#parseDate(resource)),
      ),
    );
  }

  #tabularUrl(resourceId: string): string {
    return `${TABULAR_API}/${resourceId}/data/?page_size=${TABULAR_PAGE_SIZE}`;
  }

  #pickLatestRetailResource(dataset: DataGouvDataset): DataGouvResource {
    const retailResource = dataset.resources
      .filter(resource => resource.format.toLowerCase() === CSV_FORMAT)
      .filter(resource => this.#isRetailResource(resource.title))
      .sort((a, b) => (b.last_modified ?? '').localeCompare(a.last_modified ?? ''))
      .at(0);

    if (!retailResource) {
      throw new Error('Aucune cotation détail publiée sur le jeu de données RNM.');
    }
    return retailResource;
  }

  #parseDate(resource: DataGouvResource): Date | null {
    if (resource.last_modified === undefined) {
      return null;
    }
    const parsed = new Date(resource.last_modified);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  #isRetailResource(title: string): boolean {
    const normalized = normalizeLabel(title);
    return RETAIL_STAGE_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  #averageRetailPrices(rows: readonly TabularRow[]): AveragedPrices {
    const accumulators = rows.reduce<PriceAccumulators>((totals, row) => this.#accumulateRow(totals, row), {
      conventional: {},
      bio: {},
    });
    return {
      conventional: this.#toAverages(accumulators.conventional),
      bio: this.#toAverages(accumulators.bio),
    };
  }

  #toAverages(accumulator: PriceAccumulator): PricePerKgByVariety {
    return Object.entries(accumulator).reduce<PricePerKgByVariety>((prices, [varietyId, tally]) => {
      if (!tally || tally.count === 0) {
        return prices;
      }
      return { ...prices, [varietyId as VarietyId]: this.#roundToCents(tally.sum / tally.count) };
    }, {});
  }

  #accumulateRow(totals: PriceAccumulators, row: TabularRow): PriceAccumulators {
    const label = this.#readString(row, PRODUCT_LABEL_KEYS);
    const price = this.#readNumber(row, PRICE_KEYS);
    if (label === null || price === null) {
      return totals;
    }

    const varietyId = matchVarietyId(label);
    if (varietyId === null) {
      return totals;
    }

    if (this.#isBioRow(row, label)) {
      return { ...totals, bio: this.#addToBucket(totals.bio, varietyId, price) };
    }
    return { ...totals, conventional: this.#addToBucket(totals.conventional, varietyId, price) };
  }

  #addToBucket(bucket: PriceAccumulator, varietyId: VarietyId, price: number): PriceAccumulator {
    const current = bucket[varietyId] ?? { sum: 0, count: 0 };
    return { ...bucket, [varietyId]: { sum: current.sum + price, count: current.count + 1 } };
  }

  #isBioRow(row: TabularRow, label: string): boolean {
    const mode = this.#readString(row, PRODUCTION_MODE_KEYS);
    if (mode !== null && normalizeLabel(mode) === BIO_MODE_CODE) {
      return true;
    }
    const haystack = normalizeLabel(`${label} ${mode ?? ''}`);
    return BIO_KEYWORDS.some(keyword => haystack.includes(keyword));
  }

  #toResult(averaged: AveragedPrices, date: Date | null): LivePriceResult {
    const hasConventional = Object.keys(averaged.conventional).length > 0;
    const hasBio = Object.keys(averaged.bio).length > 0;
    if (!hasConventional && !hasBio) {
      return FALLBACK_RESULT;
    }
    return {
      source: hasConventional ? 'live' : 'reference',
      bioSource: hasBio ? 'live' : 'reference',
      prices: hasConventional ? averaged.conventional : null,
      bioPrices: hasBio ? averaged.bio : null,
      date,
    };
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
