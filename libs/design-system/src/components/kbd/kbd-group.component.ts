import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { type ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { kbdGroupVariants } from './kbd.variants';

@Component({
  selector: 'app-kbd-group, [app-kbd-group]',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    'data-slot': 'kbd-group',
  },
  exportAs: 'appKbdGroup',
})
export class KbdGroupComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(kbdGroupVariants(), this.class()));
}
