import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { BadgeComponent, type BadgeTypeVariants } from '@justin-croyable/design-system';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

type BadgeTypeResolver = BadgeTypeVariants | ((params: ICellRendererParams) => BadgeTypeVariants);

export type TagCellParams = ICellRendererParams & { readonly badgeType?: BadgeTypeResolver };

@Component({
  selector: 'app-tag-cell',
  imports: [BadgeComponent],
  template: `
    @if (label()) {
      <app-badge [type]="type()">{{ label() }}</app-badge>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagCellComponent implements ICellRendererAngularComp {
  protected readonly label = signal('');
  protected readonly type = signal<BadgeTypeVariants>('secondary');

  agInit(params: TagCellParams): void {
    this.#update(params);
  }

  refresh(params: TagCellParams): boolean {
    this.#update(params);
    return true;
  }

  #update(params: TagCellParams): void {
    this.label.set(params.value === null || params.value === undefined ? '' : String(params.value));
    const resolver = params.badgeType;
    this.type.set(typeof resolver === 'function' ? resolver(params) : (resolver ?? 'secondary'));
  }
}
