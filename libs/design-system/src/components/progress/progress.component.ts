import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { progressVariants } from './progress.variants';

@Component({
  selector: 'app-progress',
  template: `
    <div
      data-slot="progress-indicator"
      class="bg-primary size-full flex-1 rounded-full transition-transform duration-700 ease-out"
      [style.transform]="indicatorTransform()"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'progress',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'clampedValue()',
    '[class]': 'classes()',
  },
  exportAs: 'appProgress',
})
export class ProgressComponent {
  readonly value = input(0);
  readonly class = input<ClassValue>('');

  private readonly hasEnteredView = signal(false);

  constructor() {
    afterNextRender(() => this.hasEnteredView.set(true));
  }

  protected readonly clampedValue = computed(() => {
    const v = this.value();
    if (v > 100) return 100;
    if (v < 0) return 0;
    return v;
  });

  protected readonly renderedValue = computed(() => (this.hasEnteredView() ? this.clampedValue() : 0));

  protected readonly indicatorTransform = computed(() => `translateX(-${100 - this.renderedValue()}%)`);

  protected readonly classes = computed(() => mergeClasses(progressVariants(), this.class()));
}
