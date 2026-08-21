import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { CardComponent, ViewportService } from '@justin-croyable/design-system';
import {
  type SceneBounds,
  SceneCanvasComponent,
  SceneContentDirective,
} from '@justin-croyable/design-system/components/scene';
import type { NgtFrameloop } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { GardenPlanStore } from '../garden-plan-store';
import { cropUnit, formatQuantity, type PlantRow } from '../../../core/potager.model';

import { buildGardenField, type GardenCell, type GardenSlot } from './garden-layout';
import { GardenSceneComponent } from './garden-scene.component';

type FocusInfo = {
  readonly label: string;
  readonly detail: string;
};

const MOBILE_HEIGHT = '22rem';
const DESKTOP_HEIGHT = '32rem';
const SCENE_HEIGHT = 2.4;
const SCENE_LABEL = 'Votre potager en trois dimensions, un bac par zone cultivée';
const ANIMATED_FRAMELOOP: NgtFrameloop = 'always';
const STILL_FRAMELOOP: NgtFrameloop = 'demand';
const CELLS_SUFFIX = 'case';
const CELLS_SUFFIX_PLURAL = 'cases';
const EMPTY_BED_DETAIL = 'Bac vide · touchez une case pour planter';
const DETAIL_SEPARATOR = ' · ';

@Component({
  selector: 'app-garden-view',
  imports: [SceneCanvasComponent, SceneContentDirective, CardComponent, GardenSceneComponent, NgIcon],
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
          [hoveredSlotKey]="hoveredSlotKey()"
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
          (cellPicked)="cellPicked.emit($event)"
          (cellHoverChange)="hoveredCellKey.set($event)"
          (slotPicked)="slotPicked.emit($event)"
          (slotHoverChange)="hoveredSlotKey.set($event)"
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
  readonly rows = input.required<readonly PlantRow[]>();
  readonly selectedId = model<string | null>(null);

  readonly cellPicked = output<GardenCell>();
  readonly slotPicked = output<GardenSlot>();

  readonly #viewport = inject(ViewportService);
  readonly #plan = inject(GardenPlanStore);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly hoveredCellKey = signal<string | null>(null);
  protected readonly hoveredSlotKey = signal<string | null>(null);
  protected readonly sceneLabel = SCENE_LABEL;

  protected readonly pointerActive = computed(
    () =>
      this.hoveredId() !== null || this.hoveredCellKey() !== null || this.hoveredSlotKey() !== null,
  );

  protected readonly height = computed(() =>
    this.#viewport.isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT,
  );

  protected readonly frameloop = computed(() =>
    this.#viewport.prefersReducedMotion() ? STILL_FRAMELOOP : ANIMATED_FRAMELOOP,
  );

  protected readonly field = computed(() => buildGardenField(this.#plan.plan(), this.rows()));

  protected readonly bounds = computed<SceneBounds>(() => ({
    width: this.field().width,
    depth: this.field().depth,
    height: SCENE_HEIGHT,
  }));

  protected readonly focus = computed<FocusInfo | null>(() => {
    const cellKey = this.hoveredCellKey();
    if (cellKey !== null) {
      return this.#cellFocus(cellKey);
    }
    const bedId = this.hoveredId() ?? this.selectedId();
    return bedId === null ? null : this.#bedFocus(bedId);
  });

  #cellFocus(cellKey: string): FocusInfo | null {
    const cell = this.field()
      .beds.flatMap(bed => bed.cells)
      .find(candidate => candidate.key === cellKey);
    if (!cell) {
      return null;
    }
    if (cell.varietyId === null) {
      return { label: 'Case libre', detail: 'Touchez pour choisir une variété' };
    }
    const row = this.rows().find(candidate => candidate.varietyId === cell.varietyId);
    const harvested = row ? formatQuantity(row.harvestedKg, cropUnit(row.cropId)) : '';
    return {
      label: cell.label,
      detail: [row?.categoryLabel, harvested].filter(Boolean).join(DETAIL_SEPARATOR),
    };
  }

  #bedFocus(bedId: string): FocusInfo | null {
    const bed = this.field().beds.find(candidate => candidate.id === bedId);
    if (!bed) {
      return null;
    }
    const total = bed.columns * bed.rows;
    if (bed.plantedCount === 0) {
      return { label: `Bac ${bed.columns} × ${bed.rows}`, detail: EMPTY_BED_DETAIL };
    }
    const suffix = bed.plantedCount > 1 ? CELLS_SUFFIX_PLURAL : CELLS_SUFFIX;
    return {
      label: `Bac ${bed.columns} × ${bed.rows}`,
      detail: `${bed.plantedCount} ${suffix} plantée${bed.plantedCount > 1 ? 's' : ''} sur ${total}`,
    };
  }

  protected onPicked(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
}
