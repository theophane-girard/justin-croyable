import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
} from '@angular/core';
import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';
import { type NgtThreeEvent } from 'angular-three';

import { type GardenCell } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildCellParts } from './garden-structure-parts';
import { GardenPlantComponent } from './garden-plant.component';

@Component({
  selector: 'app-garden-cell',
  imports: [ScenePartComponent, GardenPlantComponent],
  template: `
    <ngt-group
      [position]="cell().position"
      (click)="onPick($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }
      @if (cell().cropId; as cropId) {
        @if (cell().plant; as plant) {
          <app-garden-plant [cropId]="cropId" [spot]="plant" />
        }
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenCellComponent {
  readonly cell = input.required<GardenCell>();
  readonly hovered = input(false);

  readonly picked = output<GardenCell>();
  readonly hoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  protected readonly parts = computed(() => {
    const colors = this.#colors();
    const empty = this.cell().varietyId === null;
    const tile = this.hovered() ? colors.highlight : empty ? colors.bedFurrow : colors.bedSoil;
    return buildCellParts(colors, tile);
  });

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.picked.emit(this.cell());
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.cell().key);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
