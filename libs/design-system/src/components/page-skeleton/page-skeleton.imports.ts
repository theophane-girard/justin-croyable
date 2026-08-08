import { DashboardPageSkeletonComponent } from './dashboard-page-skeleton.component';
import { DetailPageSkeletonComponent } from './detail-page-skeleton.component';
import { FormPageSkeletonComponent } from './form-page-skeleton.component';
import { GridPageSkeletonComponent } from './grid-page-skeleton.component';
import { PageHeaderSkeletonComponent } from './page-header-skeleton.component';
import { TablePageSkeletonComponent } from './table-page-skeleton.component';

export const PageSkeletonImports = [
  PageHeaderSkeletonComponent,
  DashboardPageSkeletonComponent,
  TablePageSkeletonComponent,
  GridPageSkeletonComponent,
  FormPageSkeletonComponent,
  DetailPageSkeletonComponent,
] as const;
