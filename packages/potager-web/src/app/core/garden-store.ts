import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  CATEGORY_META,
  CROP_BY_ID,
  isCropId,
  type PlantDraft,
  type PlantEntry,
  type PlantRow,
} from './potager.model';
import { HarvestStore } from './harvest-store';
import { ExpenseStore } from './expense-store';

const STORAGE_KEY = 'potager.plants.v1';

const SEED_PLANTS: readonly PlantEntry[] = [
  { id: 'plant-1', cropId: 'tomate', quantity: 6 },
  { id: 'plant-2', cropId: 'courgette', quantity: 3 },
  { id: 'plant-3', cropId: 'salade', quantity: 12 },
  { id: 'plant-4', cropId: 'fraise', quantity: 20 },
  { id: 'plant-5', cropId: 'haricot-vert', quantity: 15 },
  { id: 'plant-6', cropId: 'pomme-de-terre', quantity: 10 },
];

@Injectable({ providedIn: 'root' })
export class GardenStore {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #harvests = inject(HarvestStore);
  readonly #expenses = inject(ExpenseStore);

  readonly #entries = signal<readonly PlantEntry[]>(this.#restore());

  readonly entries = this.#entries.asReadonly();

  readonly #expenseByPlantId = computed<Record<string, number>>(() => {
    const plantIds = this.#entries().map(entry => entry.id);
    const plantIdSet = new Set(plantIds);
    return this.#expenses.seasonRows().reduce<Record<string, number>>((accumulator, expense) => {
      const targets = expense.plantIds.length
        ? expense.plantIds.filter(id => plantIdSet.has(id))
        : plantIds;
      if (targets.length === 0) {
        return accumulator;
      }
      const share = expense.amountEur / targets.length;
      targets.forEach(id => {
        accumulator[id] = (accumulator[id] ?? 0) + share;
      });
      return accumulator;
    }, {});
  });

  readonly rows = computed<PlantRow[]>(() => {
    const harvestedByCrop = this.#harvests.weightByCropId();
    const valueByCrop = this.#harvests.seasonalValueByCropId();
    const expenseByPlant = this.#expenseByPlantId();
    return this.#entries()
      .map(entry =>
        this.#toRow(
          entry,
          harvestedByCrop[entry.cropId] ?? 0,
          valueByCrop[entry.cropId] ?? 0,
          expenseByPlant[entry.id] ?? 0,
        ),
      )
      .sort((a, b) => b.netSavingsEur - a.netSavingsEur);
  });

  readonly plantCount = computed(() =>
    this.#entries().reduce((total, entry) => total + entry.quantity, 0),
  );

  readonly cropCount = computed(() => new Set(this.#entries().map(entry => entry.cropId)).size);

  readonly averageYieldPerPlantKg = computed(() => {
    const plants = this.plantCount();
    if (plants === 0) {
      return 0;
    }
    const totalHarvested = this.rows().reduce((total, row) => total + row.harvestedKg, 0);
    return this.#roundToCents(totalHarvested / plants);
  });

  readonly totalNetSavingsEur = computed(() =>
    this.#roundToCents(this.rows().reduce((total, row) => total + row.netSavingsEur, 0)),
  );

  readonly bestNetSavingsCropLabel = computed(() => this.rows().at(0)?.cropLabel ?? '—');

  constructor() {
    effect(() => this.#persist(this.#entries()));
  }

  add(draft: PlantDraft): void {
    this.#entries.update(entries => {
      const existing = entries.find(entry => entry.cropId === draft.cropId);
      if (existing) {
        return entries.map(entry =>
          entry.cropId === draft.cropId
            ? { ...entry, quantity: entry.quantity + draft.quantity }
            : entry,
        );
      }
      return [...entries, { id: this.#createId(), cropId: draft.cropId, quantity: draft.quantity }];
    });
  }

  remove(id: string): void {
    this.#entries.update(entries => entries.filter(entry => entry.id !== id));
  }

  #toRow(
    entry: PlantEntry,
    harvestedKg: number,
    harvestValueEur: number,
    expenseEur: number,
  ): PlantRow {
    const crop = CROP_BY_ID[entry.cropId];
    const yieldPerPlantKg = entry.quantity > 0 ? harvestedKg / entry.quantity : 0;
    return {
      id: entry.id,
      cropId: entry.cropId,
      cropLabel: crop.label,
      cropIcon: crop.icon,
      categoryLabel: CATEGORY_META[crop.category].label,
      quantity: entry.quantity,
      harvestedKg: this.#roundToCents(harvestedKg),
      yieldPerPlantKg: this.#roundToCents(yieldPerPlantKg),
      harvestValueEur: this.#roundToCents(harvestValueEur),
      expenseEur: this.#roundToCents(expenseEur),
      netSavingsEur: this.#roundToCents(harvestValueEur - expenseEur),
    };
  }

  #restore(): readonly PlantEntry[] {
    if (!isPlatformBrowser(this.#platformId)) {
      return SEED_PLANTS;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEED_PLANTS;
    }
    return this.#parseStored(raw) ?? SEED_PLANTS;
  }

  #parseStored(raw: string): readonly PlantEntry[] | null {
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        return null;
      }
      return value.filter((item): item is PlantEntry => this.#isValidEntry(item));
    } catch {
      return null;
    }
  }

  #isValidEntry(item: unknown): item is PlantEntry {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate['id'] === 'string' &&
      typeof candidate['cropId'] === 'string' &&
      isCropId(candidate['cropId']) &&
      typeof candidate['quantity'] === 'number'
    );
  }

  #persist(entries: readonly PlantEntry[]): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  #createId(): string {
    return crypto.randomUUID();
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
