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
  pageSkeletonBlockVariants,
  pageSkeletonStatGridVariants,
  pageSkeletonStatTileVariants,
  pageSkeletonVariants,
} from './page-skeleton.variants';

@Component({
  selector: 'app-table-page-skeleton',
  imports: [SkeletonComponent, PageHeaderSkeletonComponent],
  template: `
    <app-page-header-skeleton [withActions]="true" />

    @if (statCount() > 0) {
      <div [class]="statGridClasses">
        @for (stat of statList(); track $index) {
          <app-skeleton [class]="statTileClasses" />
        }
      </div>
    }

    <div [class]="blockClasses">
      <app-skeleton class="h-9 w-full rounded-md" />
      @for (row of rowList(); track $index) {
        <app-skeleton class="h-10 w-full rounded-md" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class TablePageSkeletonComponent {
  readonly statCount = input<number>(0);
  readonly rowCount = input<number>(8);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(pageSkeletonVariants(), this.class()));
  protected readonly statGridClasses = pageSkeletonStatGridVariants({ columns: 'three' });
  protected readonly statTileClasses = pageSkeletonStatTileVariants();
  protected readonly blockClasses = pageSkeletonBlockVariants();
  protected readonly statList = computed(() => range(this.statCount()));
  protected readonly rowList = computed(() => range(this.rowCount()));
}
