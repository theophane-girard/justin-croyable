import {
  SCENE_GEOMETRY,
  sceneNoiseRange,
  type ScenePart,
  type ScenePartDraft,
  sceneParts,
} from '@justin-croyable/design-system/components/scene';

import { PARCEL_KIND, type ParcelKind } from '../plan/parcel.model';

import { type GardenColors } from './garden-palette';
import {
  GROUND_SOIL_HEIGHT,
  RAISED_HEIGHT,
  RAISED_PLANK,
  TERRAIN_THICKNESS,
} from './garden-layout';

const TERRAIN_PREFIX = 'terrain';
const HORIZON_PREFIX = 'horizon';
const PARCEL_PREFIX = 'parcel';
const CELL_PREFIX = 'cell';
const OUTLINE_PREFIX = 'outline';
const GRID_PREFIX = 'grid';

const SOIL_ROUGHNESS = 1;
const WOOD_ROUGHNESS = 0.95;
const GRASS_BORDER = 0.9;
const SOIL_INSET = GRASS_BORDER;
const LAWN_SPREAD = 3.2;
const HORIZON_RADIUS_RATIO = 3.6;
const MAX_HORIZON_RADIUS = 300;
const HORIZON_SEGMENTS = 48;
const HORIZON_DROP = 0.06;
const BLADE_COUNT = 90;
const BLADE_HEIGHT = 0.13;
const BLADE_WIDTH = 0.022;
const BLADE_SEGMENTS = 4;
const FURROW_SPACING = 0.62;
const FURROW_WIDTH = 0.1;
const FURROW_HEIGHT = 0.02;
const PLANK_SEGMENTS = 6;
const POST_RATIO = 1.3;
const CELL_INSET_RATIO = 0.12;
const CELL_TILE_HEIGHT = 0.012;
const OUTLINE_THICKNESS = 0.05;
const OUTLINE_LIFT = 0.02;
const GRID_LINE = 0.008;
const HALF = 2;

/**
 * Rayon des coins du terrain. Le rayon du système de design vaut environ quatre
 * pour cent de la largeur d'une carte : on transpose ce rapport aux dalles de
 * terrain, avec un plancher et un plafond pour rester lisible d'un potager de
 * poche à un terrain de trente mètres.
 */
const CORNER_RADIUS_RATIO = 0.04;
const MIN_CORNER_RADIUS = 0.08;
const MAX_CORNER_RADIUS = 0.6;
const CORNER_SEGMENTS = 14;

function cornerRadius(width: number, depth: number): number {
  const shortest = Math.min(width, depth);
  return Math.min(MAX_CORNER_RADIUS, Math.max(MIN_CORNER_RADIUS, shortest * CORNER_RADIUS_RATIO));
}

/**
 * Dalle à coins arrondis : deux pavés croisés et quatre cylindres aux angles.
 * Les moitiés cachées des cylindres tombent dans les pavés, rien ne dépasse.
 */
function roundedSlab(
  width: number,
  depth: number,
  height: number,
  y: number,
  color: string,
  radius: number,
): readonly ScenePartDraft[] {
  const inset = Math.min(radius, Math.min(width, depth) / HALF);
  const halfWidth = width / HALF - inset;
  const halfDepth = depth / HALF - inset;
  const corners = [
    [halfWidth, halfDepth],
    [halfWidth, -halfDepth],
    [-halfWidth, halfDepth],
    [-halfWidth, -halfDepth],
  ] as const;

  return [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width - inset * HALF, height, depth],
      position: [0, y, 0],
      color,
      roughness: SOIL_ROUGHNESS,
    },
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width, height, depth - inset * HALF],
      position: [0, y, 0],
      color,
      roughness: SOIL_ROUGHNESS,
    },
    ...corners.map(
      ([x, z]): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.cylinder,
        args: [inset, inset, height, CORNER_SEGMENTS],
        position: [x, y, z],
        color,
        roughness: SOIL_ROUGHNESS,
      }),
    ),
  ];
}

/**
 * Touffes d'herbe semées sur la pelouse, en dehors de la terre travaillée. Le
 * bruit déterministe de la scène leur donne des positions et des tailles
 * stables d'un rendu à l'autre.
 */
