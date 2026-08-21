import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { type CropId, type VarietyId } from '../../../core/potager.model';

import { VARIETY_BY_ID } from './garden-catalog';
import {
  type CellCoordinate,
  EMPTY_GARDEN_PLAN,
  findPlanting,
  type GardenPlan,
  type Parcel,
  PARCEL_KIND,
  type ParcelKind,
  type ParcelPlacement,
  parcelFootprint,
  type Planting,
  type SowMode,
  sowTargets,
} from './parcel.model';

const STORAGE_KEY = 'potager.garden-layout';
const PARCEL_ID_PREFIX = 'parcelle';
const ID_SEPARATOR = '-';

function isParcel(value: unknown): value is Parcel {
  const parcel = value as Partial<Parcel> | null;
  return (
    typeof parcel?.id === 'string' &&
    typeof parcel.name === 'string' &&
    typeof parcel.lengthCm === 'number' &&
    typeof parcel.widthCm === 'number' &&
    typeof parcel.cellLengthCm === 'number' &&
    typeof parcel.cellWidthCm === 'number' &&
    (parcel.kind === PARCEL_KIND.ground || parcel.kind === PARCEL_KIND.raised)
  );
}

function isPlacement(value: unknown): value is ParcelPlacement {
  const placement = value as Partial<ParcelPlacement> | null;
  return (
    typeof placement?.parcelId === 'string' &&
    typeof placement.xCm === 'number' &&
    typeof placement.zCm === 'number' &&
    typeof placement.rotated === 'boolean'
  );
}

function isPlanting(value: unknown): value is Planting {
  const planting = value as Partial<Planting> | null;
  return (
    typeof planting?.parcelId === 'string' &&
    typeof planting.column === 'number' &&
    typeof planting.row === 'number' &&
    typeof planting.cropId === 'string' &&
    typeof planting.varietyId === 'string' &&
    typeof planting.harvestedKg === 'number'
  );
}

function toPlan(value: unknown): GardenPlan {
  const plan = value as Partial<GardenPlan> | null;
  return {
    parcels: Array.isArray(plan?.parcels) ? plan.parcels.filter(isParcel) : [],
    placements: Array.isArray(plan?.placements) ? plan.placements.filter(isPlacement) : [],
    plantings: Array.isArray(plan?.plantings) ? plan.plantings.filter(isPlanting) : [],
  };
}

function parseStored(raw: string | null): GardenPlan {
  if (raw === null) {
    return EMPTY_GARDEN_PLAN;
  }
  try {
    return toPlan(JSON.parse(raw));
  } catch {
    return EMPTY_GARDEN_PLAN;
  }
}

/**
 * Plan du potager : les parcelles définies, leur position sur le terrain et ce
 * qui pousse dans chaque case.
 *
 * Tout est simulé dans le navigateur pour cette maquette — aucun appel réseau,
 * aucune migration. Le plan n'est donc ni partagé entre appareils ni entre
 * co-propriétaires du jardin.
 */
@Injectable({ providedIn: 'root' })
export class GardenPlanStore {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #plan = signal<GardenPlan>(this.#read());

  readonly plan = this.#plan.asReadonly();
  readonly parcels = computed(() => this.#plan().parcels);
  readonly placements = computed(() => this.#plan().placements);
  readonly plantings = computed(() => this.#plan().plantings);
  readonly isConfigured = computed(() => this.#plan().parcels.length > 0);
  readonly plantedCount = computed(() => this.#plan().plantings.length);

  readonly cellCount = computed(() =>
    this.#plan().placements.reduce((total, placement) => {
      const parcel = this.#parcel(placement.parcelId);
      if (!parcel) {
        return total;
      }
      const footprint = parcelFootprint(parcel, placement.rotated);
      return total + footprint.columns * footprint.rows;
    }, 0),
  );

  saveLayout(parcels: readonly Parcel[], placements: readonly ParcelPlacement[]): void {
    const keptIds = new Set(parcels.map(parcel => parcel.id));
    this.#update(plan => ({
      parcels: [...parcels],
      placements: placements.filter(placement => keptIds.has(placement.parcelId)),
      plantings: plan.plantings.filter(planting => keptIds.has(planting.parcelId)),
    }));
  }

