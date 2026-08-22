import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';
import { injectStore, type NgtThreeEvent } from 'angular-three';

import {
  CROP_FILTER,
  type CropFilter,
  type GardenCell,
  type GardenEdge,
  type GardenField,
  type GardenParcel,
  type GardenTree,
  matchesCropFilter,
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

/**
 * Au-delà de ce déplacement, le geste manipule la caméra : le clic qui le clôt
 * ne doit rien sélectionner, même si le doigt s'arrête au-dessus d'une case.
 */
const DRAG_TOLERANCE_PX = 8;

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
    <ngt-group (click)="onGroundPick($event)">
      @for (part of horizonParts(); track part.id) {
        <app-scene-part [part]="part" />
      }

      @for (part of terrainParts(); track part.id) {
        <app-scene-part [part]="part" />
      }
    </ngt-group>

    @for (tree of visibleTrees(); track tree.id) {
      <app-garden-tree
        [tree]="tree"
        (picked)="onTreePick($event)"
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
        [cropFilter]="cropFilter()"
        (picked)="onParcelPick($event)"
        (pressed)="pressed.emit($event)"
        (hoverChange)="hoverChange.emit($event)"
        (cellPicked)="onCellPick($event)"
        (cellLongPressed)="cellLongPressed.emit($event)"
        (cellHoverChange)="cellHoverChange.emit($event)"
        (edgePicked)="onEdgePick($event)"
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
  readonly cropFilter = input<CropFilter>(CROP_FILTER.all);
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
  readonly #store = injectStore();

  #pressX = 0;
  #pressY = 0;
  #dragged = false;

  constructor() {
    const element = this.#store.gl().domElement;
    const onPress = (event: PointerEvent): void => {
      this.#pressX = event.clientX;
      this.#pressY = event.clientY;
      this.#dragged = false;
    };
    const onDrag = (event: PointerEvent): void => {
      this.#dragged =
        this.#dragged ||
        Math.hypot(event.clientX - this.#pressX, event.clientY - this.#pressY) > DRAG_TOLERANCE_PX;
    };
    element.addEventListener('pointerdown', onPress);
    element.addEventListener('pointermove', onDrag);
    inject(DestroyRef).onDestroy(() => {
      element.removeEventListener('pointerdown', onPress);
      element.removeEventListener('pointermove', onDrag);
    });
  }

  protected onGroundPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    if (this.#dragged) {
      return;
    }
    this.groundPicked.emit({ x: event.point.x, z: event.point.z });
  }

  protected onCellPick(cell: GardenCell): void {
    if (!this.#dragged) {
      this.cellPicked.emit(cell);
    }
  }

  protected onEdgePick(edge: GardenEdge): void {
    if (!this.#dragged) {
      this.edgePicked.emit(edge);
    }
  }

  protected onParcelPick(parcelId: string): void {
    if (!this.#dragged) {
      this.picked.emit(parcelId);
    }
  }

  protected onTreePick(tree: GardenTree): void {
    if (!this.#dragged) {
      this.treePicked.emit(tree);
    }
  }

  protected readonly visibleTrees = computed(() =>
    this.field().trees.filter(tree => matchesCropFilter(tree.cropId, this.cropFilter())),
  );

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
