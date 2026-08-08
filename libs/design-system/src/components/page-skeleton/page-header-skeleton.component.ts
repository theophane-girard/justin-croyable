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

@Component({
  selector: 'app-page-header-skeleton',
  imports: [SkeletonComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-col gap-2">
        <app-skeleton class="h-7 w-48" />
        @for (line of descriptionLineList(); track $index) {
          <app-skeleton class="h-4 w-72 max-w-full" />
        }
      </div>
      @if (withActions()) {
        <div class="flex items-center gap-2">
          @for (action of actionList(); track $index) {
            <app-skeleton class="h-9 w-24 rounded-md" />
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class PageHeaderSkeletonComponent {
  readonly descriptionLines = input<number>(1);
  readonly withActions = input<boolean>(false);
  readonly actionCount = input<number>(2);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses('block', this.class()));
  protected readonly descriptionLineList = computed(() => range(this.descriptionLines()));
  protected readonly actionList = computed(() => range(this.actionCount()));
}