  sow(parcelId: string, origin: CellCoordinate, mode: SowMode, varietyId: VarietyId): void {
    const variety = VARIETY_BY_ID.get(varietyId);
    const placement = this.#placement(parcelId);
    const parcel = this.#parcel(parcelId);
    if (!variety || !placement || !parcel) {
      return;
    }
    const footprint = parcelFootprint(parcel, placement.rotated);
    const targets = sowTargets(footprint, mode, origin);
    const targetKeys = new Set(targets.map(target => cellKey(target)));
    this.#update(plan => ({
      ...plan,
      plantings: [
        ...plan.plantings.filter(
          planting =>
            planting.parcelId !== parcelId ||
            !targetKeys.has(cellKey({ column: planting.column, row: planting.row })),
        ),
        ...targets.map(
          (target): Planting => ({
            parcelId,
            column: target.column,
            row: target.row,
            cropId: variety.cropId,
            varietyId,
            harvestedKg: 0,
          }),
        ),
      ],
    }));
  }

  harvest(parcelId: string, cell: CellCoordinate, quantity: number): void {
    this.#update(plan => ({
      ...plan,
      plantings: plan.plantings.map(planting =>
        this.#matches(planting, parcelId, cell)
          ? { ...planting, harvestedKg: planting.harvestedKg + quantity }
          : planting,
      ),
    }));
  }

  replaceVariety(parcelId: string, cell: CellCoordinate, varietyId: VarietyId): void {
    const variety = VARIETY_BY_ID.get(varietyId);
    if (!variety) {
      return;
    }
    this.#update(plan => ({
      ...plan,
      plantings: plan.plantings.map(planting =>
        this.#matches(planting, parcelId, cell)
          ? {
              ...planting,
              varietyId,
              cropId: variety.cropId as CropId,
              harvestedKg: 0,
            }
          : planting,
      ),
    }));
  }

  uproot(parcelId: string, cell: CellCoordinate): void {
    this.#update(plan => ({
      ...plan,
      plantings: plan.plantings.filter(planting => !this.#matches(planting, parcelId, cell)),
    }));
  }

  reset(): void {
    this.#update(() => EMPTY_GARDEN_PLAN);
  }

  plantingAt(parcelId: string, cell: CellCoordinate): Planting | undefined {
    return findPlanting(this.#plan().plantings, parcelId, cell.column, cell.row);
  }

  parcelKindOf(parcelId: string): ParcelKind | null {
    return this.#parcel(parcelId)?.kind ?? null;
  }

  #matches(planting: Planting, parcelId: string, cell: CellCoordinate): boolean {
    return (
      planting.parcelId === parcelId && planting.column === cell.column && planting.row === cell.row
    );
  }

  #parcel(parcelId: string): Parcel | undefined {
    return this.#plan().parcels.find(parcel => parcel.id === parcelId);
  }

  #placement(parcelId: string): ParcelPlacement | undefined {
    return this.#plan().placements.find(placement => placement.parcelId === parcelId);
  }

  #update(project: (plan: GardenPlan) => GardenPlan): void {
    const next = project(this.#plan());
    this.#plan.set(next);
    this.#write(next);
  }

  #read(): GardenPlan {
    if (!this.#isBrowser) {
      return EMPTY_GARDEN_PLAN;
    }
    return parseStored(localStorage.getItem(STORAGE_KEY));
  }

  #write(plan: GardenPlan): void {
    if (!this.#isBrowser) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }
}

function cellKey(cell: CellCoordinate): string {
  return `${cell.column}${ID_SEPARATOR}${cell.row}`;
}

export function nextParcelId(existing: readonly Parcel[]): string {
  const taken = new Set(existing.map(parcel => parcel.id));
  const index = Array.from({ length: existing.length + 1 }, (_, position) => position + 1).find(
    position => !taken.has(`${PARCEL_ID_PREFIX}${ID_SEPARATOR}${position}`),
  );
  return `${PARCEL_ID_PREFIX}${ID_SEPARATOR}${index ?? existing.length + 1}`;
}
