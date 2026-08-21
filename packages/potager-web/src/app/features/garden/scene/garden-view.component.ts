import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from '@angular/core';
import { CardComponent, ViewportService } from '@justin-croyable/design-system';
import {
  type SceneBounds,
  SceneCanvasComponent,
  SceneContentDirective,
} from '@justin-croyable/design-system/components/scene';
import type { NgtFrameloop } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { cropUnit, formatQuantity, type PlantRow } from '../../../core/potager.model';

import { buildGardenField } from './garden-layout';
import { GardenSceneComponent } from './garden-scene.component';

type FocusInfo = {
  readonly label: string;
  readonly detail: string;
};

const MOBILE_PLANT_BUDGET = 3;
const DESKTOP_PLANT_BUDGET = 6;
const MOBILE_HEIGHT = '22rem';
const DESKTOP_HEIGHT = '32rem';
const SCENE_HEIGHT = 2.4;
const SCENE_LABEL = 'Votre potager en trois dimensions, une planche par variété cultivée';
const ANIMATED_FRAMELOOP: NgtFrameloop = 'always';
const STILL_FRAMELOOP: NgtFrameloop = 'demand';
const PLANT_SUFFIX = 'plant';
const PLANT_SUFFIX_PLURAL = 'plants';
const DETAIL_SEPARATOR = ' · ';

@Component({
  selector: 'app-garden-view',
  imports: [SceneCanvasComponent, SceneContentDirective, CardComponent, GardenSceneComponent, NgIcon],
  template: `
    <app-scene-canvas
      [class.cursor-pointer]="hoveredId() !== null"
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
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
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

  readonly #viewport = inject(ViewportService);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly sceneLabel = SCENE_LABEL;

  protected readonly height = computed(() =>
    this.#viewport.isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT,
  );

  protected readonly frameloop = computed(() =>
    this.#viewport.prefersReducedMotion() ? STILL_FRAMELOOP : ANIMATED_FRAMELOOP,
  );

  protected readonly field = computed(() =>
    buildGardenField(
      this.rows(),
      this.#viewport.isMobile() ? MOBILE_PLANT_BUDGET : DESKTOP_PLANT_BUDGET,
    ),
  );

  protected readonly bounds = computed<SceneBounds>(() => ({
    width: this.field().width,
    depth: this.field().depth,
    height: SCENE_HEIGHT,
  }));

  protected readonly focus = computed<FocusInfo | null>(() => {
    const focusedId = this.hoveredId() ?? this.selectedId();
    const row = this.rows().find(candidate => candidate.id === focusedId);
    if (!row) {
      return null;
    }
    const plants = `${row.quantity} ${row.quantity > 1 ? PLANT_SUFFIX_PLURAL : PLANT_SUFFIX}`;
    const harvested = formatQuantity(row.harvestedKg, cropUnit(row.cropId));
    return {
      label: row.label,
      detail: [row.categoryLabel, plants, harvested].join(DETAIL_SEPARATOR),
    };
  });

  protected onPicked(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
}
