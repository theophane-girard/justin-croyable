import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { range } from '../../utils/array';
import { SkBlockComponent } from '../skeleton/sk-block.component';
import { SkCircleComponent } from '../skeleton/sk-circle.component';
import { SkLineComponent } from '../skeleton/sk-line.component';
import { SkTextComponent } from '../skeleton/sk-text.component';

@Component({
  selector: 'app-detail-skeleton',
  imports: [SkLineComponent, SkTextComponent, SkBlockComponent, SkCircleComponent],
  template: `
    <sk-block height="h-8" rounded="rounded-md" class="w-32" />

    <div class="border-border flex flex-col overflow-hidden rounded-3xl border">
      <div class="bg-muted flex items-end justify-between gap-4 p-6">
        <div class="flex flex-col gap-2">
          <sk-line height="h-4" width="w-16" />
          <sk-line height="h-8" width="w-40" />
          <div class="flex gap-1.5">
            <sk-block height="h-5" rounded="rounded-full" class="w-16" />
            <sk-block height="h-5" rounded="rounded-full" class="w-16" />
          </div>
        </div>
        <sk-circle size="size-32" class="rounded-2xl" />
      </div>

      <div class="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 sm:p-6">
        @for (section of sectionList(); track $index) {
          <div class="flex flex-col gap-2">
            <sk-line height="h-4" width="w-32" />
            <sk-text [lines]="3" />
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'mx-auto flex w-full max-w-3xl flex-col gap-4',
  },
})
export class DetailSkeletonComponent {
  readonly sectionCount = input<number>(4);

  protected readonly sectionList = computed(() => range(this.sectionCount()));
}
