import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { ViewportService } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import {
  cropUnit,
  formatQuantity,
  type PlantRow,
} from '../../../core/potager.model';

import { buildGardenField } from './garden-layout';
import { GardenSceneComponent } from './garden-scene.component';

type FocusInfo = {
  readonly label: string;
  readonly detail: string;
};

const MOBILE_PLANT_BUDGET = 3;
const DESKTOP_PLANT_BUDGET = 6;
const MOBILE_DPR: [number, number] = [1, 1.5];
const DESKTOP_DPR: [number, number] = [1, 2];
const CAMERA_OPTIONS = { fov: 42, near: 0.1, far: 240 } as const;
const GL_OPTIONS = { antialias: true, alpha: true } as const;
const PLANT_SUFFIX = 'plant';
const PLANT_SUFFIX_PLURAL = 'plants';
const DETAIL_SEPARATOR = ' · ';

@Component({
  selector: 'app-garden-view',
  imports: [NgtCanvas, GardenSceneComponent, NgIcon],
  template: `
    <div
      class="border-border from-muted to-background relative h-[22rem] w-full overflow-hidden rounded-xl border bg-gradient-to-b sm:h-[28rem] lg:h-[34rem]"
      [class.cursor-pointer]="hoveredId() !== null"
    >
      <ngt-canvas
        class="block size-full"
        [gl]="glOptions"
        [camera]="cameraOptions"
        [dpr]="dpr()"
      >
        <app-garden-scene
          *canvasContent
          [field]="field()"
          [selectedId]="selectedId()"
          [hoveredId]="hoveredId()"
          (picked)="onPicked($event)"
          (hoverChange)="hoveredId.set($event)"
        />
      </ngt-canvas>

      @if (focus(); as info) {
        <div
          class="bg-card/85 border-border absolute top-3 left-3 max-w-[70%] rounded-lg border px-3 py-2 shadow-sm backdrop-blur"
        >
          <p class="text-foreground truncate text-sm font-medium">{{ info.label }}</p>
          <p class="text-muted-foreground text-xs">{{ info.detail }}</p>
        </div>
      }

      <div
        class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs"
      >
        <ng-icon name="phosphorArrowClockwise" class="size-3.5" />
        <span class="hidden sm:inline">Glisser pour tourner · molette pour zoomer</span>
        <span class="sm:hidden">Glisser · pincer</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenViewComponent {
  readonly rows = input.required<readonly PlantRow[]>();
  readonly selectedId = model<string | null>(null);

  readonly #viewport = inject(ViewportService);

  protected readonly hoveredId = signal<string | null>(null);
  protected readonly cameraOptions = CAMERA_OPTIONS;
  protected readonly glOptions = GL_OPTIONS;

  protected readonly dpr = computed(() => (this.#viewport.isMobile() ? MOBILE_DPR : DESKTOP_DPR));

  protected readonly field = computed(() =>
    buildGardenField(
      this.rows(),
      this.#viewport.isMobile() ? MOBILE_PLANT_BUDGET : DESKTOP_PLANT_BUDGET,
    ),
  );

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
