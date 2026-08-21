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

import { type GardenBed, type GardenCell } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildBedParts, buildMarkerParts, buildRingParts } from './garden-structure-parts';
import { GardenCellComponent } from './garden-cell.component';

@Component({
  selector: 'app-garden-bed',
  imports: [ScenePartComponent, GardenCellComponent],
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

      @for (cell of bed().cells; track cell.key) {
        <app-garden-cell
          [cell]="cell"
          [hovered]="cell.key === hoveredCellKey()"
          (picked)="cellPicked.emit($event)"
          (hoverChange)="cellHoverChange.emit($event)"
        />
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
  readonly hoveredCellKey = input<string | null>(null);

  readonly picked = output<string>();
  readonly hoverChange = output<string | null>();
  readonly cellPicked = output<GardenCell>();
  readonly cellHoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  readonly #plankColor = computed(() => {
    const colors = this.#colors();
    return this.selected() ? colors.marker : colors.wood;
  });

  protected readonly parts = computed(() =>
    buildBedParts(this.bed().columns, this.bed().rows, this.#colors(), this.#plankColor()),
  );

  protected readonly markerParts = computed(() =>
    buildMarkerParts(this.bed().columns, this.bed().rows, this.#colors()),
  );

  protected readonly ringVisible = computed(() => this.selected() || this.hovered());

  protected readonly ringParts = computed(() => {
    const colors = this.#colors();
    return buildRingParts(
      this.bed().columns,
      this.bed().rows,
      this.selected() ? colors.highlight : colors.leafBright,
    );
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
