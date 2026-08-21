import { sceneNoiseRange, type SceneVector } from '@justin-croyable/design-system/components/scene';

import { type CropId, type PlantRow, type VarietyId } from '../../../core/potager.model';

import { PLANT_MODEL_BY_CROP } from './plant-models';
import {
  bedCenterX,
  bedCenterZ,
  cellKey,
  FIELD_COLUMNS,
  FIELD_ROWS,
  findCell,
  freeSlots,
  type GardenPlan,
  slotCenterX,
  slotCenterZ,
  SLOT_SIZE,
  slotKey,
} from './garden-plan.model';

export const BED_HEIGHT = 0.24;
export const BED_PLANK = 0.07;
export const FIELD_THICKNESS = 0.3;
export const FIELD_MARGIN = 1.6;

const FULL_TURN = Math.PI * 2;
const MIN_EXTENT = 5;
const HALF = 2;

export type PlantSpot = {
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly seed: number;
  readonly phase: number;
  readonly scale: number;
};

export type GardenCell = {
  readonly key: string;
  readonly bedId: string;
  readonly column: number;
  readonly row: number;
  readonly position: SceneVector;
  readonly cropId: CropId | null;
  readonly varietyId: VarietyId | null;
  readonly label: string;
  readonly plant: PlantSpot | null;
};

export type GardenBed = {
  readonly id: string;
  readonly position: SceneVector;
  readonly columns: number;
  readonly rows: number;
  readonly cells: readonly GardenCell[];
  readonly plantedCount: number;
};

export type GardenSlot = {
  readonly key: string;
  readonly column: number;
  readonly row: number;
  readonly position: SceneVector;
};

export type GardenField = {
  readonly beds: readonly GardenBed[];
  readonly slots: readonly GardenSlot[];
  readonly width: number;
  readonly depth: number;
  readonly extent: number;
};

export const FIELD_WIDTH = FIELD_COLUMNS * SLOT_SIZE + FIELD_MARGIN;
export const FIELD_DEPTH = FIELD_ROWS * SLOT_SIZE + FIELD_MARGIN;

const CELL_FILL_RATIO = 0.92;

function cellFitScale(cropId: CropId): number {
  const spread = PLANT_MODEL_BY_CROP[cropId].spread;
  return Math.min(1, (SLOT_SIZE * CELL_FILL_RATIO) / (spread * HALF));
}

function plantSpot(seed: number, cropId: CropId): PlantSpot {
  return {
    position: [
      sceneNoiseRange(seed, -0.07, 0.07),
      BED_HEIGHT,
      sceneNoiseRange(seed + 1.7, -0.07, 0.07),
    ],
    rotation: [0, sceneNoiseRange(seed + 2.9, 0, FULL_TURN), 0],
    seed,
    phase: sceneNoiseRange(seed + 5.1, 0, FULL_TURN),
    scale: cellFitScale(cropId),
  };
}

function cellLabel(varietyId: VarietyId | null, labels: ReadonlyMap<VarietyId, string>): string {
  return varietyId === null ? '' : labels.get(varietyId) ?? '';
}

export function buildGardenField(plan: GardenPlan, rows: readonly PlantRow[]): GardenField {
  const labels = new Map(
    rows
      .filter((row): row is PlantRow & { varietyId: VarietyId } => row.varietyId !== null)
      .map(row => [row.varietyId, row.label] as const),
  );
  const beds = plan.beds.map((bed, bedIndex): GardenBed => {
    const cells = Array.from({ length: bed.columns }, (_, column) =>
      Array.from({ length: bed.rows }, (_, row): GardenCell => {
        const assigned = findCell(plan.cells, bed.id, column, row);
        const seed = bedIndex * 31.7 + column * 7.31 + row * 3.11 + 1;
        return {
          key: cellKey(bed.id, column, row),
          bedId: bed.id,
          column,
          row,
          position: [
            (column - (bed.columns - 1) / HALF) * SLOT_SIZE,
            0,
            (row - (bed.rows - 1) / HALF) * SLOT_SIZE,
          ],
          cropId: assigned?.cropId ?? null,
          varietyId: assigned?.varietyId ?? null,
          label: cellLabel(assigned?.varietyId ?? null, labels),
          plant: assigned ? plantSpot(seed, assigned.cropId) : null,
        };
      }),
    ).flat();
    return {
      id: bed.id,
      position: [bedCenterX(bed), 0, bedCenterZ(bed)],
      columns: bed.columns,
      rows: bed.rows,
      cells,
      plantedCount: cells.filter(cell => cell.varietyId !== null).length,
    };
  });
  const slots = freeSlots(plan.beds).map(
    (slot): GardenSlot => ({
      key: slotKey(slot.column, slot.row),
      column: slot.column,
      row: slot.row,
      position: [slotCenterX(slot.column), 0, slotCenterZ(slot.row)],
    }),
  );
  return {
    beds,
    slots,
    width: FIELD_WIDTH,
    depth: FIELD_DEPTH,
    extent: Math.max(MIN_EXTENT, Math.max(FIELD_WIDTH, FIELD_DEPTH)),
  };
}
