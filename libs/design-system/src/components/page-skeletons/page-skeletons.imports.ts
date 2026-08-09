import { DashboardSkeletonComponent } from './dashboard-skeleton.component';
import { DetailSkeletonComponent } from './detail-skeleton.component';
import { FormSkeletonComponent } from './form-skeleton.component';
import { GenericSkeletonComponent } from './generic-skeleton.component';
import { GridSkeletonComponent } from './grid-skeleton.component';
import { ListSkeletonComponent } from './list-skeleton.component';
import { MapSkeletonComponent } from './map-skeleton.component';

export const PageSkeletonImports = [
  GenericSkeletonComponent,
  ListSkeletonComponent,
  DetailSkeletonComponent,
  DashboardSkeletonComponent,
  MapSkeletonComponent,
  FormSkeletonComponent,
  GridSkeletonComponent,
] as const;
