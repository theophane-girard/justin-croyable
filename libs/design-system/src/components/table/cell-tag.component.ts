import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { BadgeComponent } from '../badge';

import { cellTagVariants, type CellTagColor } from './cell-tag.variants';

@Component({
  selector: 'app-cell-tag',
  imports: [BadgeComponent, NgIcon],
  template: `
    <app-badge shape="pill" [class]="tagClasses()">
      @if (icon(); as iconName) {
        <ng-icon [name]="iconName" class="size-3 shrink-0" aria-hidden="true" />
      }
      <span class="truncate">{{ label() }}</span>
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appCellTag',
})
export class CellTagComponent {
  readonly label = input<string>('');
  readonly icon = input<string | null>(null);
  readonly color = input<CellTagColor>('neutral');
  readonly class = input<ClassValue>('');

  protected readonly tagClasses = computed(() => cellTagVariants({ color: this.color() }));
  protected readonly classes = computed(() =>
    mergeClasses('inline-flex min-w-0 max-w-full', this.class()),
  );
}
