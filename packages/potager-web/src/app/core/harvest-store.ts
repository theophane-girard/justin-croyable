import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  CROP_BY_ID,
  CATEGORY_META,
  type CropId,
  type HarvestDraft,
  type HarvestEntry,
  type HarvestRow,
  isCropId,
  PRICE_MODE,
  type PriceMode,
  type PriceSource,
} from './potager.model';
import { GovPriceService } from './gov-price.service';
import { mergePrices, REFERENCE_BIO_PRICES } from './reference-prices';

export const MONTHS_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const;

const STORAGE_KEY = 'potager.harvests.v1';
const MONTHS_IN_YEAR = 12;

type NamedValue = { readonly label: string; readonly value: number };

const SEED_ENTRIES: readonly HarvestEntry[] = [
  { id: 'seed-1', cropId: 'fraise', weightKg: 2.4, harvestedOn: '2026-05-18' },
  { id: 'seed-2', cropId: 'tomate', weightKg: 6.1, harvestedOn: '2026-07-22' },
  { id: 'seed-3', cropId: 'courgette', weightKg: 8.3, harvestedOn: '2026-07-05' },
  { id: 'seed-4', cropId: 'salade', weightKg: 3.2, harvestedOn: '2026-06-12' },
  { id: 'seed-5', cropId: 'haricot-vert', weightKg: 2.9, harvestedOn: '2026-08-01' },
  { id: 'seed-6', cropId: 'framboise', weightKg: 1.1, harvestedOn: '2026-06-28' },
  { id: 'seed-7', cropId: 'pomme-de-terre', weightKg: 11.5, harvestedOn: '2026-08-03' },
  { id: 'seed-8', cropId: 'radis', weightKg: 1.6, harvestedOn: '2026-04-20' },
  { id: 'seed-9', cropId: 'tomate', weightKg: 4.7, harvestedOn: '2026-08-02' },
  { id: 'seed-10', cropId: 'courge', weightKg: 5.4, harvestedOn: '2026-09-15' },
];

@Injectable({ providedIn: 'root' })
export class HarvestStore {
  readonly #govPrices = inject(GovPriceService);
  readonly #platformId = inject(PLATFORM_ID);

  readonly #entries = signal<readonly HarvestEntry[]>(this.#restore());

  readonly #priceMode = signal<PriceMode>(PRICE_MODE.conventional);
  readonly priceMode = this.#priceMode.asReadonly();

  readonly entries = this.#entries.asReadonly();

  readonly priceSource = computed<PriceSource>(() =>
    this.#priceMode() === PRICE_MODE.bio ? 'reference' : this.#govPrices.priceSource(),
  );

  readonly #effectivePrices = computed<Record<CropId, number>>(() =>
    this.#priceMode() === PRICE_MODE.bio
      ? { ...REFERENCE_BIO_PRICES }
      : mergePrices(this.#govPrices.livePrices()),
  );

  readonly rows = computed<HarvestRow[]>(() => {
    const prices = this.#effectivePrices();
    return this.#entries()
      .map(entry => this.#toRow(entry, prices))
      .sort((a, b) => b.harvestedOn.getTime() - a.harvestedOn.getTime());
  });

  readonly entryCount = computed(() => this.#entries().length);

  readonly totalWeightKg = computed(() =>
    this.#roundToCents(this.#entries().reduce((total, entry) => total + entry.weightKg, 0)),
  );

  readonly totalSavingsEur = computed(() =>
    this.#roundToCents(this.rows().reduce((total, row) => total + row.savingsEur, 0)),
  );

  readonly cropCount = computed(() => new Set(this.#entries().map(entry => entry.cropId)).size);

  readonly monthlyWeights = computed(() =>
    this.#bucketByMonth(this.rows(), row => row.weightKg),
  );

  readonly monthlySavings = computed(() =>
    this.#bucketByMonth(this.rows(), row => row.savingsEur),
  );

  readonly savingsByCrop = computed<NamedValue[]>(() =>
    this.#groupBy(this.rows(), row => row.cropLabel, row => row.savingsEur).sort(
      (a, b) => b.value - a.value,
    ),
  );

  readonly weightByCategory = computed<NamedValue[]>(() =>
    this.#groupBy(this.rows(), row => row.categoryLabel, row => row.weightKg),
  );

  constructor() {
    effect(() => this.#persist(this.#entries()));
  }

  add(draft: HarvestDraft): void {
    const entry: HarvestEntry = {
      id: this.#createId(),
      cropId: draft.cropId,
      weightKg: draft.weightKg,
      harvestedOn: this.#toIsoDate(draft.harvestedOn),
    };
    this.#entries.update(entries => [...entries, entry]);
  }

  remove(id: string): void {
    this.#entries.update(entries => entries.filter(entry => entry.id !== id));
  }

  setPriceMode(mode: PriceMode): void {
    this.#priceMode.set(mode);
  }

  #toRow(entry: HarvestEntry, prices: Record<CropId, number>): HarvestRow {
    const crop = CROP_BY_ID[entry.cropId];
    const pricePerKg = prices[entry.cropId];
    return {
      id: entry.id,
      cropLabel: crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      harvestedOn: new Date(entry.harvestedOn),
      weightKg: entry.weightKg,
      pricePerKg,
      savingsEur: this.#roundToCents(entry.weightKg * pricePerKg),
    };
  }

  #bucketByMonth(rows: readonly HarvestRow[], pick: (row: HarvestRow) => number): number[] {
    const totals = rows.reduce<Map<number, number>>((accumulator, row) => {
      const month = row.harvestedOn.getMonth();
      accumulator.set(month, (accumulator.get(month) ?? 0) + pick(row));
      return accumulator;
    }, new Map());

    return Array.from({ length: MONTHS_IN_YEAR }, (_, month) =>
      this.#roundToCents(totals.get(month) ?? 0),
    );
  }

  #groupBy(
    rows: readonly HarvestRow[],
    key: (row: HarvestRow) => string,
    pick: (row: HarvestRow) => number,
  ): NamedValue[] {
    const totals = rows.reduce<Map<string, number>>((accumulator, row) => {
      const label = key(row);
      accumulator.set(label, (accumulator.get(label) ?? 0) + pick(row));
      return accumulator;
    }, new Map());

    return Array.from(totals.entries()).map(([label, value]) => ({
      label,
      value: this.#roundToCents(value),
    }));
  }

  #restore(): readonly HarvestEntry[] {
    if (!isPlatformBrowser(this.#platformId)) {
      return SEED_ENTRIES;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEED_ENTRIES;
    }
    const parsed = this.#parseStored(raw);
    return parsed ?? SEED_ENTRIES;
  }

  #parseStored(raw: string): readonly HarvestEntry[] | null {
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        return null;
      }
      return value.filter((item): item is HarvestEntry => this.#isValidEntry(item));
    } catch {
      return null;
    }
  }

  #isValidEntry(item: unknown): item is HarvestEntry {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate['id'] === 'string' &&
      typeof candidate['cropId'] === 'string' &&
      isCropId(candidate['cropId']) &&
      typeof candidate['weightKg'] === 'number' &&
      typeof candidate['harvestedOn'] === 'string'
    );
  }

  #persist(entries: readonly HarvestEntry[]): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  #createId(): string {
    return crypto.randomUUID();
  }

  #toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
