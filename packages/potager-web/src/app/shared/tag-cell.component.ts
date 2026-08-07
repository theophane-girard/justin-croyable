import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { CellTagComponent, type CellTagColor } from '@justin-croyable/design-system';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

type CellTagColorResolver = CellTagColor | ((params: ICellRendererParams) => CellTagColor);

export type TagCellParams = ICellRendererParams & {
  readonly color?: CellTagColorResolver;
  readonly icon?: string | null;
};

@Component({
  selector: 'app-tag-cell',
  imports: [CellTagComponent],
  template: `
    @if (label()) {
      <app-cell-tag [label]="label()" [color]="color()" [icon]="icon()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagCellComponent implements ICellRendererAngularComp {
  protected readonly label = signal('');
  protected readonly color = signal<CellTagColor>('neutral');
  protected readonly icon = signal<string | null>(null);

  agInit(params: TagCellParams): void {
    this.#update(params);
  }

  refresh(params: TagCellParams): boolean {
    this.#update(params);
    return true;
  }

  #update(params: TagCellParams): void {
    this.label.set(params.value === null || params.value === undefined ? '' : String(params.value));
    const resolver = params.color;
    this.color.set(typeof resolver === 'function' ? resolver(params) : (resolver ?? 'neutral'));
    this.icon.set(params.icon ?? null);
  }
}
