import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { dividerVariants, type DividerVariants } from './divider.variants';

@Component({
  selector: 'app-divider',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.role]': `'separator'`,
    '[attr.aria-orientation]': 'orientation()',
    '[class]': 'classes()',
  },
})
export class DividerComponent {
  readonly orientation = input<DividerVariants['orientation']>('horizontal');
  readonly spacing = input<DividerVariants['spacing']>('default');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      dividerVariants({
        orientation: this.orientation(),
        spacing: this.spacing(),
      }),
      this.class(),
    ),
  );
}
