import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ViewportService } from '@justin-croyable/design-system';
import {
  type SceneBounds,
  SceneCanvasComponent,
  SceneContentDirective,
} from '@justin-croyable/design-system/components/scene';
import type { NgtFrameloop } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { GardenPlanStore } from '../plan/garden-plan-store';

import { buildGardenField, type GardenCell, type GardenEdge } from './garden-layout';
import { GardenSceneComponent } from './garden-scene.component';

const FILL_HEIGHT = '100%';
const SCENE_LABEL = 'Votre potager en trois dimensions, une grille de culture par parcelle';
const ANIMATED_FRAMELOOP: NgtFrameloop = 'always';
const STILL_FRAMELOOP: NgtFrameloop = 'demand';

@Component({
  selector: 'app-garden-view',
  imports: [SceneCanvasComponent, SceneContentDirective, GardenSceneComponent, NgIcon],
  template: `
    <app-scene-canvas
      orbitPan
      sky="open"
      [fog]="false"
      [class.cursor-pointer]="pointerActive()"
      [height]="fillHeight"
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
          [hoveredEdgeKey]="activeEdge()?.key ?? null"
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
          (cellPicked)="onCellPicked($event)"
          (cellHoverChange)="hoveredCellKey.set($event)"
          (edgePicked)="onEdgePicked($event)"
          (edgeHoverChange)="hoveredEdge.set($event)"
        />
      </ng-template>

      <div sceneOverlay>
        <div
          class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs"
        >
          <ng-icon name="phosphorArrowClockwise" class="size-3.5" />
          <span class="hidden sm:inline">
            Glisser pour tourner · clic droit pour déplacer · molette pour zoomer
          </span>
          <span class="sm:hidden">Glisser · deux doigts pour déplacer</span>
        </div>
      </div>
    </app-scene-canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenViewComponent {
  readonly selectedId = model<string | null>(null);

  readonly cellPicked = output<GardenCell>();
  readonly edgePicked = output<GardenEdge>();

  readonly #viewport = inject(ViewportService);
  readonly #plan = inject(GardenPlanStore);

  private readonly canvas = viewChild.required(SceneCanvasComponent);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly hoveredCellKey = signal<string | null>(null);
  protected readonly hoveredEdge = signal<GardenEdge | null>(null);

  /** Le bord choisi reste surligné pendant que la feuille d'actions est ouverte. */
  protected readonly pinnedEdge = signal<GardenEdge | null>(null);

  protected readonly activeEdge = computed(() => this.hoveredEdge() ?? this.pinnedEdge());
  protected readonly sceneLabel = SCENE_LABEL;
  protected readonly fillHeight = FILL_HEIGHT;

  protected readonly pointerActive = computed(
    () =>
      this.hoveredId() !== null || this.hoveredCellKey() !== null || this.hoveredEdge() !== null,
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

  recenter(): void {
    this.canvas().recenter();
  }

  protected onPicked(id: string): void {
    this.pinnedEdge.set(null);
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  protected onCellPicked(cell: GardenCell): void {
    this.pinnedEdge.set(null);
    this.cellPicked.emit(cell);
  }

  protected onEdgePicked(edge: GardenEdge): void {
    this.pinnedEdge.set(edge);
    this.edgePicked.emit(edge);
  }
}
