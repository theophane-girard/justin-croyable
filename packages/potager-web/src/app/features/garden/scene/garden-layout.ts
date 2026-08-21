import { type CropId, type PlantRow } from '../../../core/potager.model';

import { PLANT_MODEL_BY_CROP } from './plant-models';
import { hashRange, type SceneVector } from './scene-part';

export const BED_WIDTH = 1.6;
export const BED_DEPTH = 1.1;
export const BED_HEIGHT = 0.24;
export const BED_PLANK = 0.07;
export const FIELD_THICKNESS = 0.3;
export const FIELD_MARGIN = 1.7;

const BED_GAP_X = 0.55;
const BED_GAP_Z = 0.65;
const MAX_COLUMNS = 6;
const SPOT_MARGIN_RATIO = 0.7;
const MAX_SPOT_COLUMNS = 3;
const FULL_TURN = Math.PI * 2;
const MIN_EXTENT = 5;

export type PlantSpot = {
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly seed: number;
  readonly phase: number;
};

export type GardenBed = {
  readonly id: string;
  readonly row: PlantRow;
  readonly cropId: CropId;
  readonly position: SceneVector;
  readonly spots: readonly PlantSpot[];
};

export type GardenField = {
  readonly beds: readonly GardenBed[];
  readonly width: number;
  readonly depth: number;
  readonly extent: number;
};

function spotPositions(count: number, seed: number): PlantSpot[] {
  const columns = Math.min(MAX_SPOT_COLUMNS, count);
  const rows = Math.ceil(count / columns);
  const stepX = (BED_WIDTH * SPOT_MARGIN_RATIO) / Math.max(columns - 1, 1);
  const stepZ = (BED_DEPTH * SPOT_MARGIN_RATIO) / Math.max(rows - 1, 1);
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const spotSeed = seed + index * 4.13;
    return {
      position: [
        (column - (columns - 1) / 2) * stepX + hashRange(spotSeed, -0.06, 0.06),
        BED_HEIGHT,
        (row - (rows - 1) / 2) * stepZ + hashRange(spotSeed + 1.7, -0.06, 0.06),
      ] as SceneVector,
      rotation: [0, hashRange(spotSeed + 2.9, 0, FULL_TURN), 0] as SceneVector,
      seed: spotSeed,
      phase: hashRange(spotSeed + 5.1, 0, FULL_TURN),
    };
  });
}

export function buildGardenField(
  rows: readonly PlantRow[],
  plantBudget: number,
): GardenField {
  const pitchX = BED_WIDTH + BED_GAP_X;
  const pitchZ = BED_DEPTH + BED_GAP_Z;
  const balancedColumns = Math.ceil(Math.sqrt((rows.length * pitchZ) / pitchX));
  const columns = Math.min(MAX_COLUMNS, Math.max(1, balancedColumns));
  const rowCount = Math.max(1, Math.ceil(rows.length / columns));
  const beds = rows.map((row, index) => {
    const column = index % columns;
    const gridRow = Math.floor(index / columns);
    const model = PLANT_MODEL_BY_CROP[row.cropId];
    const spotCount = Math.max(1, Math.min(row.quantity, model.spots, plantBudget));
    return {
      id: row.id,
      row,
      cropId: row.cropId,
      position: [
        (column - (columns - 1) / 2) * pitchX,
        0,
        (gridRow - (rowCount - 1) / 2) * pitchZ,
      ] as SceneVector,
      spots: spotPositions(spotCount, index * 7.31 + 1),
    };
  });
  const width = columns * pitchX + FIELD_MARGIN;
  const depth = rowCount * pitchZ + FIELD_MARGIN;
  const extent = Math.max(MIN_EXTENT, Math.max(width, depth));
  return { beds, width, depth, extent };
}
