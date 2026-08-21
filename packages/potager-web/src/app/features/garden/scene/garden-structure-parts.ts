import {
  SCENE_GEOMETRY,
  sceneNoiseRange,
  type ScenePart,
  type ScenePartDraft,
  sceneParts,
  type SceneVector,
} from '@justin-croyable/design-system/components/scene';

import { type GardenColors } from './garden-palette';
import { BED_HEIGHT, BED_PLANK, FIELD_THICKNESS } from './garden-layout';
import { SLOT_SIZE } from './garden-plan.model';

const FIELD_PREFIX = 'field';
const BED_PREFIX = 'bed';
const CELL_PREFIX = 'cell';
const SLOT_PREFIX = 'slot';
const MARKER_PREFIX = 'marker';
const RING_PREFIX = 'ring';
const SOIL_ROUGHNESS = 1;
const WOOD_ROUGHNESS = 0.95;
const GRASS_BORDER = 0.7;
const FURROW_SPACING = 0.36;
const FURROW_WIDTH = 0.11;
const FURROW_HEIGHT = 0.04;
const HALF_TURN = Math.PI;
const HALF = 2;
const MARKER_HEIGHT = 0.62;
const PLANK_SEGMENTS = 6;
const CELL_INSET = 0.1;
const CELL_TILE_HEIGHT = 0.04;
const CELL_FURROW_COUNT = 3;
const SLOT_MARKER_HEIGHT = 0.022;
const SLOT_MARKER_INSET = 0.18;

export function buildFieldParts(
  width: number,
  depth: number,
  colors: GardenColors,
): ScenePart[] {
  const furrowCount = Math.max(1, Math.floor(depth / FURROW_SPACING));
  const furrows = Array.from({ length: furrowCount }, (_, index): ScenePartDraft => {
    const offset = (index - (furrowCount - 1) / HALF) * FURROW_SPACING;
    return {
      geometry: SCENE_GEOMETRY.box,
      args: [width * sceneNoiseRange(index + 1, 0.94, 1), FURROW_HEIGHT, FURROW_WIDTH],
      position: [0, FURROW_HEIGHT / HALF, offset],
      color: colors.fieldFurrow,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    };
  });
  return sceneParts(FIELD_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width + GRASS_BORDER, FIELD_THICKNESS * 0.9, depth + GRASS_BORDER],
      position: [0, -FIELD_THICKNESS * 0.62, 0],
      color: colors.grass,
      roughness: SOIL_ROUGHNESS,
    },
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width, FIELD_THICKNESS, depth],
      position: [0, -FIELD_THICKNESS / HALF, 0],
      color: colors.fieldSoil,
      roughness: SOIL_ROUGHNESS,
    },
    ...furrows,
  ]);
}

export function buildBedParts(
  columns: number,
  rows: number,
  colors: GardenColors,
  plankColor: string,
): ScenePart[] {
  const width = columns * SLOT_SIZE;
  const depth = rows * SLOT_SIZE;
  const plankHeight = BED_HEIGHT + 0.06;
  const outerWidth = width + BED_PLANK * HALF;
  const halfWidth = width / HALF + BED_PLANK / HALF;
  const halfDepth = depth / HALF + BED_PLANK / HALF;
  return sceneParts(BED_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width, BED_HEIGHT, depth],
      position: [0, BED_HEIGHT / HALF, 0],
      color: colors.bedSoil,
      roughness: SOIL_ROUGHNESS,
    },
    ...([halfDepth, -halfDepth] as const).map(
      (z): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [outerWidth, plankHeight, BED_PLANK],
        position: [0, plankHeight / HALF, z],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...([halfWidth, -halfWidth] as const).map(
      (x): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [BED_PLANK, plankHeight, depth],
        position: [x, plankHeight / HALF, 0],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...([
      [halfWidth, halfDepth],
      [halfWidth, -halfDepth],
      [-halfWidth, halfDepth],
      [-halfWidth, -halfDepth],
    ] as const).map(
      ([x, z]): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.cylinder,
        args: [BED_PLANK * 0.8, BED_PLANK * 0.8, plankHeight * 1.35, PLANK_SEGMENTS],
        position: [x, (plankHeight * 1.35) / HALF, z],
        color: colors.woodDark,
        roughness: WOOD_ROUGHNESS,
        flatShading: true,
      }),
    ),
  ]);
}

export function buildCellParts(colors: GardenColors, tileColor: string): ScenePart[] {
  const tileSize = SLOT_SIZE - CELL_INSET;
  const furrows = Array.from({ length: CELL_FURROW_COUNT }, (_, index): ScenePartDraft => {
    const offset = (index - (CELL_FURROW_COUNT - 1) / HALF) * (tileSize / CELL_FURROW_COUNT);
    return {
      geometry: SCENE_GEOMETRY.box,
      args: [tileSize * 0.86, CELL_TILE_HEIGHT * 0.55, FURROW_WIDTH * 0.55],
      position: [0, BED_HEIGHT + CELL_TILE_HEIGHT * 1.6, offset],
      color: colors.bedFurrow,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    };
  });
  return sceneParts(CELL_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [tileSize, CELL_TILE_HEIGHT, tileSize],
      position: [0, BED_HEIGHT + CELL_TILE_HEIGHT / HALF, 0],
      color: tileColor,
      roughness: SOIL_ROUGHNESS,
    },
    ...furrows,
  ]);
}

export function buildSlotMarkerParts(color: string): ScenePart[] {
  const side = SLOT_SIZE - SLOT_MARKER_INSET;
  return sceneParts(SLOT_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [side, SLOT_MARKER_HEIGHT, side],
      position: [0, SLOT_MARKER_HEIGHT / HALF, 0],
      color,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    },
  ]);
}

export function buildMarkerParts(
  columns: number,
  rows: number,
  colors: GardenColors,
): ScenePart[] {
  const anchor: SceneVector = [
    -(columns * SLOT_SIZE) / HALF + BED_PLANK,
    BED_HEIGHT,
    -(rows * SLOT_SIZE) / HALF + BED_PLANK,
  ];
  return sceneParts(MARKER_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.cylinder,
      args: [0.016, 0.016, MARKER_HEIGHT, PLANK_SEGMENTS],
      position: [anchor[0], anchor[1] + MARKER_HEIGHT / HALF, anchor[2]],
      color: colors.stone,
      roughness: WOOD_ROUGHNESS,
    },
    {
      geometry: SCENE_GEOMETRY.sphere,
      args: [0.08, 12, 9],
      position: [anchor[0], anchor[1] + MARKER_HEIGHT + 0.05, anchor[2]],
      color: colors.marker,
      roughness: 0.3,
    },
  ]);
}

export function buildRingParts(columns: number, rows: number, color: string): ScenePart[] {
  const width = columns * SLOT_SIZE;
  const depth = rows * SLOT_SIZE;
  return sceneParts(RING_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.torus,
      args: [width * 0.62, 0.03, 6, 40],
      position: [0, 0.02, 0],
      rotation: [HALF_TURN / HALF, 0, 0],
      scale: [1, depth / width, 1],
      color,
      roughness: 0.35,
    },
  ]);
}
