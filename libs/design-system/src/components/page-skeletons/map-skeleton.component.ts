import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { range } from '../../utils/array';
import { SkBlockComponent } from '../skeleton/sk-block.component';
import { SkLineComponent } from '../skeleton/sk-line.component';

@Component({
  selector: 'app-map-skeleton',
  imports: [SkLineComponent, SkBlockComponent],
  template: `
    <div class="flex min-h-0 flex-1 gap-4">
      <div class="relative min-h-0 flex-1">
        <sk-block height="h-full" rounded="rounded-xl" />
        <div class="absolute right-3 top-3 flex flex-col gap-2">
          <sk-block height="h-8" rounded="rounded-md" class="w-8" />
          <sk-block height="h-8" rounded="rounded-md" class="w-8" />
        </div>
      </div>

      <div class="hidden w-72 shrink-0 flex-col gap-3 md:flex">
        <sk-line height="h-6" width="w-40" />
        @for (item of itemList(); track $index) {
          <div class="border-border flex flex-col gap-2 rounded-xl border p-3">
            <sk-line height="h-4" width="w-32" />
            <sk-line height="h-3" width="w-full" />
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex h-full min-h-0 flex-col',
  },
})
export class MapSkeletonComponent {
  readonly itemCount = input<number>(5);

  protected readonly itemList = computed(() => range(this.itemCount()));
}
