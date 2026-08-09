import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { skeletonShimmerVariants } from './skeleton.variants';

@Component({
  selector: 'sk-line',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    '[class]': 'classes()',
  },
})
export class SkLineComponent {
  readonly width = input<ClassValue>('w-full');
  readonly height = input<ClassValue>('h-4');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(skeletonShimmerVariants(), 'block rounded', this.width(), this.height(), this.class()),
  );
}
