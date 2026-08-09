import { InjectionToken, type Type } from '@angular/core';

import type { SkeletonKind } from './skeleton-kind';

export type RouteSkeletonRegistry = Partial<Record<SkeletonKind, Type<unknown>>>;

export interface RouteSkeletonConfig {
  readonly appearDelayMs: number;
  readonly minVisibleMs: number;
  readonly fallback: Type<unknown> | null;
}

export const DEFAULT_APPEAR_DELAY_MS = 120;
export const DEFAULT_MIN_VISIBLE_MS = 400;

export const ROUTE_SKELETON_CONFIG = new InjectionToken<RouteSkeletonConfig>(
  'ROUTE_SKELETON_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      appearDelayMs: DEFAULT_APPEAR_DELAY_MS,
      minVisibleMs: DEFAULT_MIN_VISIBLE_MS,
      fallback: null,
    }),
  },
);

export const ROUTE_SKELETON_REGISTRY = new InjectionToken<RouteSkeletonRegistry[]>(
  'ROUTE_SKELETON_REGISTRY',
);
