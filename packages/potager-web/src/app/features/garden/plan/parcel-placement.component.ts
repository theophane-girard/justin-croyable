import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  SceneThemeService,
  ViewportService,
} from '@justin-croyable/design-system';
import {
  type SceneBounds,
  type SceneCameraOptions,
  SceneCanvasComponent,
  SceneContentDirective,
  ScenePartComponent,
  SceneTopControlsComponent,
} from '@justin-croyable/design-system/components/scene';
import { NgtArgs, type NgtThreeEvent } from 'angular-three';
import { NgIcon } from '@ng-icons/core';

import { GARDEN_PALETTE } from '../scene/garden-palette';
import { buildGardenField, type GardenParcel } from '../scene/garden-layout';
import { buildPlateauGridParts, buildRotateHandleParts } from '../scene/garden-structure-parts';
import { GardenSceneComponent } from '../scene/garden-scene.component';
import { type ParcelPointer } from '../scene/garden-parcel.component';

import {
  editorExtent,
  EMPTY_GARDEN_PLAN,
  overlappingParcelIds,
  type Parcel,
  type ParcelPlacement,
  parcelFootprint,
  snapToStep,
} from './parcel.model';

type DragSession = {
  readonly parcelId: string;
  readonly grabX: number;
  readonly grabZ: number;
  readonly originXCm: number;
  readonly originZCm: number;
  readonly moved: boolean;
};

const MOBILE_HEIGHT = '24rem';
const DESKTOP_HEIGHT = '34rem';
const SCENE_LABEL = 'Plan du potager vu de dessus, glissez les parcelles pour les disposer';
const CENTIMETRES_PER_METRE = 100;
const CLICK_TOLERANCE_M = 0.04;
const CATCHER_RATIO = 3;
const CATCHER_THICKNESS = 0.01;
const CATCHER_DEPTH = -0.05;
const HANDLE_LIFT = 0.7;
const PLATEAU_INSET = 0.9;
const TOP_CAMERA: SceneCameraOptions = {
  position: [0, 24, 0],
  near: 0.1,
  far: 120,
};

