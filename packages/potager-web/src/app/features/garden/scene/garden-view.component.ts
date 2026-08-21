import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { CardComponent, ViewportService } from '@justin-croyable/design-system';
import {
  type SceneBounds,
  SceneCanvasComponent,
  SceneContentDirective,
} from '@justin-croyable/design-system/components/scene';
import type { NgtFrameloop } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { GardenPlanStore } from '../plan/garden-plan-store';

import { buildGardenField, type GardenCell } from './garden-layout';
import { GardenSceneComponent } from './garden-scene.component';

type FocusInfo = {
  readonly label: string;
  readonly detail: string;
};

const MOBILE_HEIGHT = '22rem';
const DESKTOP_HEIGHT = '32rem';
const SCENE_LABEL = 'Votre potager en trois dimensions, une grille de culture par parcelle';
const ANIMATED_FRAMELOOP: NgtFrameloop = 'always';
const STILL_FRAMELOOP: NgtFrameloop = 'demand';
const EMPTY_PARCEL_DETAIL = 'Parcelle vide · touchez une case pour semer';
const FREE_CELL_LABEL = 'Case libre';
const FREE_CELL_DETAIL = 'Touchez pour semer';

@Component({
  selector: 'app-garden-view',
  imports: [
    SceneCanvasComponent,
    SceneContentDirective,
    CardComponent,
    GardenSceneComponent,
    NgIcon,
  ],
  template: `
    <app-scene-canvas
      [class.cursor-pointer]="pointerActive()"
      [height]="height()"
      [label]="sceneLabel"
      [bounds]="bounds()"
      [frameloop]="frameloop()"
    >
      <ng-template sceneContent>
        <app-garden-scene
          [field]="field()"
          [selectedId]="selectedId()"
          [hoveredId]="hoveredId()"
          [hoveredCellKey]="hoveredCellKey()"
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
          (cellPicked)="cellPicked.emit($event)"
          (cellHoverChange)="hoveredCellKey.set($event)"
        />
      </ng-template>

      <div sceneOverlay>
        @if (focus(); as info) {
          <app-card
            class="absolute top-3 left-3 w-64 max-w-[70%]"
            backdrop="blur"
            [title]="info.label"
            [description]="info.detail"
          />
        }

        <div
          class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs"
        >
          <ng-icon name="phosphorArrowClockwise" class="size-3.5" />
          <span class="hidden sm:inline">Glisser pour tourner · molette pour zoomer</span>
          <span class="sm:hidden">Glisser · pincer</span>
        </div>
      </div>
    </app-scene-canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenViewComponent {
  readonly selectedId = model<string | null>(null);

  readonly cellPicked = output<GardenCell>();

  readonly #viewport = inject(ViewportService);
  readonly #plan = inject(GardenPlanStore);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly hoveredCellKey = signal<string | null>(null);
  protected readonly sceneLabel = SCENE_LABEL;

  protected readonly pointerActive = computed(
    () => this.hoveredId() !== null || this.hoveredCellKey() !== null,
  );

  protected readonly height = computed(() =>
    this.#viewport.isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT,
  );

  protected readonly frameloop = computed(() =>
    this.#viewport.prefersReducedMotion() ? STILL_FRAMELOOP : ANIMATED_FRAMELOOP,
  );

  protected readonly field = computed(() => buildGardenField(this.#plan.plan()));

  protected readonly bounds = computed<SceneBounds>(() => ({
    width: this.field().width,
    depth: this.field().depth,
    height: this.field().height,
  }));

  protected readonly focus = computed<FocusInfo | null>(() => {
    const cellKey = this.hoveredCellKey();
    if (cellKey !== null) {
      return this.#cellFocus(cellKey);
    }
    const parcelId = this.hoveredId() ?? this.selectedId();
    return parcelId === null ? null : this.#parcelFocus(parcelId);
  });

  #cellFocus(cellKey: string): FocusInfo | null {
    const cell = this.field()
      .parcels.flatMap(parcel => parcel.cells)
      .find(candidate => candidate.key === cellKey);
    if (!cell) {
      return null;
    }
    if (cell.varietyId === null) {
      return { label: FREE_CELL_LABEL, detail: FREE_CELL_DETAIL };
    }
    return {
      label: cell.label,
      detail: `Récolté : ${cell.harvestedKg.toFixed(1).replace('.', ',')} kg`,
    };
  }

  #parcelFocus(parcelId: string): FocusInfo | null {
    const parcel = this.field().parcels.find(candidate => candidate.id === parcelId);
    if (!parcel) {
      return null;
    }
    const total = parcel.columns * parcel.rows;
    if (parcel.plantedCount === 0) {
      return { label: parcel.name, detail: EMPTY_PARCEL_DETAIL };
    }
    const plural = parcel.plantedCount > 1 ? 's' : '';
    return {
      label: parcel.name,
      detail: `${parcel.plantedCount} case${plural} semée${plural} sur ${total}`,
    };
  }

  protected onPicked(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
}
