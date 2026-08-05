import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { sidebarItemVariants } from './layout.variants';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'button[appSidebarItem], a[appSidebarItem]',
  imports: [NgIcon],
  template: `
    @let iconName = icon();
    @if (iconName) {
      <ng-icon [name]="iconName" class="size-4 shrink-0" />
    }
    <span [class.hidden]="collapsed()">{{ label() }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[class.justify-center]': 'collapsed()',
    '[attr.title]': "collapsed() ? label() : null",
    '[attr.aria-current]': "active() ? 'page' : null",
  },
  exportAs: 'sidebarItem',
})
export class SidebarItemComponent {
  readonly icon = input<string>();
  readonly label = input<string>('');
  readonly active = input(false, { transform: booleanAttribute });
  readonly collapsed = input(false, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(sidebarItemVariants({ active: this.active() }), this.class()),
  );
}
