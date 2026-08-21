import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  type BedSize,
  cellKey,
  EMPTY_GARDEN_PLAN,
  findCell,
  type GardenPlan,
  type PlannedBed,
  type PlannedCell,
  canPlaceBed,
} from './scene/garden-plan.model';

import { CatalogStore } from '../../core/catalog-store';
import { GardenAccessStore } from '../../core/garden-access-store';
import { GardenStore } from '../../core/garden-store';
import { type VarietyId } from '../../core/potager.model';

const STORAGE_KEY = 'potager.garden-plan';
const FALLBACK_GARDEN_KEY = 'personal';
const BED_ID_PREFIX = 'bed';
const ID_SEPARATOR = '-';

type StoredPlans = Record<string, GardenPlan>;

function isPlannedBed(value: unknown): value is PlannedBed {
  const bed = value as Partial<PlannedBed> | null;
  return (
    typeof bed?.id === 'string' &&
    typeof bed.column === 'number' &&
    typeof bed.row === 'number' &&
    typeof bed.columns === 'number' &&
    typeof bed.rows === 'number'
  );
}

function isPlannedCell(value: unknown): value is PlannedCell {
  const cell = value as Partial<PlannedCell> | null;
  return (
    typeof cell?.bedId === 'string' &&
    typeof cell.column === 'number' &&
    typeof cell.row === 'number' &&
    typeof cell.cropId === 'string' &&
    typeof cell.varietyId === 'string'
  );
}

function toPlan(value: unknown): GardenPlan {
  const plan = value as Partial<GardenPlan> | null;
  return {
    beds: Array.isArray(plan?.beds) ? plan.beds.filter(isPlannedBed) : [],
    cells: Array.isArray(plan?.cells) ? plan.cells.filter(isPlannedCell) : [],
  };
}

function parseStored(raw: string | null): StoredPlans {
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return Object.entries(parsed).reduce<StoredPlans>(
      (plans, [gardenId, plan]) => ({ ...plans, [gardenId]: toPlan(plan) }),
      {},
    );
  } catch {
    return {};
  }
}

/**
 * Disposition des bacs du potager : où ils sont posés sur le champ, et quelle
 * variété occupe chaque case.
 *
 * Stockée dans le navigateur pour cette première version — la disposition n'est
 * donc ni partagée entre appareils ni entre co-propriétaires du jardin. Toute la
 * persistance est isolée derrière ce store : la basculer sur l'API se limitera à
 * remplacer la lecture et l'écriture de `localStorage`.
 *
 * Les `plants` restent la source de vérité économique : poser une variété dans
 * une case incrémente la quantité du plant correspondant, la vider la décrémente.
 */
@Injectable({ providedIn: 'root' })
export class GardenPlanStore {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #access = inject(GardenAccessStore);
  readonly #catalog = inject(CatalogStore);
  readonly #garden = inject(GardenStore);

  readonly #stored = signal<StoredPlans>(this.#read());

  readonly #gardenKey = computed(() => this.#access.activeId() ?? FALLBACK_GARDEN_KEY);

  readonly plan = computed<GardenPlan>(
    () => this.#stored()[this.#gardenKey()] ?? EMPTY_GARDEN_PLAN,
  );

  readonly beds = computed(() => this.plan().beds);
  readonly cells = computed(() => this.plan().cells);

  addBed(column: number, row: number, size: BedSize): void {
    const plan = this.plan();
    if (!canPlaceBed(plan.beds, column, row, size)) {
      return;
    }
    const bed: PlannedBed = {
      id: `${BED_ID_PREFIX}${ID_SEPARATOR}${column}${ID_SEPARATOR}${row}${ID_SEPARATOR}${plan.beds.length}`,
      column,
      row,
      columns: size.columns,
      rows: size.rows,
    };
    this.#write({ beds: [...plan.beds, bed], cells: plan.cells });
  }

  removeBed(bedId: string): void {
    const plan = this.plan();
    plan.cells
      .filter(cell => cell.bedId === bedId)
      .forEach(cell => this.#garden.decrementVariety(cell.varietyId));
    this.#write({
      beds: plan.beds.filter(bed => bed.id !== bedId),
      cells: plan.cells.filter(cell => cell.bedId !== bedId),
    });
  }

  assignCell(bedId: string, column: number, row: number, varietyId: VarietyId): void {
    const variety = this.#catalog.byId().get(varietyId);
    if (!variety) {
      return;
    }
    const plan = this.plan();
    const previous = findCell(plan.cells, bedId, column, row);
    if (previous?.varietyId === varietyId) {
      return;
    }
    if (previous) {
      this.#garden.decrementVariety(previous.varietyId);
    }
    this.#garden.add({ cropId: variety.cropId, varietyId, quantity: 1 });
    const assigned: PlannedCell = { bedId, column, row, cropId: variety.cropId, varietyId };
    this.#write({
      beds: plan.beds,
      cells: [...this.#withoutCell(plan.cells, bedId, column, row), assigned],
    });
  }

  clearCell(bedId: string, column: number, row: number): void {
    const plan = this.plan();
    const previous = findCell(plan.cells, bedId, column, row);
    if (!previous) {
      return;
    }
    this.#garden.decrementVariety(previous.varietyId);
    this.#write({ beds: plan.beds, cells: this.#withoutCell(plan.cells, bedId, column, row) });
  }

  #withoutCell(
    cells: readonly PlannedCell[],
    bedId: string,
    column: number,
    row: number,
  ): PlannedCell[] {
    const removed = cellKey(bedId, column, row);
    return cells.filter(cell => cellKey(cell.bedId, cell.column, cell.row) !== removed);
  }

  #write(plan: GardenPlan): void {
    const stored: StoredPlans = { ...this.#stored(), [this.#gardenKey()]: plan };
    this.#stored.set(stored);
    if (!this.#isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      return;
    }
  }

  #read(): StoredPlans {
    if (!this.#isBrowser) {
      return {};
    }
    try {
      return parseStored(localStorage.getItem(STORAGE_KEY));
    } catch {
      return {};
    }
  }
}
