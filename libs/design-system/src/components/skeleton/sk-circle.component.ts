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
  selector: 'sk-circle',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    '[class]': 'classes()',
  },
})
export class SkCircleComponent {
  readonly size = input<ClassValue>('size-10');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(skeletonShimmerVariants(), 'block shrink-0 rounded-full', this.size(), this.class()),
  );
}
