import { type CropId } from '../../../core/potager.model';

import { type GardenSceneColors } from './garden-scene-theme';
import {
  FRUIT_SHAPE,
  type FruitShape,
  PLANT_ARCHETYPE,
  type PlantArchetype,
  PLANT_MODEL_BY_CROP,
  type PlantModel,
  ROOT_SHAPE,
  type RootShape,
} from './plant-models';
import {
  hashRange,
  PART_GEOMETRY,
  type ScenePart,
  type ScenePartDraft,
  sceneParts,
  type SceneVector,
} from './scene-part';

const FULL_TURN = Math.PI * 2;
const HALF_TURN = Math.PI;
const SPHERE_SEGMENTS = 10;
const SPHERE_RINGS = 7;
const ICOSAHEDRON_DETAIL = 0;
const CYLINDER_SEGMENTS = 7;
const CONE_SEGMENTS = 7;
const CAPSULE_CAP_SEGMENTS = 3;
const CAPSULE_RADIAL_SEGMENTS = 7;
const FOLIAGE_ROUGHNESS = 0.9;
const FRUIT_ROUGHNESS = 0.45;
const WOOD_ROUGHNESS = 0.95;

function sphereArgs(radius: number): number[] {
  return [radius, SPHERE_SEGMENTS, SPHERE_RINGS];
}

function ringPositions(
  count: number,
  radius: number,
  height: number,
  offset: number,
): SceneVector[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = offset + (index / count) * FULL_TURN;
    return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
  });
}

type FruitBuilder = (position: SceneVector, radius: number, color: string) => ScenePartDraft;

const FRUIT_BUILDERS: Readonly<Record<FruitShape, FruitBuilder>> = {
  [FRUIT_SHAPE.berry]: (position, radius, color) => ({
    geometry: PART_GEOMETRY.sphere,
    args: sphereArgs(radius),
    position,
    color,
    roughness: FRUIT_ROUGHNESS,
  }),
  [FRUIT_SHAPE.pod]: (position, radius, color) => ({
    geometry: PART_GEOMETRY.capsule,
    args: [radius, radius * 3.4, CAPSULE_CAP_SEGMENTS, CAPSULE_RADIAL_SEGMENTS],
    position,
    rotation: [0, 0, HALF_TURN / 14],
    color,
    roughness: FRUIT_ROUGHNESS,
  }),
  [FRUIT_SHAPE.marrow]: (position, radius, color) => ({
    geometry: PART_GEOMETRY.capsule,
    args: [radius, radius * 3.8, CAPSULE_CAP_SEGMENTS, CAPSULE_RADIAL_SEGMENTS],
    position,
    rotation: [HALF_TURN / 2, 0, 0],
    color,
    roughness: FRUIT_ROUGHNESS,
  }),
  [FRUIT_SHAPE.bunch]: (position, radius, color) => ({
    geometry: PART_GEOMETRY.cone,
    args: [radius * 1.4, radius * 4.2, CONE_SEGMENTS],
    position,
    rotation: [HALF_TURN, 0, 0],
    color,
    roughness: FRUIT_ROUGHNESS,
    flatShading: true,
  }),
  [FRUIT_SHAPE.gourd]: (position, radius, color) => ({
    geometry: PART_GEOMETRY.sphere,
    args: sphereArgs(radius),
    position,
    scale: [1, 0.76, 1],
    color,
    roughness: FRUIT_ROUGHNESS,
    flatShading: true,
  }),
};

function fruits(
  model: PlantModel,
  colors: GardenSceneColors,
  radius: number,
  lowest: number,
  highest: number,
  seed: number,
): ScenePartDraft[] {
  const build = FRUIT_BUILDERS[model.fruitShape];
  const color = colors[model.fruit];
  return ringPositions(model.fruitCount, radius, 0, seed).map(([x, , z], index) => {
    const spanRatio = model.fruitCount > 1 ? index / (model.fruitCount - 1) : 0;
    const height = lowest + (highest - lowest) * spanRatio;
    const wobble = hashRange(seed + index * 3.7, 0.72, 1.12);
    return build([x * wobble, height, z * wobble], model.fruitRadius, color);
  });
}

