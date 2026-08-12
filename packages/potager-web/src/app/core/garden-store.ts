import { computed, inject, Injectable } from '@angular/core';
import { type Plant } from '@justin-croyable/api-contract';

import {
  CATEGORY_META,
  CROP_BY_ID,
  type CropId,
  isCropId,
  isVarietyId,
  type PlantDraft,
  type PlantRow,
  VARIETY_BY_ID,
  type VarietyId,
} from './potager.model';
import { ApiEntityStore } from './api-entity-store';
import { HarvestStore } from './harvest-store';
import { ExpenseStore } from './expense-store';

@Injectable({ providedIn: 'root' })
export class GardenStore extends ApiEntityStore<Plant> {
  readonly #harvests = inject(HarvestStore);
  readonly #expenses = inject(ExpenseStore);

  readonly #expenseByPlantId = computed<Record<string, number>>(() => {
    const plantIds = this.entries().map(entry => entry.id);
    const plantIdSet = new Set(plantIds);
    return this.#expenses.periodRows().reduce<Record<string, number>>((accumulator, expense) => {
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
    const harvestedByCrop = this.#harvests.periodWeightByCropId();
    const valueByCrop = this.#harvests.periodValueByCropId();
    const harvestedByVariety = this.#harvests.periodWeightByVarietyId();
    const valueByVariety = this.#harvests.periodValueByVarietyId();
    const expenseByPlant = this.#expenseByPlantId();
    return this.entries()
      .filter(entry => isCropId(entry.cropId))
      .map(entry => {
        const varietyId =
          entry.varietyId !== null && isVarietyId(entry.varietyId) ? entry.varietyId : null;
        const harvestedKg = varietyId
          ? harvestedByVariety[varietyId] ?? 0
          : harvestedByCrop[entry.cropId as CropId] ?? 0;
        const harvestValueEur = varietyId
          ? valueByVariety[varietyId] ?? 0
          : valueByCrop[entry.cropId as CropId] ?? 0;
        return this.#toRow(
          entry,
          varietyId,
          harvestedKg,
          harvestValueEur,
          expenseByPlant[entry.id] ?? 0,
        );
      })
      .sort((a, b) => b.netSavingsEur - a.netSavingsEur);
  });

  readonly plantCount = computed(() =>
    this.entries().reduce((total, entry) => total + entry.quantity, 0),
  );

  readonly cropCount = computed(() => new Set(this.entries().map(entry => entry.cropId)).size);

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

  add(draft: PlantDraft): void {
    const existing = this.entries().find(entry => entry.varietyId === draft.varietyId);
    if (existing) {
      void this.updateEntry(existing.id, () =>
        this.api.updatePlant(existing.id, { quantity: existing.quantity + draft.quantity }),
      );
      return;
    }
    void this.createEntry(() =>
      this.api.createPlant({
        cropId: draft.cropId,
        varietyId: draft.varietyId,
        quantity: draft.quantity,
      }),
    );
  }

  remove(id: string): void {
    void this.removeEntry(id, () => this.api.removePlant(id));
  }

  protected fetchAll() {
    return this.api.listPlants();
  }

  #toRow(
    entry: Plant,
    varietyId: VarietyId | null,
    harvestedKg: number,
    harvestValueEur: number,
    expenseEur: number,
  ): PlantRow {
    const cropId = entry.cropId as CropId;
    const crop = CROP_BY_ID[cropId];
    const yieldPerPlantKg = entry.quantity > 0 ? harvestedKg / entry.quantity : 0;
    return {
      id: entry.id,
      cropId,
      cropLabel: crop.label,
      cropIcon: crop.icon,
      varietyId,
      label: varietyId ? VARIETY_BY_ID[varietyId].label : crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      quantity: entry.quantity,
      harvestedKg: this.#roundToCents(harvestedKg),
      yieldPerPlantKg: this.#roundToCents(yieldPerPlantKg),
      harvestValueEur: this.#roundToCents(harvestValueEur),
      expenseEur: this.#roundToCents(expenseEur),
      netSavingsEur: this.#roundToCents(harvestValueEur - expenseEur),
    };
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
