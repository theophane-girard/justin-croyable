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
  selector: 'app-list-skeleton',
  imports: [SkLineComponent, SkBlockComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-col gap-2">
        <sk-line height="h-7" width="w-40" />
        <sk-line height="h-4" width="w-64" />
      </div>
      <div class="flex items-center gap-2">
        <sk-block height="h-9" rounded="rounded-md" class="w-24" />
        <sk-block height="h-9" rounded="rounded-md" class="w-24" />
      </div>
    </div>

    <div class="border-border flex flex-col gap-3 rounded-xl border p-4">
      <sk-block height="h-9" rounded="rounded-md" />
      @for (row of rowList(); track $index) {
        <sk-block height="h-10" rounded="rounded-md" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex flex-col gap-4',
  },
})
export class ListSkeletonComponent {
  readonly rowCount = input<number>(8);

  protected readonly rowList = computed(() => range(this.rowCount()));
}