function lawnBlades(
  lawnWidth: number,
  lawnDepth: number,
  width: number,
  depth: number,
  colors: GardenColors,
): readonly ScenePartDraft[] {
  return Array.from({ length: BLADE_COUNT }, (_, index): ScenePartDraft | null => {
    const seed = index * 4.13 + 1;
    const x = sceneNoiseRange(seed, -lawnWidth / HALF, lawnWidth / HALF);
    const z = sceneNoiseRange(seed + 2.7, -lawnDepth / HALF, lawnDepth / HALF);
    if (Math.abs(x) < width / HALF && Math.abs(z) < depth / HALF) {
      return null;
    }
    const height = BLADE_HEIGHT * sceneNoiseRange(seed + 5.3, 0.6, 1.4);
    return {
      geometry: SCENE_GEOMETRY.cone,
      args: [BLADE_WIDTH, height, BLADE_SEGMENTS],
      position: [x, height / HALF, z],
      rotation: [0, sceneNoiseRange(seed + 7.9, 0, Math.PI), 0],
      color: sceneNoiseRange(seed + 9.1, 0, 1) > 0.5 ? colors.leafBright : colors.leaf,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    };
  }).filter((blade): blade is ScenePartDraft => blade !== null);
}

export function horizonRadius(extent: number): number {
  return Math.min(MAX_HORIZON_RADIUS, extent * HORIZON_RADIUS_RATIO);
}

/**
 * Prairie filant jusqu'à l'horizon, sous la pelouse du potager. Elle n'a pas de
 * bord visible : la brume de distance la dissout dans le ciel bien avant son
 * rebord.
 */
export function buildHorizonParts(extent: number, colors: GardenColors): ScenePart[] {
  return sceneParts(HORIZON_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.circle,
      args: [horizonRadius(extent), HORIZON_SEGMENTS],
      position: [0, -HORIZON_DROP, 0],
      rotation: [-Math.PI / HALF, 0, 0],
      color: colors.grass,
      roughness: SOIL_ROUGHNESS,
    },
  ]);
}

export function buildTerrainParts(
  width: number,
  depth: number,
  colors: GardenColors,
  tilled = true,
): ScenePart[] {
  const soilWidth = Math.max(width - SOIL_INSET, width * 0.5);
  const soilDepth = Math.max(depth - SOIL_INSET, depth * 0.5);
  const lawnWidth = width * LAWN_SPREAD;
  const lawnDepth = depth * LAWN_SPREAD;
  const grassRadius = cornerRadius(lawnWidth, lawnDepth);
  const soilRadius = cornerRadius(soilWidth, soilDepth);
  const furrowSpan = Math.max(soilWidth - soilRadius * HALF, soilWidth * 0.5);
  const furrowCount = tilled ? Math.max(1, Math.floor(soilDepth / FURROW_SPACING)) : 0;
  const furrows = Array.from({ length: furrowCount }, (_, index): ScenePartDraft => {
    const offset = (index - (furrowCount - 1) / HALF) * FURROW_SPACING;
    return {
      geometry: SCENE_GEOMETRY.box,
      args: [furrowSpan * sceneNoiseRange(index + 1, 0.94, 1), FURROW_HEIGHT, FURROW_WIDTH],
      position: [0, FURROW_HEIGHT / HALF, offset],
      color: colors.fieldFurrow,
      roughness: SOIL_ROUGHNESS,
      flatShading: true,
    };
  });

  return sceneParts(TERRAIN_PREFIX, [
    ...roundedSlab(
      lawnWidth,
      lawnDepth,
      TERRAIN_THICKNESS * 0.9,
      -TERRAIN_THICKNESS * 0.62,
      colors.grass,
      grassRadius,
    ),
    ...lawnBlades(lawnWidth, lawnDepth, width, depth, colors),
    ...roundedSlab(
      soilWidth,
      soilDepth,
      TERRAIN_THICKNESS,
      -TERRAIN_THICKNESS / HALF,
      colors.fieldSoil,
      soilRadius,
    ),
    ...furrows,
  ]);
}

function raisedFrameParts(
  width: number,
  depth: number,
  colors: GardenColors,
  plankColor: string,
): readonly ScenePartDraft[] {
  const plankHeight = RAISED_HEIGHT + 0.05;
  const outerWidth = width + RAISED_PLANK * HALF;
  const halfWidth = width / HALF + RAISED_PLANK / HALF;
  const halfDepth = depth / HALF + RAISED_PLANK / HALF;
  const postHeight = plankHeight * POST_RATIO;

  return [
    ...([halfDepth, -halfDepth] as const).map(
      (z): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [outerWidth, plankHeight, RAISED_PLANK],
        position: [0, plankHeight / HALF, z],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...([halfWidth, -halfWidth] as const).map(
      (x): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [RAISED_PLANK, plankHeight, depth],
        position: [x, plankHeight / HALF, 0],
        color: plankColor,
        roughness: WOOD_ROUGHNESS,
      }),
    ),
    ...(
      [
        [halfWidth, halfDepth],
        [halfWidth, -halfDepth],
        [-halfWidth, halfDepth],
        [-halfWidth, -halfDepth],
      ] as const
    ).map(
      ([x, z]): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.cylinder,
        args: [RAISED_PLANK * 0.8, RAISED_PLANK * 0.8, postHeight, PLANK_SEGMENTS],
        position: [x, postHeight / HALF, z],
        color: colors.woodDark,
        roughness: WOOD_ROUGHNESS,
        flatShading: true,
      }),
    ),
  ];
}

