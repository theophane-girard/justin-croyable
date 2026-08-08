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

import { pageSkeletonCenteredVariants } from './page-skeleton.variants';

@Component({
  selector: 'app-detail-page-skeleton',
  imports: [SkeletonComponent],
  template: `
    <app-skeleton class="h-8 w-32 rounded-md" />

    <div class="border-border flex flex-col overflow-hidden rounded-3xl border">
      <div class="bg-muted flex items-end justify-between gap-4 p-6">
        <div class="flex flex-col gap-2">
          <app-skeleton class="h-4 w-16" />
          <app-skeleton class="h-8 w-40" />
          <div class="flex gap-1.5">
            <app-skeleton class="h-5 w-16 rounded-full" />
            <app-skeleton class="h-5 w-16 rounded-full" />
          </div>
        </div>
        <app-skeleton class="size-32 rounded-2xl" />
      </div>

      <div class="flex flex-col gap-5 p-4 sm:p-6">
        @for (section of sectionList(); track $index) {
          <div class="flex flex-col gap-2">
            <app-skeleton class="h-4 w-32" />
            <app-skeleton class="h-20 w-full rounded-lg" />
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class DetailPageSkeletonComponent {
  readonly sectionCount = input<number>(3);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(pageSkeletonCenteredVariants({ width: 'detail' }), this.class()),
  );
  protected readonly sectionList = computed(() => range(this.sectionCount()));
}
