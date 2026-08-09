import type { RouteSkeletonRegistry } from '../../core/skeleton/route-skeleton.tokens';

import { DashboardSkeletonComponent } from './dashboard-skeleton.component';
import { DetailSkeletonComponent } from './detail-skeleton.component';
import { FormSkeletonComponent } from './form-skeleton.component';
import { GenericSkeletonComponent } from './generic-skeleton.component';
import { GridSkeletonComponent } from './grid-skeleton.component';
import { ListSkeletonComponent } from './list-skeleton.component';
import { MapSkeletonComponent } from './map-skeleton.component';

export const DEFAULT_ROUTE_SKELETONS: RouteSkeletonRegistry = {
  generic: GenericSkeletonComponent,
  list: ListSkeletonComponent,
  detail: DetailSkeletonComponent,
  dashboard: DashboardSkeletonComponent,
  map: MapSkeletonComponent,
  form: FormSkeletonComponent,
  grid: GridSkeletonComponent,
};
