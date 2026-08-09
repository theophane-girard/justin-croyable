import type { ActivatedRouteSnapshot } from '@angular/router';

import { type SkeletonKind, SKELETON_ROUTE_DATA_KEY } from './skeleton-kind';

function ownSkeletonKind(route: ActivatedRouteSnapshot): SkeletonKind | null {
  const value = route.data[SKELETON_ROUTE_DATA_KEY];
  return typeof value === 'string' && value.length > 0 ? (value as SkeletonKind) : null;
}

export function deepestSkeletonKind(route: ActivatedRouteSnapshot | null): SkeletonKind | null {
  if (!route) {
    return null;
  }
  const childKind = deepestSkeletonKind(route.firstChild);
  if (childKind) {
    return childKind;
  }
  return ownSkeletonKind(route);
}
