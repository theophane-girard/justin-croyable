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

import { type GardenCell, type GardenEdge, type GardenParcel } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import {
  buildEdgeParts,
  buildGridParts,
  buildOutlineParts,
  buildParcelParts,
} from './garden-structure-parts';
import { GardenCellComponent } from './garden-cell.component';

export const PARCEL_STATE = {
  idle: 'idle',
  hovered: 'hovered',
  selected: 'selected',
  invalid: 'invalid',
} as const;

export type ParcelState = (typeof PARCEL_STATE)[keyof typeof PARCEL_STATE];

export type ParcelPointer = {
  readonly id: string;
  readonly x: number;
  readonly z: number;
};

@Component({
  selector: 'app-garden-parcel',
  imports: [ScenePartComponent, GardenCellComponent],
  template: `
    <ngt-group
      [position]="parcel().position"
      (click)="onPick($event)"
      (pointerdown)="onPointerDown($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }

      @if (showGrid()) {
        @for (part of gridParts(); track part.id) {
          <app-scene-part [part]="part" />
        }
      }

      @if (interactiveCells()) {
        @for (cell of parcel().cells; track cell.key) {
          <app-garden-cell
            [cell]="cell"
            [soilTop]="parcel().soilTop"
            [hovered]="highlightedKeys().has(cell.key) || cell.key === hoveredCellKey()"
            [selected]="selectedCellKeys().has(cell.key)"
            (picked)="cellPicked.emit($event)"
            (longPressed)="cellLongPressed.emit($event)"
            (hoverChange)="cellHoverChange.emit($event)"
          />
        }

        @if (showEdges()) {
          @for (edge of parcel().edges; track edge.key) {
            <ngt-group
              [position]="edge.position"
              (click)="onEdgePick($event, edge)"
              (pointerover)="onEdgeEnter($event, edge)"
              (pointerout)="onEdgeLeave($event)"
            >
              @for (part of edgeParts()(edge); track part.id) {
                <app-scene-part [part]="part" />
              }
            </ngt-group>
          }
        }
      }

      @if (outlineParts(); as outline) {
        @for (part of outline; track part.id) {
          <app-scene-part [part]="part" />
        }
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenParcelComponent {
  readonly parcel = input.required<GardenParcel>();
  readonly state = input<ParcelState>(PARCEL_STATE.idle);
  readonly interactiveCells = input(true);
  readonly showGrid = input(true);
  readonly hoveredCellKey = input<string | null>(null);
  readonly selectedCellKeys = input<ReadonlySet<string>>(new Set<string>());
  readonly hoveredEdgeKey = input<string | null>(null);

  readonly picked = output<string>();
  readonly edgePicked = output<GardenEdge>();
  readonly edgeHoverChange = output<GardenEdge | null>();
  readonly pressed = output<ParcelPointer>();
  readonly hoverChange = output<string | null>();
  readonly cellPicked = output<GardenCell>();
  readonly cellLongPressed = output<GardenCell>();
  readonly cellHoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  readonly #plankColor = computed(() => {
    const colors = this.#colors();
    return this.state() === PARCEL_STATE.invalid ? colors.red : colors.wood;
  });

  protected readonly parts = computed(() =>
    buildParcelParts(
      this.parcel().width,
      this.parcel().depth,
      this.parcel().kind,
      this.#colors(),
      this.#plankColor(),
    ),
  );

  protected readonly gridParts = computed(() =>
    buildGridParts(
      this.parcel().width,
      this.parcel().depth,
      this.parcel().columns,
      this.parcel().rows,
      this.parcel().soilTop,
      this.#colors().bedFurrow,
    ),
  );

  protected readonly outlineParts = computed(() => {
    const colors = this.#colors();
    const state = this.state();
    if (state === PARCEL_STATE.idle) {
      return null;
    }
    const color =
      state === PARCEL_STATE.invalid
        ? colors.red
        : state === PARCEL_STATE.selected
          ? colors.highlight
          : colors.leafBright;
    return buildOutlineParts(
      this.parcel().width,
      this.parcel().depth,
      this.parcel().soilTop,
      color,
    );
  });

  /** Les poignées de bord n'apparaissent que sur la parcelle visée. */
  protected readonly showEdges = computed(() => this.state() !== PARCEL_STATE.idle);

  protected readonly highlightedKeys = computed(() => {
    const hoveredEdgeKey = this.hoveredEdgeKey();
    const edge = this.parcel().edges.find(candidate => candidate.key === hoveredEdgeKey);
    return new Set(edge?.cellKeys ?? []);
  });

  protected readonly edgeParts = computed(() => {
    const colors = this.#colors();
    const top = this.parcel().soilTop;
    const hoveredEdgeKey = this.hoveredEdgeKey();
    return (edge: GardenEdge) =>
      buildEdgeParts(
        edge.width,
        edge.depth,
        top,
        edge.key === hoveredEdgeKey ? colors.highlight : colors.stone,
      );
  });

  protected onEdgePick(event: NgtThreeEvent<MouseEvent>, edge: GardenEdge): void {
    event.stopPropagation();
    this.edgePicked.emit(edge);
  }

  protected onEdgeEnter(event: NgtThreeEvent<PointerEvent>, edge: GardenEdge): void {
    event.stopPropagation();
    this.edgeHoverChange.emit(edge);
  }

  protected onEdgeLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.edgeHoverChange.emit(null);
  }

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.picked.emit(this.parcel().id);
  }

  protected onPointerDown(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.pressed.emit({
      id: this.parcel().id,
      x: event.point.x,
      z: event.point.z,
    });
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.parcel().id);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
