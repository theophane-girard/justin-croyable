import { sceneNoiseRange, type SceneVector } from '@justin-croyable/design-system/components/scene';

import { CROP_BY_ID, type CropId, type VarietyId } from '../../../core/potager.model';
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
  type Tree,
} from '../plan/parcel.model';

import { PLANT_MODEL_BY_CROP } from './plant-models';

export const RAISED_HEIGHT = 0.3;
export const RAISED_PLANK = 0.05;
export const GROUND_SOIL_HEIGHT = 0.09;
export const TERRAIN_THICKNESS = 0.28;
export const TERRAIN_MARGIN = 1.2;

const FULL_TURN = Math.PI * 2;
const MIN_EXTENT = 4;
const CELL_FILL_RATIO = 1.15;
const MIN_SPREAD_SCALE = 0.45;
const MIN_HEIGHT_SCALE = 0.7;
const FULL_SCALE = 1;
const SCENE_HEIGHT = 1.6;
const TREE_SCALE = 1.8;
const TREE_MARGIN = 1.6;
const HALF = 2;
const KEY_SEPARATOR = ':';

export type PlantSpot = {
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly seed: number;
  readonly phase: number;
  readonly spreadScale: number;
  readonly heightScale: number;
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

export type GardenTree = {
  readonly id: string;
  readonly cropId: CropId;
  readonly varietyId: VarietyId;
  readonly label: string;
  readonly position: SceneVector;
  readonly spot: PlantSpot;
};

export type GardenField = {
  readonly parcels: readonly GardenParcel[];
  readonly trees: readonly GardenTree[];
  readonly width: number;
  readonly depth: number;
  readonly frameWidth: number;
  readonly frameDepth: number;
  readonly height: number;
  readonly extent: number;
};

export const CROP_FILTER = {
  all: 'all',
  legume: 'legume',
  fruit: 'fruit',
} as const;

export type CropFilter = (typeof CROP_FILTER)[keyof typeof CROP_FILTER];

/**
 * Le filtre ne masque que les plants : le terrain, les cases et le cadrage de la
 * caméra restent ceux du potager entier, sinon changer de filtre reconstruirait
 * la scène et recadrerait la vue.
 */
export function matchesCropFilter(cropId: CropId, filter: CropFilter): boolean {
  return filter === CROP_FILTER.all || CROP_BY_ID[cropId].category === filter;
}

export function cellKey(parcelId: string, column: number, row: number): string {
  return `${parcelId}${KEY_SEPARATOR}${column}${KEY_SEPARATOR}${row}`;
}

export function soilTop(kind: ParcelKind): number {
  return kind === PARCEL_KIND.raised ? RAISED_HEIGHT : GROUND_SOIL_HEIGHT;
}

function clamp(value: number, minimum: number): number {
  return Math.min(FULL_SCALE, Math.max(minimum, value));
}

/**
 * Une case étroite resserre le plant sans le miniaturiser : l'emprise se réduit
 * jusqu'à un plancher — un pied de courge déborde sur ses voisines comme au
 * potager — et la hauteur se tasse bien moins que l'emprise, sinon les espèces
 * étalées finissent écrasées au ras du sol.
 */
function cellFit(cropId: CropId, cellSide: number): { spread: number; height: number } {
  const spread = PLANT_MODEL_BY_CROP[cropId].spread;
  const ratio = (cellSide * CELL_FILL_RATIO) / (spread * HALF);
  return {
    spread: clamp(ratio, MIN_SPREAD_SCALE),
    height: clamp(Math.sqrt(ratio), MIN_HEIGHT_SCALE),
  };
}

function plantSpot(seed: number, cropId: CropId, top: number, cellSide: number): PlantSpot {
  const jitter = cellSide * 0.08;
  const fit = cellFit(cropId, cellSide);
  return {
    position: [
      sceneNoiseRange(seed, -jitter, jitter),
      top,
      sceneNoiseRange(seed + 1.7, -jitter, jitter),
    ],
    rotation: [0, sceneNoiseRange(seed + 2.9, 0, FULL_TURN), 0],
    seed,
    phase: sceneNoiseRange(seed + 5.1, 0, FULL_TURN),
    spreadScale: fit.spread,
    heightScale: fit.height,
  };
}

function buildTrees(trees: readonly Tree[]): readonly GardenTree[] {
  return trees.map((tree, index): GardenTree => {
    const seed = index * 13.7 + 4.2;
    return {
      id: tree.id,
      cropId: tree.cropId,
      varietyId: tree.varietyId,
      label: varietyLabel(tree.varietyId),
      position: [metres(tree.xCm), 0, metres(tree.zCm)],
      spot: {
        position: [0, 0, 0],
        rotation: [0, sceneNoiseRange(seed, 0, FULL_TURN), 0],
        seed,
        phase: sceneNoiseRange(seed + 3.3, 0, FULL_TURN),
        spreadScale: TREE_SCALE,
        heightScale: TREE_SCALE,
      },
    };
  });
}

/** Le cadrage doit englober les arbres plantés hors des parcelles. */
function treeReach(trees: readonly GardenTree[]): number {
  return trees.reduce(
    (reach, tree) =>
      Math.max(
        reach,
        Math.abs(tree.position[0]) + TREE_MARGIN,
        Math.abs(tree.position[2]) + TREE_MARGIN,
      ),
    0,
  );
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

  const trees = buildTrees(plan.trees);
  const bounds = extent ?? placementBounds(plan.parcels, plan.placements);
  const margin = extent ? 0 : TERRAIN_MARGIN;
  const reach = extent ? 0 : treeReach(trees) * HALF;
  const width = Math.max(MIN_EXTENT, metres(bounds.widthCm) + margin);
  const depth = Math.max(MIN_EXTENT, metres(bounds.depthCm) + margin);
  const frameWidth = Math.max(width, reach);
  const frameDepth = Math.max(depth, reach);

  return {
    parcels,
    trees,
    width,
    depth,
    frameWidth,
    frameDepth,
    height: SCENE_HEIGHT,
    extent: Math.max(frameWidth, frameDepth),
  };
}
