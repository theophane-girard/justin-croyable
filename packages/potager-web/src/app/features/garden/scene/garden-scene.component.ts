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

import { type GardenCell, type GardenField, type GardenParcel } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildTerrainParts } from './garden-structure-parts';
import {
  GardenParcelComponent,
  PARCEL_STATE,
  type ParcelPointer,
  type ParcelState,
} from './garden-parcel.component';

@Component({
  selector: 'app-garden-scene',
  imports: [ScenePartComponent, GardenParcelComponent],
  template: `
    @for (part of terrainParts(); track part.id) {
      <app-scene-part [part]="part" />
    }

    @for (parcel of field().parcels; track parcel.id) {
      <app-garden-parcel
        [parcel]="parcel"
        [state]="stateOf()(parcel)"
        [interactiveCells]="interactiveCells()"
        [showGrid]="showGrid()"
        [hoveredCellKey]="hoveredCellKey()"
        (picked)="picked.emit($event)"
        (pressed)="pressed.emit($event)"
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
  readonly invalidIds = input<ReadonlySet<string>>(new Set<string>());
  readonly hoveredCellKey = input<string | null>(null);
  readonly interactiveCells = input(true);
  readonly showGrid = input(true);
  readonly tilledTerrain = input(true);

  readonly picked = output<string>();
  readonly pressed = output<ParcelPointer>();
  readonly hoverChange = output<string | null>();
  readonly cellPicked = output<GardenCell>();
  readonly cellHoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  protected readonly terrainParts = computed(() =>
    buildTerrainParts(this.field().width, this.field().depth, this.#colors(), this.tilledTerrain()),
  );

  protected readonly stateOf = computed(() => {
    const selectedId = this.selectedId();
    const hoveredId = this.hoveredId();
    const invalidIds = this.invalidIds();
    return (parcel: GardenParcel): ParcelState => {
      if (invalidIds.has(parcel.id)) {
        return PARCEL_STATE.invalid;
      }
      if (parcel.id === selectedId) {
        return PARCEL_STATE.selected;
      }
      return parcel.id === hoveredId ? PARCEL_STATE.hovered : PARCEL_STATE.idle;
    };
  });
}
