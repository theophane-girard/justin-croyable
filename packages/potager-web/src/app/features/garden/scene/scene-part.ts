export const PART_GEOMETRY = {
  box: 'box',
  sphere: 'sphere',
  cylinder: 'cylinder',
  cone: 'cone',
  capsule: 'capsule',
  torus: 'torus',
  circle: 'circle',
  icosahedron: 'icosahedron',
} as const;

export type PartGeometry = (typeof PART_GEOMETRY)[keyof typeof PART_GEOMETRY];

export type SceneVector = [number, number, number];

export type ScenePart = {
  readonly id: string;
  readonly geometry: PartGeometry;
  readonly args: number[];
  readonly position: SceneVector;
  readonly rotation: SceneVector;
  readonly scale: SceneVector;
  readonly color: string;
  readonly roughness: number;
  readonly flatShading: boolean;
};

export type ScenePartDraft = {
  readonly geometry: PartGeometry;
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

export function hashUnit(seed: number): number {
  const noise = Math.sin(seed * 12.9898) * 43758.5453;
  return noise - Math.floor(noise);
}

export function hashRange(seed: number, minimum: number, maximum: number): number {
  return minimum + hashUnit(seed) * (maximum - minimum);
}
