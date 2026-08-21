import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';

import { type GardenCell, type GardenField, type GardenSlot } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildFieldParts } from './garden-structure-parts';
import { GardenBedComponent } from './garden-bed.component';
import { GardenSlotComponent } from './garden-slot.component';

@Component({
  selector: 'app-garden-scene',
  imports: [ScenePartComponent, GardenBedComponent, GardenSlotComponent],
  template: `
    @for (part of fieldParts(); track part.id) {
      <app-scene-part [part]="part" />
    }

    @for (slot of field().slots; track slot.key) {
      <app-garden-slot
        [slot]="slot"
        [hovered]="slot.key === hoveredSlotKey()"
        (picked)="slotPicked.emit($event)"
        (hoverChange)="slotHoverChange.emit($event)"
      />
    }

    @for (bed of field().beds; track bed.id) {
      <app-garden-bed
        [bed]="bed"
        [selected]="bed.id === selectedId()"
        [hovered]="bed.id === hoveredId()"
        [hoveredCellKey]="hoveredCellKey()"
        (picked)="picked.emit($event)"
        (hoverChange)="hoverChange.emit($event)"
        (cellPicked)="cellPicked.emit($event)"
        (cellHoverChange)="cellHoverChange.emit($event)"
      />
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenSceneComponent {
  readonly field = input.required<GardenField>();
  readonly selectedId = input<string | null>(null);
  readonly hoveredId = input<string | null>(null);
  readonly hoveredCellKey = input<string | null>(null);
  readonly hoveredSlotKey = input<string | null>(null);

  readonly picked = output<string>();
  readonly hoverChange = output<string | null>();
  readonly cellPicked = output<GardenCell>();
  readonly cellHoverChange = output<string | null>();
  readonly slotPicked = output<GardenSlot>();
  readonly slotHoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  protected readonly fieldParts = computed(() =>
    buildFieldParts(this.field().width, this.field().depth, this.#colors()),
  );
}
