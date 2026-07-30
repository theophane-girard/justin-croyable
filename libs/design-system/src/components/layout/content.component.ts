import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { contentVariants } from './layout.variants';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-content',
  template: `
    <main class="flex min-h-0 flex-1 flex-col">
      <ng-content />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class ContentComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(contentVariants(), this.class()));
}
