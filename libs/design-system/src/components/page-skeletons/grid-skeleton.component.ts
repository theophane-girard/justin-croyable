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
  selector: 'app-grid-skeleton',
  imports: [SkLineComponent, SkBlockComponent],
  template: `
    <div class="flex flex-col gap-2">
      <sk-line height="h-7" width="w-48" />
      <sk-line height="h-4" width="w-80" />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      @for (tile of tileList(); track $index) {
        <sk-block height="h-32" rounded="rounded-xl" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex flex-col gap-6',
  },
})
export class GridSkeletonComponent {
  readonly tileCount = input<number>(12);

  protected readonly tileList = computed(() => range(this.tileCount()));
}
