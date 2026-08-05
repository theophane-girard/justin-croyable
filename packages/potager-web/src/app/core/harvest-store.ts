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
  matchesSeason,
  matchesYear,
  PRICE_MODE,
  type PriceMode,
  type PriceSource,
  seasonForDate,
  YEAR_ALL,
  type YearFilter,
} from './potager.model';
import { GovPriceService } from './gov-price.service';
import { SeasonStore } from './season-store';
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
  { id: 'seed-11', cropId: 'tomate', weightKg: 5.2, harvestedOn: '2025-07-18' },
  { id: 'seed-12', cropId: 'fraise', weightKg: 1.9, harvestedOn: '2025-05-24' },
  { id: 'seed-13', cropId: 'courgette', weightKg: 6.8, harvestedOn: '2025-08-09' },
  { id: 'seed-14', cropId: 'poireau', weightKg: 3.1, harvestedOn: '2025-11-12' },
  { id: 'seed-15', cropId: 'salade', weightKg: 2.6, harvestedOn: '2025-06-15' },
  { id: 'seed-16', cropId: 'haricot-vert', weightKg: 3.4, harvestedOn: '2025-07-28' },
  { id: 'seed-17', cropId: 'pomme-de-terre', weightKg: 9.7, harvestedOn: '2025-08-20' },
  { id: 'seed-18', cropId: 'radis', weightKg: 1.3, harvestedOn: '2025-04-22' },
  { id: 'seed-19', cropId: 'courge', weightKg: 4.9, harvestedOn: '2025-09-18' },
  { id: 'seed-20', cropId: 'tomate', weightKg: 3.8, harvestedOn: '2025-08-05' },
  { id: 'seed-21', cropId: 'framboise', weightKg: 0.9, harvestedOn: '2025-06-30' },
  { id: 'seed-22', cropId: 'carotte', weightKg: 4.2, harvestedOn: '2025-10-08' },
];

@Injectable({ providedIn: 'root' })
export class HarvestStore {
  readonly #govPrices = inject(GovPriceService);
  readonly #seasonStore = inject(SeasonStore);
  readonly #season = this.#seasonStore.season;
  readonly #platformId = inject(PLATFORM_ID);

  readonly #entries = signal<readonly HarvestEntry[]>(this.#restore());

  readonly #priceMode = signal<PriceMode>(PRICE_MODE.conventional);
  readonly priceMode = this.#priceMode.asReadonly();

  readonly entries = this.#entries.asReadonly();

  readonly priceSource = computed<PriceSource>(() =>
    this.#priceMode() === PRICE_MODE.bio ? 'reference' : this.#govPrices.priceSource(),
  );

  readonly #conventionalPrices = computed<Record<CropId, number>>(() =>
    mergePrices(this.#govPrices.livePrices()),
  );

  readonly rows = computed<HarvestRow[]>(() => {
    const conventional = this.#conventionalPrices();
    const mode = this.#priceMode();
    return this.#entries()
      .map(entry => this.#toRow(entry, conventional, mode))
      .sort((a, b) => b.harvestedOn.getTime() - a.harvestedOn.getTime());
  });

  readonly availableYears = computed<number[]>(() =>
    Array.from(
      new Set(this.#entries().map(entry => new Date(entry.harvestedOn).getFullYear())),
    ).sort((a, b) => b - a),
  );

  readonly effectiveYear = computed<YearFilter>(() => {
    const selection = this.#seasonStore.yearSelection();
    if (selection === YEAR_ALL) {
      return YEAR_ALL;
    }
    const years = this.availableYears();
    if (typeof selection === 'number' && years.includes(selection)) {
      return selection;
    }
    return years[0] ?? new Date().getFullYear();
  });

  readonly #periodRows = computed<HarvestRow[]>(() => {
    const season = this.#season();
    const year = this.effectiveYear();
    return this.rows().filter(
      row => matchesSeason(row.season, season) && matchesYear(row.harvestedOn.getFullYear(), year),
    );
  });

  readonly entryCount = computed(() => this.#entries().length);

  readonly totalWeightKg = computed(() =>
    this.#roundToCents(this.#periodRows().reduce((total, row) => total + row.weightKg, 0)),
  );

  readonly totalSavingsEur = computed(() =>
    this.#roundToCents(this.#periodRows().reduce((total, row) => total + row.savingsEur, 0)),
  );

  readonly cropCount = computed(() => new Set(this.#entries().map(entry => entry.cropId)).size);

  readonly periodWeightByCropId = computed<Partial<Record<CropId, number>>>(() =>
    this.#periodRows().reduce<Partial<Record<CropId, number>>>((accumulator, row) => {
      accumulator[row.cropId] = this.#roundToCents((accumulator[row.cropId] ?? 0) + row.weightKg);
      return accumulator;
    }, {}),
  );

  readonly periodValueByCropId = computed<Partial<Record<CropId, number>>>(() =>
    this.#periodRows().reduce<Partial<Record<CropId, number>>>((accumulator, row) => {
      accumulator[row.cropId] = this.#roundToCents((accumulator[row.cropId] ?? 0) + row.savingsEur);
      return accumulator;
    }, {}),
  );

  readonly monthlyWeights = computed(() =>
    this.#bucketByMonth(this.#periodRows(), row => row.weightKg),
  );

  readonly monthlySavings = computed(() =>
    this.#bucketByMonth(this.#periodRows(), row => row.savingsEur),
  );

  readonly savingsByCrop = computed<NamedValue[]>(() =>
    this.#groupBy(this.#periodRows(), row => row.cropLabel, row => row.savingsEur).sort(
      (a, b) => b.value - a.value,
    ),
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

  #toRow(entry: HarvestEntry, conventional: Record<CropId, number>, mode: PriceMode): HarvestRow {
    const crop = CROP_BY_ID[entry.cropId];
    const conventionalPricePerKg = conventional[entry.cropId];
    const bioPricePerKg = REFERENCE_BIO_PRICES[entry.cropId];
    const pricePerKg = mode === PRICE_MODE.bio ? bioPricePerKg : conventionalPricePerKg;
    const harvestedOn = new Date(entry.harvestedOn);
    return {
      id: entry.id,
      cropId: entry.cropId,
      cropLabel: crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      harvestedOn,
      season: seasonForDate(harvestedOn),
      weightKg: entry.weightKg,
      conventionalPricePerKg,
      bioPricePerKg,
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