/**
 * Bourrelet de terre autour d'une planche en pleine terre. Il est posé en
 * dehors de l'emprise cultivable : centré sur le bord, il mordait sur la
 * première et la dernière rangée de cases.
 */
function groundEdgeParts(
  width: number,
  depth: number,
  colors: GardenColors,
): readonly ScenePartDraft[] {
  const ridge = GROUND_SOIL_HEIGHT * 0.55;
  const thickness = GROUND_SOIL_HEIGHT;
  const outerWidth = width + thickness * HALF;
  const halfWidth = width / HALF + thickness / HALF;
  const halfDepth = depth / HALF + thickness / HALF;
  return [
    ...([halfDepth, -halfDepth] as const).map(
      (z): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [outerWidth, ridge, thickness],
        position: [0, GROUND_SOIL_HEIGHT + ridge / HALF, z],
        color: colors.fieldFurrow,
        roughness: SOIL_ROUGHNESS,
        flatShading: true,
      }),
    ),
    ...([halfWidth, -halfWidth] as const).map(
      (x): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [thickness, ridge, depth],
        position: [x, GROUND_SOIL_HEIGHT + ridge / HALF, 0],
        color: colors.fieldFurrow,
        roughness: SOIL_ROUGHNESS,
        flatShading: true,
      }),
    ),
  ];
}

/**
 * Un bac est un caisson de planches posé sur le terrain ; une parcelle en pleine
 * terre est une planche de terre travaillée, à peine surélevée et bordée d'un
 * bourrelet de terre.
 */
export function buildParcelParts(
  width: number,
  depth: number,
  kind: ParcelKind,
  colors: GardenColors,
  plankColor: string,
): ScenePart[] {
  const raised = kind === PARCEL_KIND.raised;
  const soilHeight = raised ? RAISED_HEIGHT : GROUND_SOIL_HEIGHT;
  return sceneParts(PARCEL_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width, soilHeight, depth],
      position: [0, soilHeight / HALF, 0],
      color: raised ? colors.bedSoil : colors.fieldSoil,
      roughness: SOIL_ROUGHNESS,
    },
    ...(raised
      ? raisedFrameParts(width, depth, colors, plankColor)
      : groundEdgeParts(width, depth, colors)),
  ]);
}

export function buildCellParts(
  width: number,
  depth: number,
  top: number,
  tileColor: string,
): ScenePart[] {
  const inset = Math.min(width, depth) * CELL_INSET_RATIO;
  return sceneParts(CELL_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width - inset, CELL_TILE_HEIGHT, depth - inset],
      position: [0, top + CELL_TILE_HEIGHT / HALF, 0],
      color: tileColor,
      roughness: SOIL_ROUGHNESS,
    },
  ]);
}

/**
 * Trame des cases, dessinée d'un seul tenant sur la parcelle : c'est ce qui rend
 * la grille lisible quand rien n'est encore semé.
 */
export function buildGridParts(
  width: number,
  depth: number,
  columns: number,
  rows: number,
  top: number,
  color: string,
): ScenePart[] {
  const cellWidth = width / columns;
  const cellDepth = depth / rows;
  const verticals = Array.from(
    { length: columns - 1 },
    (_, index): ScenePartDraft => ({
      geometry: SCENE_GEOMETRY.box,
      args: [GRID_LINE, GRID_LINE, depth],
      position: [(index + 1) * cellWidth - width / HALF, top + GRID_LINE, 0],
      color,
      roughness: SOIL_ROUGHNESS,
    }),
  );
  const horizontals = Array.from(
    { length: rows - 1 },
    (_, index): ScenePartDraft => ({
      geometry: SCENE_GEOMETRY.box,
      args: [width, GRID_LINE, GRID_LINE],
      position: [0, top + GRID_LINE, (index + 1) * cellDepth - depth / HALF],
      color,
      roughness: SOIL_ROUGHNESS,
    }),
  );
  return sceneParts(GRID_PREFIX, [...verticals, ...horizontals]);
}