function foliageClumps(
  count: number,
  radius: number,
  spread: number,
  lowest: number,
  highest: number,
  color: string,
  seed: number,
): ScenePartDraft[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = seed + (index / count) * FULL_TURN;
    const ratio = count > 1 ? index / (count - 1) : 0;
    const clumpRadius = radius * hashRange(seed + index, 0.78, 1.18);
    return {
      geometry: PART_GEOMETRY.icosahedron,
      args: [clumpRadius, ICOSAHEDRON_DETAIL],
      position: [
        Math.cos(angle) * spread,
        lowest + (highest - lowest) * ratio,
        Math.sin(angle) * spread,
      ] as SceneVector,
      color,
      roughness: FOLIAGE_ROUGHNESS,
      flatShading: true,
    };
  });
}

function flatLeaves(
  count: number,
  radius: number,
  spread: number,
  height: number,
  color: string,
  seed: number,
): ScenePartDraft[] {
  return ringPositions(count, spread, height, seed).map((position, index) => ({
    geometry: PART_GEOMETRY.sphere,
    args: sphereArgs(radius * hashRange(seed + index * 2.3, 0.82, 1.15)),
    position,
    rotation: [hashRange(seed + index, -0.16, 0.16), 0, hashRange(seed + index * 1.7, -0.2, 0.2)],
    scale: [1, 0.2, 1],
    color,
    roughness: FOLIAGE_ROUGHNESS,
    flatShading: true,
  }));
}

function leafBlades(
  count: number,
  bladeHeight: number,
  radius: number,
  spread: number,
  baseHeight: number,
  color: string,
  seed: number,
): ScenePartDraft[] {
  return ringPositions(count, spread, baseHeight + bladeHeight / 2, seed).map((position, index) => ({
    geometry: PART_GEOMETRY.cone,
    args: [radius, bladeHeight * hashRange(seed + index * 1.3, 0.78, 1.2), CONE_SEGMENTS],
    position,
    rotation: [
      hashRange(seed + index * 2.1, -0.34, 0.34),
      0,
      hashRange(seed + index * 3.1, -0.34, 0.34),
    ],
    color,
    roughness: FOLIAGE_ROUGHNESS,
    flatShading: true,
  }));
}

function stakedVine(
  model: PlantModel,
  colors: GardenSceneColors,
  seed: number,
): ScenePartDraft[] {
  const { height, spread } = model;
  return [
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.012, 0.016, height * 1.08, 5],
      position: [spread * 0.5, height * 0.54, 0],
      color: colors.bark,
      roughness: WOOD_ROUGHNESS,
      flatShading: true,
    },
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.022, 0.036, height * 0.94, CYLINDER_SEGMENTS],
      position: [0, height * 0.47, 0],
      color: colors[model.stem],
      roughness: FOLIAGE_ROUGHNESS,
    },
    ...foliageClumps(
      7,
      spread * 0.5,
      spread * 0.58,
      height * 0.24,
      height * 0.94,
      colors[model.foliage],
      seed,
    ),
    ...fruits(model, colors, spread * 0.5, height * 0.3, height * 0.8, seed),
  ];
}

function bush(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  return [
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.018, 0.03, height * 0.5, CYLINDER_SEGMENTS],
      position: [0, height * 0.25, 0],
      color: colors[model.stem],
      roughness: FOLIAGE_ROUGHNESS,
    },
    ...flatLeaves(5, spread * 0.44, spread * 0.6, height * 0.16, colors[model.foliage], seed),
    ...foliageClumps(
      4,
      spread * 0.4,
      spread * 0.34,
      height * 0.52,
      height * 0.9,
      colors[model.foliage],
      seed + 1.3,
    ),
    ...fruits(model, colors, spread * 0.44, height * 0.38, height * 0.74, seed),
  ];
}

function sprawler(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  return [
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.05, 0.07, height * 0.4, CYLINDER_SEGMENTS],
      position: [0, height * 0.2, 0],
      color: colors[model.stem],
      roughness: FOLIAGE_ROUGHNESS,
    },
    ...flatLeaves(6, spread * 0.52, spread * 0.68, height * 0.26, colors[model.foliage], seed),
    ...flatLeaves(
      3,
      spread * 0.38,
      spread * 0.3,
      height * 0.78,
      colors[model.foliageAccent],
      seed + 2.6,
    ),
    ...fruits(
      model,
      colors,
      spread * 0.66,
      model.fruitRadius * 1.05,
      model.fruitRadius * 1.05,
      seed,
    ),
  ];
}

