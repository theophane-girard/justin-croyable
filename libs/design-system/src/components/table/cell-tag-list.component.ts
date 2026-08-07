import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { BadgeComponent } from '../badge';
import { TooltipDirective } from '../tooltip';

import { CellTagComponent } from './cell-tag.component';
import { type CellTagColor } from './cell-tag.variants';

export interface CellTagListItem {
  readonly label: string;
  readonly color?: CellTagColor;
  readonly icon?: string | null;
}

@Component({
  selector: 'app-cell-tag-list',
  imports: [CellTagComponent, BadgeComponent, TooltipDirective],
  template: `
    @for (item of visibleItems(); track $index) {
      <app-cell-tag
        [label]="item.label"
        [color]="item.color ?? 'neutral'"
        [icon]="item.icon ?? null"
      />
    }
    @if (overflowCount() > 0) {
      <app-badge
        shape="pill"
        type="outline"
        class="shrink-0 cursor-default"
        [appTooltip]="overflowLabels()"
      >
        +{{ overflowCount() }}
      </app-badge>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appCellTagList',
})
export class CellTagListComponent {
  readonly items = input<readonly CellTagListItem[]>([]);
  readonly max = input<number>(3);
  readonly class = input<ClassValue>('');

  protected readonly visibleItems = computed(() => this.items().slice(0, this.max()));
  protected readonly overflowItems = computed(() => this.items().slice(this.max()));
  protected readonly overflowCount = computed(() => this.overflowItems().length);
  protected readonly overflowLabels = computed(() =>
    this.overflowItems()
      .map((item) => item.label)
      .join(', '),
  );

  protected readonly classes = computed(() =>
    mergeClasses('flex min-w-0 items-center gap-1 overflow-hidden', this.class()),
  );
}
