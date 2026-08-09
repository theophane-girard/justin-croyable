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
  selector: 'app-dashboard-skeleton',
  imports: [SkLineComponent, SkBlockComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-col gap-2">
        <sk-line height="h-7" width="w-48" />
        <sk-line height="h-4" width="w-72" />
      </div>
      <div class="flex items-center gap-2">
        <sk-block height="h-9" rounded="rounded-md" class="w-28" />
        <sk-block height="h-9" rounded="rounded-md" class="w-28" />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (stat of statList(); track $index) {
        <sk-block height="h-24" rounded="rounded-xl" />
      }
    </div>

    @for (chart of chartList(); track $index) {
      <sk-block height="h-72" rounded="rounded-xl" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex flex-col gap-4',
  },
})
export class DashboardSkeletonComponent {
  readonly statCount = input<number>(4);
  readonly chartCount = input<number>(1);

  protected readonly statList = computed(() => range(this.statCount()));
  protected readonly chartList = computed(() => range(this.chartCount()));
}