function rosette(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  return [
    ...flatLeaves(7, spread * 0.52, spread * 0.62, height * 0.16, colors[model.foliage], seed),
    ...flatLeaves(
      6,
      spread * 0.44,
      spread * 0.4,
      height * 0.44,
      colors[model.foliage],
      seed + 1.9,
    ),
    ...flatLeaves(
      4,
      spread * 0.34,
      spread * 0.2,
      height * 0.68,
      colors[model.foliageAccent],
      seed + 3.1,
    ),
    {
      geometry: PART_GEOMETRY.sphere,
      args: sphereArgs(spread * 0.3),
      position: [0, height * 0.82, 0],
      scale: [1, 0.62, 1],
      color: colors[model.foliageAccent],
      roughness: FOLIAGE_ROUGHNESS,
      flatShading: true,
    },
  ];
}

type RootBuilder = (
  model: PlantModel,
  colors: GardenSceneColors,
  seed: number,
) => ScenePartDraft[];

const ROOT_BUILDERS: Readonly<Record<RootShape, RootBuilder>> = {
  [ROOT_SHAPE.taproot]: (model, colors) => [
    {
      geometry: PART_GEOMETRY.cone,
      args: [model.fruitRadius, model.fruitRadius * 4.4, CONE_SEGMENTS],
      position: [0, -model.fruitRadius * 0.9, 0],
      rotation: [HALF_TURN, 0, 0],
      color: colors[model.fruit],
      roughness: FRUIT_ROUGHNESS,
      flatShading: true,
    },
  ],
  [ROOT_SHAPE.bulb]: (model, colors) => [
    {
      geometry: PART_GEOMETRY.sphere,
      args: sphereArgs(model.fruitRadius),
      position: [0, model.fruitRadius * 0.35, 0],
      scale: [1, 0.9, 1],
      color: colors[model.fruit],
      roughness: FRUIT_ROUGHNESS,
    },
  ],
  [ROOT_SHAPE.tuber]: (model, colors, seed) =>
    ringPositions(model.fruitCount, model.spread * 0.34, model.fruitRadius * 0.5, seed).map(
      (position, index) => ({
        geometry: PART_GEOMETRY.sphere,
        args: sphereArgs(model.fruitRadius * hashRange(seed + index, 0.8, 1.15)),
        position,
        scale: [1.2, 0.8, 1],
        color: colors[model.fruit],
        roughness: FRUIT_ROUGHNESS,
        flatShading: true,
      }),
    ),
  [ROOT_SHAPE.shaft]: (model, colors) => [
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [model.fruitRadius, model.fruitRadius * 1.15, model.height * 0.5, CYLINDER_SEGMENTS],
      position: [0, model.height * 0.25, 0],
      color: colors[model.fruit],
      roughness: FRUIT_ROUGHNESS,
    },
  ],
};

function root(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  const isShaft = model.rootShape === ROOT_SHAPE.shaft;
  const tuftBase = isShaft ? height * 0.42 : height * 0.1;
  const tuftHeight = (isShaft ? 0.52 : 0.74) * height;
  return [
    ...ROOT_BUILDERS[model.rootShape](model, colors, seed),
    ...leafBlades(
      6,
      tuftHeight,
      spread * 0.15,
      spread * 0.24,
      tuftBase,
      colors[model.foliage],
      seed,
    ),
  ];
}

