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
import { pageSkeletonTileGridVariants } from './page-skeleton.variants';

@Component({
  selector: 'app-grid-page-skeleton',
  imports: [SkeletonComponent, PageHeaderSkeletonComponent],
  template: `
    <app-page-header-skeleton [descriptionLines]="2" />

    <div [class]="tileGridClasses">
      @for (tile of tileList(); track $index) {
        <app-skeleton class="aspect-square rounded-xl" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class GridPageSkeletonComponent {
  readonly tileCount = input<number>(12);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses('flex flex-col gap-6', this.class()));
  protected readonly tileGridClasses = pageSkeletonTileGridVariants();
  protected readonly tileList = computed(() => range(this.tileCount()));
}