@Component({
  selector: 'app-parcel-placement',
  imports: [
    SceneCanvasComponent,
    SceneContentDirective,
    SceneTopControlsComponent,
    ScenePartComponent,
    GardenSceneComponent,
    CardComponent,
    ButtonComponent,
    NgtArgs,
    NgIcon,
  ],
  template: `
    <div
      class="relative"
      (pointerup)="endDrag()"
      (pointercancel)="endDrag()"
      (pointerleave)="endDrag()"
      (click)="flushMenu()"
    >
      <app-scene-canvas
        orthographic
        [orbit]="false"
        [fog]="false"
        [camera]="topCamera"
        [height]="height()"
        [label]="sceneLabel"
        [bounds]="bounds()"
        [class.cursor-grab]="hoveredId() !== null && !dragging()"
        [class.cursor-grabbing]="dragging()"
      >
        <ng-template sceneContent>
          <app-scene-top-controls [bounds]="bounds()" [pan]="!dragging()" />

          <ngt-mesh [position]="catcherPosition" (pointermove)="onGroundMove($event)">
            <ngt-box-geometry *args="catcherArgs()" />
            <ngt-mesh-basic-material [transparent]="true" [opacity]="0" [depthWrite]="false" />
          </ngt-mesh>

          @for (part of plateauParts(); track part.id) {
            <app-scene-part [part]="part" />
          }

          <app-garden-scene
            [field]="field()"
            [selectedId]="selectedId()"
            [hoveredId]="hoveredId()"
            [invalidIds]="overlapping()"
            [interactiveCells]="false"
            [tilledTerrain]="false"
            (pressed)="onParcelPressed($event)"
            (hoverChange)="hoveredId.set($event)"
          />

          @if (rotateHandle(); as handle) {
            <ngt-group [position]="handle.position">
              @for (part of handle.parts; track part.id) {
                <app-scene-part [part]="part" />
              }
            </ngt-group>
          }
        </ng-template>

        <div sceneOverlay>
          @if (rotatingParcel(); as parcel) {
            <app-card
              class="absolute top-3 left-3 w-64 max-w-[75%]"
              backdrop="blur"
              title="Mode rotation"
              [description]="
                parcel.name + ' · touchez la parcelle pour la faire pivoter d’un quart de tour'
              "
            >
              <div card-footer class="w-full flex-row justify-end">
                <button appButton type="button" variant="outline" size="sm" (click)="exitRotate()">
                  Terminer
                </button>
              </div>
            </app-card>
          } @else if (overlapping().size > 0) {
            <app-card
              class="absolute top-3 left-3 w-64 max-w-[75%]"
              backdrop="blur"
              title="Parcelles superposées"
              description="Écartez les parcelles en rouge avant de valider."
            />
          }

          <div
            class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs"
          >
            <ng-icon name="phosphorArrowsOutCardinal" class="size-3.5" />
            <span class="hidden sm:inline">Glisser pour déplacer · clic droit pour cadrer</span>
            <span class="sm:hidden">Glisser · deux doigts pour cadrer</span>
          </div>
        </div>
      </app-scene-canvas>
    </div>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelPlacementComponent {
  readonly parcels = input.required<readonly Parcel[]>();
  readonly placements = model.required<readonly ParcelPlacement[]>();
  readonly selectedId = model<string | null>(null);
  readonly rotatingId = model<string | null>(null);

  readonly menuRequested = output<string>();

  readonly #viewport = inject(ViewportService);
  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);
  readonly #drag = signal<DragSession | null>(null);
  readonly #pendingMenuId = signal<string | null>(null);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly sceneLabel = SCENE_LABEL;
  protected readonly topCamera = TOP_CAMERA;
  protected readonly catcherPosition: readonly [number, number, number] = [0, CATCHER_DEPTH, 0];

  protected readonly dragging = computed(() => this.#drag() !== null);

  protected readonly height = computed(() =>
    this.#viewport.isMobile() ? MOBILE_HEIGHT : DESKTOP_HEIGHT,
  );

  protected readonly extent = computed(() => editorExtent(this.parcels(), this.placements()));

  protected readonly field = computed(() =>
    buildGardenField(
      {
        ...EMPTY_GARDEN_PLAN,
        parcels: this.parcels(),
        placements: this.placements(),
      },
      this.extent(),
    ),
  );

  protected readonly bounds = computed<SceneBounds>(() => ({
    width: this.field().width,
    depth: this.field().depth,
    height: this.field().height,
  }));

  protected readonly overlapping = computed(() =>
    overlappingParcelIds(this.parcels(), this.placements()),
  );

  protected readonly catcherArgs = computed<readonly number[]>(() => [
    this.field().width * CATCHER_RATIO,
    CATCHER_THICKNESS,
    this.field().depth * CATCHER_RATIO,
  ]);

  protected readonly plateauParts = computed(() =>
    buildPlateauGridParts(
      this.field().width - PLATEAU_INSET,
      this.field().depth - PLATEAU_INSET,
      this.#colors().fieldFurrow,
    ),
  );

  protected readonly rotatingParcel = computed<GardenParcel | null>(() => {
    const rotatingId = this.rotatingId();
    return this.field().parcels.find(parcel => parcel.id === rotatingId) ?? null;
  });

  protected readonly rotateHandle = computed(() => {
    const parcel = this.rotatingParcel();
    if (!parcel) {
      return null;
    }
    return {
      position: [parcel.position[0], parcel.soilTop + HANDLE_LIFT, parcel.position[2]] as const,
      parts: buildRotateHandleParts(this.#colors().highlight),
    };
  });

  protected exitRotate(): void {
    this.rotatingId.set(null);
  }

  protected onParcelPressed(pointer: ParcelPointer): void {
    this.selectedId.set(pointer.id);
    if (this.rotatingId() === pointer.id) {
      this.#rotate(pointer.id);
      return;
    }
    this.rotatingId.set(null);
    const placement = this.placements().find(candidate => candidate.parcelId === pointer.id);
    if (!placement) {
      return;
    }
    this.#drag.set({
      parcelId: pointer.id,
      grabX: pointer.x,
      grabZ: pointer.z,
      originXCm: placement.xCm,
      originZCm: placement.zCm,
      moved: false,
    });
  }

  protected onGroundMove(event: NgtThreeEvent<PointerEvent>): void {
    const session = this.#drag();
    if (!session) {
      return;
    }
    const deltaX = event.point.x - session.grabX;
    const deltaZ = event.point.z - session.grabZ;
    if (
      !session.moved &&
      Math.abs(deltaX) < CLICK_TOLERANCE_M &&
      Math.abs(deltaZ) < CLICK_TOLERANCE_M
    ) {
      return;
    }
    this.#drag.set({ ...session, moved: true });
    this.#move(
      session.parcelId,
      snapToStep(session.originXCm + deltaX * CENTIMETRES_PER_METRE),
      snapToStep(session.originZCm + deltaZ * CENTIMETRES_PER_METRE),
    );
  }

  protected endDrag(): void {
    const session = this.#drag();
    if (!session) {
      return;
    }
    this.#drag.set(null);
    if (session.moved || this.rotatingId() === session.parcelId) {
      return;
    }
    this.#pendingMenuId.set(session.parcelId);
  }

  /**
   * Le menu s'ouvre au clic et non au relâchement du pointeur : le distributeur
   * de clics extérieurs du CDK écoute en phase de capture sur `body`, donc une
   * fenêtre ouverte pendant le `pointerup` serait refermée par le clic qui suit.
   */
  protected flushMenu(): void {
    const parcelId = this.#pendingMenuId();
    if (parcelId === null) {
      return;
    }
    this.#pendingMenuId.set(null);
    this.menuRequested.emit(parcelId);
  }

  #move(parcelId: string, xCm: number, zCm: number): void {
    this.placements.update(placements =>
      placements.map(placement =>
        placement.parcelId === parcelId ? { ...placement, xCm, zCm } : placement,
      ),
    );
  }

  #rotate(parcelId: string): void {
    const parcel = this.parcels().find(candidate => candidate.id === parcelId);
    if (!parcel) {
      return;
    }
    this.placements.update(placements =>
      placements.map(placement => {
        if (placement.parcelId !== parcelId) {
          return placement;
        }
        const before = parcelFootprint(parcel, placement.rotated);
        const after = parcelFootprint(parcel, !placement.rotated);
        const centreX = placement.xCm + before.widthCm / 2;
        const centreZ = placement.zCm + before.depthCm / 2;
        return {
          ...placement,
          rotated: !placement.rotated,
          xCm: snapToStep(centreX - after.widthCm / 2),
          zCm: snapToStep(centreZ - after.depthCm / 2),
        };
      }),
    );
  }
}
