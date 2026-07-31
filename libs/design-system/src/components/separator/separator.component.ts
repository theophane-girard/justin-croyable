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

import { separatorVariants, type SeparatorVariants } from './separator.variants';

@Component({
  selector: 'app-separator',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'separator',
    '[attr.data-orientation]': 'orientation()',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-orientation]': '!decorative() && orientation() === "vertical" ? "vertical" : null',
    '[class]': 'classes()',
  },
  exportAs: 'appSeparator',
})
export class SeparatorComponent {
  readonly orientation = input<SeparatorVariants['orientation']>('horizontal');
  readonly decorative = input(true, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  // shadcn/ui uses div through SeparatorPrimitive. We don't use div, so we need to add 'block' class
  // to make it match shadcn/ui styling
  protected readonly classes = computed(() => mergeClasses(separatorVariants(), 'block', this.class()));
}
