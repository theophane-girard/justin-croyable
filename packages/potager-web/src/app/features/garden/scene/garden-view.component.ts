import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ThemeService, ViewportService } from '@justin-croyable/design-system';
import {
  OPEN_SKY_HAZE,
  type SceneBounds,
  type SceneCameraOptions,
  SceneCanvasComponent,
  SceneContentDirective,
  type SceneFog,
} from '@justin-croyable/design-system/components/scene';
import type { NgtFrameloop } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { GardenPlanStore } from '../plan/garden-plan-store';

import {
  buildGardenField,
  CROP_FILTER,
  type CropFilter,
  type GardenCell,
  type GardenEdge,
  type GardenTree,
} from './garden-layout';
import { GardenSceneComponent, type GroundPoint } from './garden-scene.component';

const FILL_HEIGHT = '100%';
const SCENE_LABEL = 'Votre potager en trois dimensions, une grille de culture par parcelle';
const HORIZON_HAZE_START_RATIO = 3;
const HORIZON_HAZE_END_RATIO = 26;
const GARDEN_CAMERA: SceneCameraOptions = { fov: 50 };
const GARDEN_ELEVATION_DEGREES = 45;
const GARDEN_AZIMUTH_DEGREES = 0;
const GARDEN_TARGET_LIFT = 0;
const ANIMATED_FRAMELOOP: NgtFrameloop = 'always';
const STILL_FRAMELOOP: NgtFrameloop = 'demand';

@Component({
  selector: 'app-garden-view',
  imports: [SceneCanvasComponent, SceneContentDirective, GardenSceneComponent, NgIcon],
  template: `
    <app-scene-canvas
      orbitNavigation="map"
      sky="open"
      [camera]="camera"
      [orbitElevation]="elevationDegrees"
      [orbitAzimuth]="azimuthDegrees"
      [orbitTargetLift]="targetLift"
      [fog]="horizonFog()"
      [class.cursor-pointer]="pointerActive()"
      [height]="fillHeight"
      [label]="sceneLabel"
      [bounds]="bounds()"
      [frameloop]="frameloop()"
    >
      <ng-template sceneContent>
        <app-garden-scene
          [horizon]="true"
          [field]="field()"
          [selectedId]="selectedId()"
          [hoveredId]="hoveredId()"
          [hoveredCellKey]="hoveredCellKey()"
          [hoveredEdgeKey]="activeEdge()?.key ?? null"
          [selectedCellKeys]="selectedCellKeys()"
          [cropFilter]="cropFilter()"
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
          (cellPicked)="onCellPicked($event)"
          (cellLongPressed)="cellLongPressed.emit($event)"
          (cellHoverChange)="hoveredCellKey.set($event)"
          (edgePicked)="onEdgePicked($event)"
          (edgeHoverChange)="hoveredEdge.set($event)"
          (groundPicked)="groundPicked.emit($event)"
          (treePicked)="treePicked.emit($event)"
          (treeHoverChange)="hoveredTreeId.set($event)"
        />
      </ng-template>

      <div sceneOverlay>
        <div
          class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs"
        >
          <ng-icon name="phosphorArrowsOutCardinal" class="size-3.5" />
          <span class="hidden sm:inline">
            Glisser pour déplacer · clic droit pour pivoter · molette pour zoomer
          </span>
          <span class="sm:hidden">Un doigt pour déplacer · deux pour pivoter et zoomer</span>
        </div>
      </div>
    </app-scene-canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenViewComponent {
  readonly selectedId = model<string | null>(null);

  readonly selectedCellKeys = input<ReadonlySet<string>>(new Set<string>());
  readonly cropFilter = input<CropFilter>(CROP_FILTER.all);

  readonly cellPicked = output<GardenCell>();
  readonly cellLongPressed = output<GardenCell>();
  readonly edgePicked = output<GardenEdge>();
  readonly groundPicked = output<GroundPoint>();
  readonly treePicked = output<GardenTree>();

  readonly #viewport = inject(ViewportService);
  readonly #theme = inject(ThemeService);
  readonly #plan = inject(GardenPlanStore);

  private readonly canvas = viewChild.required(SceneCanvasComponent);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly hoveredCellKey = signal<string | null>(null);
  protected readonly hoveredEdge = signal<GardenEdge | null>(null);
  protected readonly hoveredTreeId = signal<string | null>(null);

  /** Le bord choisi reste surligné pendant que la feuille d'actions est ouverte. */
  protected readonly pinnedEdge = signal<GardenEdge | null>(null);

  protected readonly activeEdge = computed(() => this.hoveredEdge() ?? this.pinnedEdge());
  protected readonly sceneLabel = SCENE_LABEL;
  protected readonly camera = GARDEN_CAMERA;
  protected readonly elevationDegrees = GARDEN_ELEVATION_DEGREES;
  protected readonly azimuthDegrees = GARDEN_AZIMUTH_DEGREES;
  protected readonly targetLift = GARDEN_TARGET_LIFT;
  protected readonly fillHeight = FILL_HEIGHT;

  protected readonly pointerActive = computed(
    () =>
      this.hoveredId() !== null ||
      this.hoveredCellKey() !== null ||
      this.hoveredEdge() !== null ||
      this.hoveredTreeId() !== null,
  );

  protected readonly frameloop = computed(() =>
    this.#viewport.prefersReducedMotion() ? STILL_FRAMELOOP : ANIMATED_FRAMELOOP,
  );

  protected readonly field = computed(() => buildGardenField(this.#plan.plan()));

  protected readonly horizonFog = computed<SceneFog>(() => {
    const extent = this.field().extent;
    return {
      color: this.#theme.isDark() ? OPEN_SKY_HAZE.dark : OPEN_SKY_HAZE.light,
      near: extent * HORIZON_HAZE_START_RATIO,
      far: extent * HORIZON_HAZE_END_RATIO,
    };
  });

  protected readonly bounds = computed<SceneBounds>(() => ({
    width: this.field().frameWidth,
    depth: this.field().frameDepth,
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
