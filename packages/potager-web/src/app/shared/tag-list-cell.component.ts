import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  CellTagListComponent,
  type CellTagColor,
  type CellTagListItem,
} from '@justin-croyable/design-system';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

const DEFAULT_MAX_TAGS = 3;

export type TagListCellParams = ICellRendererParams & {
  readonly color?: CellTagColor;
  readonly max?: number;
};

@Component({
  selector: 'app-tag-list-cell',
  imports: [CellTagListComponent],
  template: `
    @if (items().length) {
      <app-cell-tag-list [items]="items()" [max]="max()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagListCellComponent implements ICellRendererAngularComp {
  protected readonly items = signal<readonly CellTagListItem[]>([]);
  protected readonly max = signal(DEFAULT_MAX_TAGS);

  agInit(params: TagListCellParams): void {
    this.#update(params);
  }

  refresh(params: TagListCellParams): boolean {
    this.#update(params);
    return true;
  }

  #update(params: TagListCellParams): void {
    const color = params.color ?? 'neutral';
    const values = Array.isArray(params.value) ? (params.value as readonly string[]) : [];
    this.items.set(values.map(label => ({ label, color })));
    this.max.set(params.max ?? DEFAULT_MAX_TAGS);
  }
}
