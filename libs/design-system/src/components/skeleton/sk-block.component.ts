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
  selector: 'sk-block',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    '[class]': 'classes()',
  },
})
export class SkBlockComponent {
  readonly height = input<ClassValue>('h-24');
  readonly rounded = input<ClassValue>('rounded-lg');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(skeletonShimmerVariants(), 'block w-full', this.height(), this.rounded(), this.class()),
  );
}
