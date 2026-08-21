import { type GardenColors } from './garden-palette';
import {
  BED_DEPTH,
  BED_HEIGHT,
  BED_PLANK,
  BED_WIDTH,
  FIELD_THICKNESS,
} from './garden-layout';
import {
  SCENE_GEOMETRY,
  sceneNoiseRange,
  type ScenePart,
  type ScenePartDraft,
  sceneParts,
  type SceneVector,
} from '@justin-croyable/design-system/components/scene';

const FIELD_PREFIX = 'field';
const BED_PREFIX = 'bed';
const MARKER_PREFIX = 'marker';
const RING_PREFIX = 'ring';
const SOIL_ROUGHNESS = 1;
const WOOD_ROUGHNESS = 0.95;
const GRASS_BORDER = 0.7;
const FURROW_SPACING = 0.36;
const FURROW_WIDTH = 0.11;
const FURROW_HEIGHT = 0.04;
const BED_FURROW_COUNT = 4;
const HALF_TURN = Math.PI;
const MARKER_HEIGHT = 0.62;
const PLANK_SEGMENTS = 6;

export function buildFieldParts(
  width: number,
  depth: number,
  colors: GardenColors,
): ScenePart[] {
  const furrowCount = Math.max(1, Math.floor(depth / FURROW_SPACING));
  const furrows = Array.from({ length: furrowCount }, (_, index): ScenePartDraft => {
    const offset = (index - (furrowCount - 1) / 2) * FURROW_SPACING;
    return {
      geometry: SCENE_GEOMETRY.box,
      args: [width * sceneNoiseRange(index + 1, 0.94, 1), FURROW_HEIGHT, FURROW_WIDTH],
      position: [0, FURROW_HEIGHT / 2, offset],
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
      position: [0, -FIELD_THICKNESS / 2, 0],
      color: colors.fieldSoil,
      roughness: SOIL_ROUGHNESS,
    },
    ...furrows,
  ]);
}

export function buildBedParts(colors: GardenColors, plankColor: string): ScenePart[] {
  const plankHeight = BED_HEIGHT + 0.06;
  const outerWidth = BED_WIDTH + BED_PLANK * 2;
  const bedFurrows = Array.from({ length: BED_FURROW_COUNT }, (_, index): ScenePartDraft => {
    const offset = (index - (BED_FURROW_COUNT - 1) / 2) * (BED_DEPTH / BED_FURROW_COUNT);
    return {
      geometry: SCENE_GEOMETRY.box,
      args: [BED_WIDTH * 0.9, 0.024, FURROW_WIDTH * 0.7],
      position: [0, BED_HEIGHT, offset],
      color: colors.bedFurrow,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    };
  });
  return sceneParts(BED_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [BED_WIDTH, BED_HEIGHT, BED_DEPTH],
      position: [0, BED_HEIGHT / 2, 0],
      color: colors.bedSoil,
      roughness: SOIL_ROUGHNESS,
    },
    ...bedFurrows,
    ...([
      [0, BED_DEPTH / 2 + BED_PLANK / 2],
      [0, -(BED_DEPTH / 2 + BED_PLANK / 2)],
    ] as const).map(
      ([x, z]): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [outerWidth, plankHeight, BED_PLANK],
        position: [x, plankHeight / 2, z],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...([BED_WIDTH / 2 + BED_PLANK / 2, -(BED_WIDTH / 2 + BED_PLANK / 2)] as const).map(
      (x): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [BED_PLANK, plankHeight, BED_DEPTH],
        position: [x, plankHeight / 2, 0],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...([
      [BED_WIDTH / 2 + BED_PLANK / 2, BED_DEPTH / 2 + BED_PLANK / 2],
      [BED_WIDTH / 2 + BED_PLANK / 2, -(BED_DEPTH / 2 + BED_PLANK / 2)],
      [-(BED_WIDTH / 2 + BED_PLANK / 2), BED_DEPTH / 2 + BED_PLANK / 2],
      [-(BED_WIDTH / 2 + BED_PLANK / 2), -(BED_DEPTH / 2 + BED_PLANK / 2)],
    ] as const).map(
      ([x, z]): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.cylinder,
        args: [BED_PLANK * 0.8, BED_PLANK * 0.8, plankHeight * 1.35, PLANK_SEGMENTS],
        position: [x, (plankHeight * 1.35) / 2, z],
        color: colors.woodDark,
        roughness: WOOD_ROUGHNESS,
        flatShading: true,
      }),
    ),
  ]);
}

export function buildMarkerParts(colors: GardenColors): ScenePart[] {
  const anchor: SceneVector = [-BED_WIDTH / 2 + BED_PLANK, BED_HEIGHT, -BED_DEPTH / 2 + BED_PLANK];
  return sceneParts(MARKER_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.cylinder,
      args: [0.016, 0.016, MARKER_HEIGHT, PLANK_SEGMENTS],
      position: [anchor[0], anchor[1] + MARKER_HEIGHT / 2, anchor[2]],
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

export function buildRingParts(color: string): ScenePart[] {
  return sceneParts(RING_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.torus,
      args: [BED_WIDTH * 0.66, 0.03, 6, 40],
      position: [0, 0.02, 0],
      rotation: [HALF_TURN / 2, 0, 0],
      scale: [1, BED_DEPTH / BED_WIDTH, 1],
      color,
      roughness: 0.35,
    },
  ]);
}