function trellis(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  const post = (offset: number, index: number): ScenePartDraft => ({
    geometry: PART_GEOMETRY.cylinder,
    args: [0.018, 0.022, height, 5],
    position: [offset, height / 2, 0],
    color: colors.bark,
    roughness: WOOD_ROUGHNESS,
    flatShading: true,
    rotation: [0, 0, index === 0 ? 0.05 : -0.05],
  });
  const rail = (ratio: number): ScenePartDraft => ({
    geometry: PART_GEOMETRY.cylinder,
    args: [0.01, 0.01, spread * 2.1, 5],
    position: [0, height * ratio, 0],
    rotation: [0, 0, HALF_TURN / 2],
    color: colors.bark,
    roughness: WOOD_ROUGHNESS,
  });
  return [
    post(-spread * 0.9, 0),
    post(spread * 0.9, 1),
    rail(0.45),
    rail(0.82),
    ...Array.from({ length: 4 }, (_, index): ScenePartDraft => {
      const offset = (index / 3 - 0.5) * spread * 1.5;
      return {
        geometry: PART_GEOMETRY.cylinder,
        args: [0.008, 0.012, height * 0.94, 5],
        position: [offset, height * 0.47, 0],
        rotation: [0, 0, hashRange(seed + index * 2.9, -0.12, 0.12)],
        color: colors[model.stem],
        roughness: FOLIAGE_ROUGHNESS,
      };
    }),
    ...flatLeaves(4, spread * 0.28, spread * 0.7, height * 0.6, colors[model.foliage], seed),
    ...flatLeaves(
      4,
      spread * 0.24,
      spread * 0.55,
      height * 0.88,
      colors[model.foliageAccent],
      seed + 1.6,
    ),
    ...fruits(model, colors, spread * 0.62, height * 0.36, height * 0.76, seed),
  ];
}

function tree(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  return [
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.075, 0.125, height * 0.46, CYLINDER_SEGMENTS],
      position: [0, height * 0.23, 0],
      color: colors.bark,
      roughness: WOOD_ROUGHNESS,
      flatShading: true,
    },
    {
      geometry: PART_GEOMETRY.cylinder,
      args: [0.04, 0.075, height * 0.24, CYLINDER_SEGMENTS],
      position: [0, height * 0.57, 0],
      color: colors.bark,
      roughness: WOOD_ROUGHNESS,
      flatShading: true,
    },
    ...foliageClumps(
      6,
      spread * 0.46,
      spread * 0.42,
      height * 0.62,
      height * 0.98,
      colors[model.foliage],
      seed,
    ),
    ...foliageClumps(
      3,
      spread * 0.32,
      spread * 0.18,
      height * 0.7,
      height * 0.92,
      colors[model.foliageAccent],
      seed + 2.2,
    ),
    ...fruits(model, colors, spread * 0.52, height * 0.62, height * 0.88, seed),
  ];
}

function stalk(model: PlantModel, colors: GardenSceneColors, seed: number): ScenePartDraft[] {
  const { height, spread } = model;
  const stalkCount = model.fruitCount;
  return [
    ...ringPositions(stalkCount, spread * 0.26, height * 0.32, seed).map(
      (position, index): ScenePartDraft => ({
        geometry: PART_GEOMETRY.cylinder,
        args: [model.fruitRadius * 0.7, model.fruitRadius, height * 0.66, CYLINDER_SEGMENTS],
        position,
        rotation: [
          hashRange(seed + index * 1.9, -0.22, 0.22),
          0,
          hashRange(seed + index * 2.7, -0.22, 0.22),
        ],
        color: colors[model.fruit],
        roughness: FRUIT_ROUGHNESS,
      }),
    ),
    ...flatLeaves(
      stalkCount,
      spread * 0.38,
      spread * 0.4,
      height * 0.72,
      colors[model.foliage],
      seed,
    ),
    ...flatLeaves(
      3,
      spread * 0.3,
      spread * 0.16,
      height * 0.88,
      colors[model.foliageAccent],
      seed + 1.4,
    ),
  ];
}

type PlantBuilder = (
  model: PlantModel,
  colors: GardenSceneColors,
  seed: number,
) => ScenePartDraft[];

const PLANT_BUILDERS: Readonly<Record<PlantArchetype, PlantBuilder>> = {
  [PLANT_ARCHETYPE.stakedVine]: stakedVine,
  [PLANT_ARCHETYPE.bush]: bush,
  [PLANT_ARCHETYPE.sprawler]: sprawler,
  [PLANT_ARCHETYPE.rosette]: rosette,
  [PLANT_ARCHETYPE.root]: root,
  [PLANT_ARCHETYPE.trellis]: trellis,
  [PLANT_ARCHETYPE.tree]: tree,
  [PLANT_ARCHETYPE.stalk]: stalk,
};

export function buildPlantParts(
  cropId: CropId,
  colors: GardenSceneColors,
  seed: number,
): ScenePart[] {
  const model = PLANT_MODEL_BY_CROP[cropId];
  return sceneParts(cropId, PLANT_BUILDERS[model.archetype](model, colors, seed));
}
