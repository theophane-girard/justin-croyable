import { computed, inject, Injectable, type Type } from '@angular/core';

import type { SkeletonKind } from './skeleton-kind';
import {
  ROUTE_SKELETON_CONFIG,
  ROUTE_SKELETON_REGISTRY,
  type RouteSkeletonRegistry,
} from './route-skeleton.tokens';

@Injectable({ providedIn: 'root' })
export class RouteSkeletonRegistryService {
  readonly #registries = inject(ROUTE_SKELETON_REGISTRY, { optional: true }) ?? [];
  readonly #config = inject(ROUTE_SKELETON_CONFIG);

  readonly #merged = computed<RouteSkeletonRegistry>(() =>
    this.#registries.reduce<RouteSkeletonRegistry>((merged, registry) => ({ ...merged, ...registry }), {}),
  );

  resolve(kind: SkeletonKind | null): Type<unknown> | null {
    const registry = this.#merged();
    if (kind !== null && registry[kind]) {
      return registry[kind] ?? this.#config.fallback;
    }
    return this.#config.fallback;
  }
}
