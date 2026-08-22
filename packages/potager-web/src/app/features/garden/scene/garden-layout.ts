import { sceneNoiseRange, type SceneVector } from '@justin-croyable/design-system/components/scene';

import { type CropId, type VarietyId } from '../../../core/potager.model';
import { varietyLabel } from '../plan/garden-catalog';
import {
  cellCentreX,
  cellCentreZ,
  type GardenPlan,
  metres,
  type Parcel,
  PARCEL_KIND,
  type ParcelKind,
  type ParcelPlacement,
  parcelFootprint,
  type PlanExtent,
  placementBounds,
  type Planting,
} from '../plan/parcel.model';

import { PLANT_MODEL_BY_CROP } from './plant-models';

export const RAISED_HEIGHT = 0.3;
export const RAISED_PLANK = 0.05;
export const GROUND_SOIL_HEIGHT = 0.09;
export const TERRAIN_THICKNESS = 0.28;
export const TERRAIN_MARGIN = 1.2;

const FULL_TURN = Math.PI * 2;
const MIN_EXTENT = 4;
const CELL_FILL_RATIO = 0.88;
const SCENE_HEIGHT = 1.6;
const HALF = 2;
const KEY_SEPARATOR = ':';

export type PlantSpot = {
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly seed: number;
  readonly phase: number;
  readonly scale: number;
};

export type GardenCell = {
  readonly key: string;
  readonly parcelId: string;
  readonly column: number;
  readonly row: number;
  readonly position: SceneVector;
  readonly width: number;
  readonly depth: number;
  readonly cropId: CropId | null;
  readonly varietyId: VarietyId | null;
  readonly label: string;
  readonly harvestedKg: number;
  readonly plant: PlantSpot | null;
};

export const EDGE_AXIS = { row: 'row', column: 'column' } as const;

export type EdgeAxis = (typeof EDGE_AXIS)[keyof typeof EDGE_AXIS];

export type GardenEdge = {
  readonly key: string;
  readonly parcelId: string;
  readonly axis: EdgeAxis;
  readonly index: number;
  readonly position: SceneVector;
  readonly width: number;
  readonly depth: number;
  readonly cellKeys: readonly string[];
};

export type GardenParcel = {
  readonly id: string;
  readonly name: string;
  readonly kind: ParcelKind;
  readonly position: SceneVector;
  readonly width: number;
  readonly depth: number;
  readonly columns: number;
  readonly rows: number;
  readonly soilTop: number;
  readonly cells: readonly GardenCell[];
  readonly edges: readonly GardenEdge[];
  readonly plantedCount: number;
};

export type GardenField = {
  readonly parcels: readonly GardenParcel[];
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly extent: number;
};

export function cellKey(parcelId: string, column: number, row: number): string {
  return `${parcelId}${KEY_SEPARATOR}${column}${KEY_SEPARATOR}${row}`;
}

export function soilTop(kind: ParcelKind): number {
  return kind === PARCEL_KIND.raised ? RAISED_HEIGHT : GROUND_SOIL_HEIGHT;
}

function cellFitScale(cropId: CropId, cellSide: number): number {
  const spread = PLANT_MODEL_BY_CROP[cropId].spread;
  return Math.min(1, (cellSide * CELL_FILL_RATIO) / (spread * HALF));
}

function plantSpot(seed: number, cropId: CropId, top: number, cellSide: number): PlantSpot {
  const jitter = cellSide * 0.08;
  return {
    position: [
      sceneNoiseRange(seed, -jitter, jitter),
      top,
      sceneNoiseRange(seed + 1.7, -jitter, jitter),
    ],
    rotation: [0, sceneNoiseRange(seed + 2.9, 0, FULL_TURN), 0],
    seed,
    phase: sceneNoiseRange(seed + 5.1, 0, FULL_TURN),
    scale: cellFitScale(cropId, cellSide),
  };
}

