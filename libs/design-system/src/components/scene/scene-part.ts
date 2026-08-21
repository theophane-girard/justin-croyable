export const SCENE_GEOMETRY = {
  box: 'box',
  sphere: 'sphere',
  cylinder: 'cylinder',
  cone: 'cone',
  capsule: 'capsule',
  torus: 'torus',
  circle: 'circle',
  ring: 'ring',
  icosahedron: 'icosahedron',
} as const;

export type SceneGeometry = (typeof SCENE_GEOMETRY)[keyof typeof SCENE_GEOMETRY];

export type SceneVector = [number, number, number];

export type SceneBounds = {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
};

export type ScenePart = {
  readonly id: string;
  readonly geometry: SceneGeometry;
  readonly args: number[];
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly scale: SceneVector;
  readonly color: string;
  readonly roughness: number;
  readonly flatShading: boolean;
};

export type ScenePartDraft = {
  readonly geometry: SceneGeometry;
  readonly args: number[];
  readonly color: string;
  readonly position?: SceneVector;
  readonly rotation?: SceneVector;
  readonly scale?: SceneVector;
  readonly roughness?: number;
  readonly flatShading?: boolean;
};

const ORIGIN: SceneVector = [0, 0, 0];
const UNIT_SCALE: SceneVector = [1, 1, 1];
const DEFAULT_ROUGHNESS = 0.85;
const ID_SEPARATOR = '-';
const NOISE_MULTIPLIER = 12.9898;
const NOISE_AMPLITUDE = 43758.5453;

export function scenePart(id: string, draft: ScenePartDraft): ScenePart {
  return {
    id,
    geometry: draft.geometry,
    args: draft.args,
    position: draft.position ?? ORIGIN,
    rotation: draft.rotation ?? ORIGIN,
    scale: draft.scale ?? UNIT_SCALE,
    color: draft.color,
    roughness: draft.roughness ?? DEFAULT_ROUGHNESS,
    flatShading: draft.flatShading ?? false,
  };
}

export function sceneParts(prefix: string, drafts: readonly ScenePartDraft[]): ScenePart[] {
  return drafts.map((draft, index) => scenePart(`${prefix}${ID_SEPARATOR}${index}`, draft));
}

export function sceneNoise(seed: number): number {
  const noise = Math.sin(seed * NOISE_MULTIPLIER) * NOISE_AMPLITUDE;
  return noise - Math.floor(noise);
}

export function sceneNoiseRange(seed: number, minimum: number, maximum: number): number {
  return minimum + sceneNoise(seed) * (maximum - minimum);
}
