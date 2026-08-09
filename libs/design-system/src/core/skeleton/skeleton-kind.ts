export interface SkeletonKindMap {
  generic: unknown;
  list: unknown;
  detail: unknown;
  dashboard: unknown;
  map: unknown;
  form: unknown;
  grid: unknown;
}

export type SkeletonKind = keyof SkeletonKindMap & string;

export const SKELETON_KIND = {
  generic: 'generic',
  list: 'list',
  detail: 'detail',
  dashboard: 'dashboard',
  map: 'map',
  form: 'form',
  grid: 'grid',
} as const satisfies Record<SkeletonKind, SkeletonKind>;

export const SKELETON_ROUTE_DATA_KEY = 'skeleton';
