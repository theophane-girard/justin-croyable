import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
} from '@angular/core';
import { type NgtThreeEvent } from 'angular-three';

import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';

import { type GardenBed } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildBedParts, buildMarkerParts, buildRingParts } from './garden-structure-parts';
import { GardenPlantComponent } from './garden-plant.component';

@Component({
  selector: 'app-garden-bed',
  imports: [ScenePartComponent, GardenPlantComponent],
  template: `
    <ngt-group
      [position]="bed().position"
      (click)="onPick($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }
      @for (spot of bed().spots; track $index) {
        <app-garden-plant [cropId]="bed().cropId" [spot]="spot" />
      }
      @if (ringVisible()) {
        @for (part of ringParts(); track part.id) {
          <app-scene-part [part]="part" />
        }
      }
      @if (selected()) {
        @for (part of markerParts(); track part.id) {
          <app-scene-part [part]="part" />
        }
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenBedComponent {
  readonly bed = input.required<GardenBed>();
  readonly selected = input(false);
  readonly hovered = input(false);

  readonly picked = output<string>();
  readonly hoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  readonly #plankColor = computed(() => {
    const colors = this.#colors();
    return this.selected() ? colors.marker : colors.wood;
  });

  protected readonly parts = computed(() =>
    buildBedParts(this.#colors(), this.#plankColor()),
  );

  protected readonly markerParts = computed(() => buildMarkerParts(this.#colors()));

  protected readonly ringVisible = computed(() => this.selected() || this.hovered());

  protected readonly ringParts = computed(() => {
    const colors = this.#colors();
    return buildRingParts(this.selected() ? colors.highlight : colors.leafBright);
  });

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.picked.emit(this.bed().id);
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.bed().id);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
