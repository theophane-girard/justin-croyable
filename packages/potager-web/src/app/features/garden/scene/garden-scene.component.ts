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
import { type NgtThreeEvent } from 'angular-three';

import {
  type GardenCell,
  type GardenEdge,
  type GardenField,
  type GardenParcel,
  type GardenTree,
} from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildHorizonParts, buildTerrainParts } from './garden-structure-parts';
import { GardenTreeComponent } from './garden-tree.component';
import {
  GardenParcelComponent,
  PARCEL_STATE,
  type ParcelPointer,
  type ParcelState,
} from './garden-parcel.component';

const KEY_SEPARATOR = ':';
const DRAG_TOLERANCE_PX = 6;

export type GroundPoint = {
  readonly x: number;
  readonly z: number;
};

function ownerParcelId(key: string | null): string | null {
  return key === null ? null : (key.split(KEY_SEPARATOR)[0] ?? null);
}

@Component({
  selector: 'app-garden-scene',
  imports: [ScenePartComponent, GardenParcelComponent, GardenTreeComponent],
  template: `
    <ngt-group (pointerdown)="onGroundDown($event)" (click)="onGroundPick($event)">
      @for (part of horizonParts(); track part.id) {
        <app-scene-part [part]="part" />
      }

      @for (part of terrainParts(); track part.id) {
        <app-scene-part [part]="part" />
      }
    </ngt-group>

    @for (tree of field().trees; track tree.id) {
      <app-garden-tree
        [tree]="tree"
        (picked)="treePicked.emit($event)"
        (hoverChange)="treeHoverChange.emit($event)"
      />
    }

    @for (parcel of field().parcels; track parcel.id) {
      <app-garden-parcel
        [parcel]="parcel"
        [state]="stateOf()(parcel)"
        [interactiveCells]="interactiveCells()"
        [showGrid]="showGrid()"
        [hoveredCellKey]="hoveredCellKey()"
        [hoveredEdgeKey]="hoveredEdgeKey()"
        [selectedCellKeys]="selectedCellKeys()"
        (picked)="picked.emit($event)"
        (pressed)="pressed.emit($event)"
        (hoverChange)="hoverChange.emit($event)"
        (cellPicked)="cellPicked.emit($event)"
        (cellLongPressed)="cellLongPressed.emit($event)"
        (cellHoverChange)="cellHoverChange.emit($event)"
        (edgePicked)="edgePicked.emit($event)"
        (edgeHoverChange)="edgeHoverChange.emit($event)"
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
  readonly hoveredEdgeKey = input<string | null>(null);
  readonly selectedCellKeys = input<ReadonlySet<string>>(new Set<string>());
  readonly interactiveCells = input(true);
  readonly showGrid = input(true);
  readonly tilledTerrain = input(true);
  readonly horizon = input(false);

  readonly picked = output<string>();
  readonly pressed = output<ParcelPointer>();
  readonly hoverChange = output<string | null>();
  readonly cellPicked = output<GardenCell>();
  readonly cellLongPressed = output<GardenCell>();
  readonly groundPicked = output<GroundPoint>();
  readonly treePicked = output<GardenTree>();
  readonly treeHoverChange = output<string | null>();
  readonly cellHoverChange = output<string | null>();
  readonly edgePicked = output<GardenEdge>();
  readonly edgeHoverChange = output<GardenEdge | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  #pressX = 0;
  #pressY = 0;

  protected onGroundDown(event: NgtThreeEvent<PointerEvent>): void {
    this.#pressX = event.nativeEvent.clientX;
    this.#pressY = event.nativeEvent.clientY;
  }

  /** Une rotation de caméra se termine aussi par un clic : on l'ignore. */
  protected onGroundPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    const travel = Math.hypot(
      event.nativeEvent.clientX - this.#pressX,
      event.nativeEvent.clientY - this.#pressY,
    );
    if (travel > DRAG_TOLERANCE_PX) {
      return;
    }
    this.groundPicked.emit({ x: event.point.x, z: event.point.z });
  }

  protected readonly horizonParts = computed(() =>
    this.horizon() ? buildHorizonParts(this.#colors()) : [],
  );

  protected readonly terrainParts = computed(() =>
    buildTerrainParts(
      this.field().width,
      this.field().depth,
      this.#colors(),
      this.tilledTerrain(),
      !this.horizon(),
    ),
  );

  /**
   * Une case ou une poignée de bord interrompt la propagation du survol, donc la
   * parcelle qui les porte ne serait jamais vue comme survolée : on la déduit de
   * la clé, qui commence par l'identifiant de la parcelle.
   */
  protected readonly stateOf = computed(() => {
    const selectedId = this.selectedId();
    const invalidIds = this.invalidIds();
    const hoveredId =
      this.hoveredId() ??
      ownerParcelId(this.hoveredCellKey()) ??
      ownerParcelId(this.hoveredEdgeKey());
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
