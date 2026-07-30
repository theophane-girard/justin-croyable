import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { badgeVariants, type BadgeShapeVariants, type BadgeTypeVariants } from './badge.variants';

@Component({
  selector: 'app-badge',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'badge',
})
export class BadgeComponent {
  readonly type = input<BadgeTypeVariants>('default');
  readonly shape = input<BadgeShapeVariants>('default');

  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(badgeVariants({ type: this.type(), shape: this.shape() }), this.class()),
  );
}
