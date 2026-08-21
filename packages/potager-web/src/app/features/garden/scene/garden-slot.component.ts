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

import { type GardenSlot } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildSlotMarkerParts } from './garden-structure-parts';

@Component({
  selector: 'app-garden-slot',
  imports: [ScenePartComponent],
  template: `
    <ngt-group
      [position]="slot().position"
      (click)="onPick($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenSlotComponent {
  readonly slot = input.required<GardenSlot>();
  readonly hovered = input(false);

  readonly picked = output<GardenSlot>();
  readonly hoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  protected readonly parts = computed(() => {
    const colors = this.#colors();
    return buildSlotMarkerParts(this.hovered() ? colors.highlight : colors.slot);
  });

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.picked.emit(this.slot());
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.slot().key);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
