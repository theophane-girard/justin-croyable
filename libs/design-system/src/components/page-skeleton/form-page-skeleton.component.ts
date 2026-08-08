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
import { pageSkeletonCenteredVariants } from './page-skeleton.variants';

@Component({
  selector: 'app-form-page-skeleton',
  imports: [SkeletonComponent, PageHeaderSkeletonComponent],
  template: `
    <app-page-header-skeleton [withActions]="true" [actionCount]="2" />

    <div class="border-border flex flex-col gap-5 rounded-xl border p-4">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        @for (field of fieldList(); track $index) {
          <div class="flex flex-col gap-2">
            <app-skeleton class="h-4 w-24" />
            <app-skeleton class="h-9 w-full rounded-md" />
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
export class FormPageSkeletonComponent {
  readonly fieldCount = input<number>(4);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(pageSkeletonCenteredVariants({ width: 'form' }), this.class()),
  );
  protected readonly fieldList = computed(() => range(this.fieldCount()));
}
