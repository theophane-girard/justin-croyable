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

import { SkLineComponent } from './sk-line.component';

@Component({
  selector: 'sk-text',
  imports: [SkLineComponent],
  template: `
    @for (width of lineWidths(); track $index) {
      <sk-line [height]="lineHeight()" [width]="width" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    '[class]': 'classes()',
  },
})
export class SkTextComponent {
  readonly lines = input<number>(3);
  readonly lineHeight = input<ClassValue>('h-4');
  readonly lastLineWidth = input<ClassValue>('w-2/3');
  readonly gap = input<ClassValue>('gap-2');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses('flex flex-col', this.gap(), this.class()),
  );

  protected readonly lineWidths = computed<ClassValue[]>(() => {
    const total = this.lines();
    const lastWidth = this.lastLineWidth();
    return range(total).map(index => (index === total - 1 ? lastWidth : 'w-full'));
  });
}
