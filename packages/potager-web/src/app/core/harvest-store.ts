import { computed, inject, Injectable, signal } from '@angular/core';
import { type Harvest } from '@justin-croyable/api-contract';

import {
  CROP_BY_ID,
  CATEGORY_META,
  type CropId,
  cropUnit,
  formatQuantityByUnit,
  type HarvestDraft,
  type HarvestRow,
  HARVEST_UNIT,
  type HarvestUnit,
  matchesSeason,
  matchesYear,
  PRICE_MODE,
  type PriceMode,
  seasonForDate,
  type Variety,
  type VarietyId,
  YEAR_ALL,
  type YearFilter,
} from './potager.model';
import { ApiEntityStore } from './api-entity-store';
import { CatalogStore } from './catalog-store';
import { PriceStore } from './price-store';
import { SeasonStore } from './season-store';

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

const MONTHS_IN_YEAR = 12;

type NamedValue = { readonly label: string; readonly value: number };

@Injectable({ providedIn: 'root' })
export class HarvestStore extends ApiEntityStore<Harvest> {
  readonly #prices = inject(PriceStore);
  readonly #catalog = inject(CatalogStore);
  readonly #seasonStore = inject(SeasonStore);
  readonly #season = this.#seasonStore.season;

  readonly #priceMode = signal<PriceMode>(PRICE_MODE.conventional);
  readonly priceMode = this.#priceMode.asReadonly();

  readonly rows = computed<HarvestRow[]>(() => {
    const mode = this.#priceMode();
    const byId = this.#catalog.byId();
    return this.entries()
      .map(entry => {
        const variety = byId.get(entry.varietyId);
        return variety ? this.#toRow(entry, variety, mode) : null;
      })
      .filter((row): row is HarvestRow => row !== null)
      .sort((a, b) => b.harvestedOn.getTime() - a.harvestedOn.getTime());
  });

  readonly availableYears = computed<number[]>(() =>
    Array.from(
      new Set(this.entries().map(entry => new Date(entry.harvestedOn).getFullYear())),
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

  readonly entryCount = computed(() => this.entries().length);

  readonly harvestQuantityByUnit = computed<Record<HarvestUnit, number>>(() =>
    this.#periodRows().reduce<Record<HarvestUnit, number>>(
      (accumulator, row) => {
        const unit = cropUnit(row.cropId);
        accumulator[unit] = this.#roundToCents(accumulator[unit] + row.weightKg);
        return accumulator;
      },
      { [HARVEST_UNIT.kilogram]: 0, [HARVEST_UNIT.piece]: 0 },
    ),
  );

  readonly totalHarvestLabel = computed(() =>
    formatQuantityByUnit(this.harvestQuantityByUnit()),
  );

  readonly totalSavingsEur = computed(() =>
    this.#roundToCents(this.#periodRows().reduce((total, row) => total + row.savingsEur, 0)),
  );

  readonly cropCount = computed(() => {
    const byId = this.#catalog.byId();
    return new Set(
      this.entries()
        .map(entry => byId.get(entry.varietyId)?.cropId)
        .filter((cropId): cropId is CropId => cropId !== undefined),
    ).size;
  });

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

  readonly periodWeightByVarietyId = computed<Partial<Record<VarietyId, number>>>(() =>
    this.#periodRows().reduce<Partial<Record<VarietyId, number>>>((accumulator, row) => {
      accumulator[row.varietyId] = this.#roundToCents(
        (accumulator[row.varietyId] ?? 0) + row.weightKg,
      );
      return accumulator;
    }, {}),
  );

  readonly periodValueByVarietyId = computed<Partial<Record<VarietyId, number>>>(() =>
    this.#periodRows().reduce<Partial<Record<VarietyId, number>>>((accumulator, row) => {
      accumulator[row.varietyId] = this.#roundToCents(
        (accumulator[row.varietyId] ?? 0) + row.savingsEur,
      );
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

  readonly savingsByVariety = computed<NamedValue[]>(() =>
    this.#groupBy(this.#periodRows(), row => row.varietyLabel, row => row.savingsEur).sort(
      (a, b) => b.value - a.value,
    ),
  );

  add(draft: HarvestDraft): void {
    void this.createEntry(() =>
      this.api.createHarvest({
        varietyId: draft.varietyId,
        weightKg: draft.weightKg,
        harvestedOn: draft.harvestedOn.toISOString(),
      }),
    );
  }

  remove(id: string): void {
    void this.removeEntry(id, () => this.api.removeHarvest(id));
  }

  setPriceMode(mode: PriceMode): void {
    this.#priceMode.set(mode);
  }

  protected fetchAll() {
    return this.api.listHarvests();
  }

  #toRow(entry: Harvest, variety: Variety, mode: PriceMode): HarvestRow {
    const varietyId = variety.id;
    const crop = CROP_BY_ID[variety.cropId];
    const harvestedOn = new Date(entry.harvestedOn);
    const conventionalPricePerKg = this.#prices.conventionalPriceFor(varietyId, harvestedOn);
    const bioPricePerKg = this.#prices.bioPriceFor(varietyId, harvestedOn);
    const pricePerKg = mode === PRICE_MODE.bio ? bioPricePerKg : conventionalPricePerKg;
    return {
      id: entry.id,
      varietyId,
      varietyLabel: variety.label,
      cropId: variety.cropId,
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

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
