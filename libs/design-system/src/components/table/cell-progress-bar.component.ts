import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { ProgressComponent } from '../progress';

import { cellProgressBarVariants, type CellProgressBarColor } from './cell-progress-bar.variants';

@Component({
  selector: 'app-cell-progress-bar',
  imports: [ProgressComponent],
  template: `
    @if (showValue()) {
      <span class="text-muted-foreground text-center text-xs tabular-nums">
        {{ displayValue() }}
      </span>
    }
    <app-progress [value]="value()" [class]="progressClasses()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appCellProgressBar',
})
export class CellProgressBarComponent {
  readonly value = input<number>(0);
  readonly color = input<CellProgressBarColor>('primary');
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  protected readonly clampedValue = computed(() => {
    const current = this.value();
    if (current > 100) return 100;
    if (current < 0) return 0;
    return current;
  });

  protected readonly displayValue = computed(() => `${Math.round(this.clampedValue())}%`);

  protected readonly progressClasses = computed(() =>
    mergeClasses('h-2 w-full', cellProgressBarVariants({ color: this.color() })),
  );

  protected readonly classes = computed(() =>
    mergeClasses('flex w-full flex-col items-center justify-center gap-1', this.class()),
  );
}