function buildCells(
  parcel: Parcel,
  placement: ParcelPlacement,
  plantings: readonly Planting[],
  parcelIndex: number,
): readonly GardenCell[] {
  const footprint = parcelFootprint(parcel, placement.rotated);
  const top = soilTop(parcel.kind);
  const width = metres(footprint.cellWidthCm);
  const depth = metres(footprint.cellDepthCm);
  const side = Math.min(width, depth);

  return Array.from({ length: footprint.columns }, (_, column) =>
    Array.from({ length: footprint.rows }, (_, row): GardenCell => {
      const planting = plantings.find(
        candidate =>
          candidate.parcelId === parcel.id && candidate.column === column && candidate.row === row,
      );
      const seed = parcelIndex * 31.7 + column * 7.31 + row * 3.11 + 1;
      return {
        key: cellKey(parcel.id, column, row),
        parcelId: parcel.id,
        column,
        row,
        position: [metres(cellCentreX(footprint, column)), 0, metres(cellCentreZ(footprint, row))],
        width,
        depth,
        cropId: planting?.cropId ?? null,
        varietyId: planting?.varietyId ?? null,
        label: planting ? varietyLabel(planting.varietyId) : '',
        harvestedKg: planting?.harvestedKg ?? 0,
        plant: planting ? plantSpot(seed, planting.cropId, top, side) : null,
      };
    }),
  ).flat();
}

const EDGE_THICKNESS = 0.16;
const EDGE_CLEARANCE = RAISED_PLANK;

function buildEdges(
  parcel: Parcel,
  placement: ParcelPlacement,
  cells: readonly GardenCell[],
): readonly GardenEdge[] {
  const footprint = parcelFootprint(parcel, placement.rotated);
  const halfWidth = metres(footprint.widthCm) / HALF + EDGE_CLEARANCE + EDGE_THICKNESS / HALF;
  const halfDepth = metres(footprint.depthCm) / HALF + EDGE_CLEARANCE + EDGE_THICKNESS / HALF;
  const cellWidth = metres(footprint.cellWidthCm);
  const cellDepth = metres(footprint.cellDepthCm);

  const rows = Array.from({ length: footprint.rows }, (_, row) =>
    ([halfWidth, -halfWidth] as const).map(
      (x, side): GardenEdge => ({
        key: `${parcel.id}:row:${row}:${side}`,
        parcelId: parcel.id,
        axis: EDGE_AXIS.row,
        index: row,
        position: [x, 0, metres(cellCentreZ(footprint, row))],
        width: EDGE_THICKNESS,
        depth: cellDepth,
        cellKeys: cells.filter(cell => cell.row === row).map(cell => cell.key),
      }),
    ),
  ).flat();

  const columns = Array.from({ length: footprint.columns }, (_, column) =>
    ([halfDepth, -halfDepth] as const).map(
      (z, side): GardenEdge => ({
        key: `${parcel.id}:column:${column}:${side}`,
        parcelId: parcel.id,
        axis: EDGE_AXIS.column,
        index: column,
        position: [metres(cellCentreX(footprint, column)), 0, z],
        width: cellWidth,
        depth: EDGE_THICKNESS,
        cellKeys: cells.filter(cell => cell.column === column).map(cell => cell.key),
      }),
    ),
  ).flat();

  return [...rows, ...columns];
}

export function buildGardenField(plan: GardenPlan, extent?: PlanExtent): GardenField {
  const parcels = plan.placements
    .map((placement, index) => {
      const parcel = plan.parcels.find(candidate => candidate.id === placement.parcelId);
      if (!parcel) {
        return null;
      }
      const footprint = parcelFootprint(parcel, placement.rotated);
      const cells = buildCells(parcel, placement, plan.plantings, index);
      return {
        id: parcel.id,
        name: parcel.name,
        kind: parcel.kind,
        position: [
          metres(placement.xCm + footprint.widthCm / HALF),
          0,
          metres(placement.zCm + footprint.depthCm / HALF),
        ],
        width: metres(footprint.widthCm),
        depth: metres(footprint.depthCm),
        columns: footprint.columns,
        rows: footprint.rows,
        soilTop: soilTop(parcel.kind),
        cells,
        edges: buildEdges(parcel, placement, cells),
        plantedCount: cells.filter(cell => cell.varietyId !== null).length,
      } satisfies GardenParcel;
    })
    .filter((parcel): parcel is GardenParcel => parcel !== null);

  const bounds = extent ?? placementBounds(plan.parcels, plan.placements);
  const margin = extent ? 0 : TERRAIN_MARGIN;
  const width = Math.max(MIN_EXTENT, metres(bounds.widthCm) + margin);
  const depth = Math.max(MIN_EXTENT, metres(bounds.depthCm) + margin);

  return {
    parcels,
    width,
    depth,
    height: SCENE_HEIGHT,
    extent: Math.max(width, depth),
  };
}
