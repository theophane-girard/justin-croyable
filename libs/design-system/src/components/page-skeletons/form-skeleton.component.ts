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
  selector: 'app-form-skeleton',
  imports: [SkLineComponent, SkBlockComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-col gap-2">
        <sk-line height="h-7" width="w-44" />
        <sk-line height="h-4" width="w-64" />
      </div>
      <div class="flex items-center gap-2">
        <sk-block height="h-9" rounded="rounded-md" class="w-24" />
        <sk-block height="h-9" rounded="rounded-md" class="w-28" />
      </div>
    </div>

    <div class="border-border rounded-xl border p-4">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        @for (field of fieldList(); track $index) {
          <div class="flex flex-col gap-2">
            <sk-line height="h-4" width="w-24" />
            <sk-block height="h-9" rounded="rounded-md" />
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'mx-auto flex w-full max-w-2xl flex-col gap-4',
  },
})
export class FormSkeletonComponent {
  readonly fieldCount = input<number>(4);

  protected readonly fieldList = computed(() => range(this.fieldCount()));
}
