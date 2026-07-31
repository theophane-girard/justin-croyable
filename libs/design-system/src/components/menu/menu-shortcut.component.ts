import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { menuShortcutVariants } from './menu.variants';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-menu-shortcut, [app-menu-shortcut]',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appMenuShortcut',
})
export class MenuShortcutComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(menuShortcutVariants(), this.class()));
}