/** Cadre posé autour d'une parcelle : survol, sélection, chevauchement. */
export function buildOutlineParts(
  width: number,
  depth: number,
  top: number,
  color: string,
): ScenePart[] {
  const halfWidth = width / HALF + OUTLINE_THICKNESS;
  const halfDepth = depth / HALF + OUTLINE_THICKNESS;
  const height = top + OUTLINE_LIFT;
  return sceneParts(OUTLINE_PREFIX, [
    ...([halfDepth, -halfDepth] as const).map(
      (z): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [width + OUTLINE_THICKNESS * HALF * HALF, OUTLINE_LIFT, OUTLINE_THICKNESS],
        position: [0, height, z],
        color,
        roughness: 0.4,
      }),
    ),
    ...([halfWidth, -halfWidth] as const).map(
      (x): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.box,
        args: [OUTLINE_THICKNESS, OUTLINE_LIFT, depth + OUTLINE_THICKNESS * HALF * HALF],
        position: [x, height, 0],
        color,
        roughness: 0.4,
      }),
    ),
  ]);
}

const PLATEAU_PREFIX = 'plateau';
const HANDLE_PREFIX = 'handle';
const PLATEAU_STEP = 0.25;
const PLATEAU_LINE = 0.012;
const PLATEAU_LIFT = 0.006;
const HANDLE_RADIUS = 0.24;
const HANDLE_TUBE = 0.035;
const HANDLE_ARC_RATIO = 0.78;
const HANDLE_ARROW = 0.09;
const QUARTER_TURN = Math.PI / 2;

/** Trame d'aide au placement, alignée sur le pas d'aimantation des parcelles. */
export function buildPlateauGridParts(width: number, depth: number, color: string): ScenePart[] {
  const columns = Math.floor(width / PLATEAU_STEP);
  const rows = Math.floor(depth / PLATEAU_STEP);
  const verticals = Array.from(
    { length: columns + 1 },
    (_, index): ScenePartDraft => ({
      geometry: SCENE_GEOMETRY.box,
      args: [PLATEAU_LINE, PLATEAU_LINE, depth],
      position: [index * PLATEAU_STEP - (columns * PLATEAU_STEP) / HALF, PLATEAU_LIFT, 0],
      color,
      roughness: SOIL_ROUGHNESS,
    }),
  );
  const horizontals = Array.from(
    { length: rows + 1 },
    (_, index): ScenePartDraft => ({
      geometry: SCENE_GEOMETRY.box,
      args: [width, PLATEAU_LINE, PLATEAU_LINE],
      position: [0, PLATEAU_LIFT, index * PLATEAU_STEP - (rows * PLATEAU_STEP) / HALF],
      color,
      roughness: SOIL_ROUGHNESS,
    }),
  );
  return sceneParts(PLATEAU_PREFIX, [...verticals, ...horizontals]);
}

/**
 * Symbole de rotation flottant au-dessus d'une parcelle : un arc fléché qui
 * signale qu'un quart de tour part au prochain appui.
 */
export function buildRotateHandleParts(color: string): ScenePart[] {
  return sceneParts(HANDLE_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.torus,
      args: [HANDLE_RADIUS, HANDLE_TUBE, 8, 28, Math.PI * 2 * HANDLE_ARC_RATIO],
      position: [0, 0, 0],
      rotation: [QUARTER_TURN, 0, 0],
      color,
      roughness: 0.35,
    },
    {
      geometry: SCENE_GEOMETRY.cone,
      args: [HANDLE_ARROW, HANDLE_ARROW * 2, 10],
      position: [HANDLE_RADIUS, 0, 0],
      rotation: [0, 0, -QUARTER_TURN],
      color,
      roughness: 0.35,
    },
  ]);
}

const GUIDE_PREFIX = 'guide';
const GUIDE_THICKNESS = 0.09;
const GUIDE_LIFT = 0.5;

/** Repère d'alignement affiché pendant un déplacement, façon règle de montage. */
export function buildGuideParts(
  along: 'x' | 'z',
  value: number,
  span: number,
  color: string,
): ScenePart[] {
  const horizontal = along === 'x';
  return sceneParts(`${GUIDE_PREFIX}-${along}`, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: horizontal
        ? [GUIDE_THICKNESS, GUIDE_THICKNESS, span]
        : [span, GUIDE_THICKNESS, GUIDE_THICKNESS],
      position: horizontal ? [value, GUIDE_LIFT, 0] : [0, GUIDE_LIFT, value],
      color,
      roughness: 0.2,
    },
  ]);
}

const EDGE_PREFIX = 'edge';
const EDGE_HEIGHT = 0.05;

/** Poignée posée le long d'un bord de parcelle : elle cible une ligne ou une colonne. */
export function buildEdgeParts(
  width: number,
  depth: number,
  top: number,
  color: string,
): ScenePart[] {
  return sceneParts(EDGE_PREFIX, [
    {
      geometry: SCENE_GEOMETRY.box,
      args: [width, EDGE_HEIGHT, depth],
      position: [0, top + EDGE_HEIGHT / HALF, 0],
      color,
      roughness: 0.5,
    },
  ]);
}
