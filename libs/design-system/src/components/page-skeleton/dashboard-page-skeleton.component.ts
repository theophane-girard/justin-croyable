import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { range } from '../../utils/array';
import { mergeClasses } from '../../utils/merge-classes';
import { SkeletonComponent } from '../skeleton/skeleton.component';

import { PageHeaderSkeletonComponent } from './page-header-skeleton.component';
import {
  pageSkeletonStatGridVariants,
  pageSkeletonStatTileVariants,
  pageSkeletonVariants,
} from './page-skeleton.variants';

@Component({
  selector: 'app-dashboard-page-skeleton',
  imports: [SkeletonComponent, PageHeaderSkeletonComponent],
  template: `
    <app-page-header-skeleton [withActions]="true" />

    <div [class]="statGridClasses">
      @for (stat of statList(); track $index) {
        <app-skeleton [class]="statTileClasses" />
      }
    </div>

    @for (chart of chartList(); track $index) {
      <app-skeleton class="h-72 rounded-xl" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class DashboardPageSkeletonComponent {
  readonly statCount = input<number>(4);
  readonly chartCount = input<number>(1);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(pageSkeletonVariants(), this.class()));
  protected readonly statGridClasses = pageSkeletonStatGridVariants({ columns: 'four' });
  protected readonly statTileClasses = pageSkeletonStatTileVariants();
  protected readonly statList = computed(() => range(this.statCount()));
  protected readonly chartList = computed(() => range(this.chartCount()));
}
