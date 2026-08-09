import { type EnvironmentProviders, makeEnvironmentProviders, type Type } from '@angular/core';

import {
  DEFAULT_APPEAR_DELAY_MS,
  DEFAULT_MIN_VISIBLE_MS,
  ROUTE_SKELETON_CONFIG,
  ROUTE_SKELETON_REGISTRY,
  type RouteSkeletonRegistry,
} from './route-skeleton.tokens';

export interface ProvideRouteSkeletonsOptions {
  readonly registry?: RouteSkeletonRegistry;
  readonly fallback?: Type<unknown> | null;
  readonly appearDelayMs?: number;
  readonly minVisibleMs?: number;
}

export function provideRouteSkeletons(
  options: ProvideRouteSkeletonsOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ROUTE_SKELETON_CONFIG,
      useValue: {
        appearDelayMs: options.appearDelayMs ?? DEFAULT_APPEAR_DELAY_MS,
        minVisibleMs: options.minVisibleMs ?? DEFAULT_MIN_VISIBLE_MS,
        fallback: options.fallback ?? null,
      },
    },
    {
      provide: ROUTE_SKELETON_REGISTRY,
      useValue: options.registry ?? {},
      multi: true,
    },
  ]);
}

export function provideRouteSkeletonKinds(registry: RouteSkeletonRegistry): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ROUTE_SKELETON_REGISTRY,
      useValue: registry,
      multi: true,
    },
  ]);
}
