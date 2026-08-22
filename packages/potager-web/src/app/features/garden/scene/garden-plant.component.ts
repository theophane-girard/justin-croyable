import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  type ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { SceneThemeService, ViewportService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';
import { beforeRender } from 'angular-three';
import { type Group } from 'three';

import { type CropId } from '../../../core/potager.model';

import { type PlantSpot } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { PLANT_MODEL_BY_CROP } from './plant-models';
import { buildPlantParts } from './plant-parts';

const SWAY_SPEED = 0.9;
const CROSS_SWAY_RATIO = 0.7;
const CROSS_SWAY_AMPLITUDE = 0.6;
const GROWTH_SPEED = 2.4;
const GROWTH_STAGGER = 0.12;
const MIN_GROWTH_SCALE = 0.05;
const FULL_SCALE = 1;
const NO_SWAY = 0;

@Component({
  selector: 'app-garden-plant',
  imports: [ScenePartComponent],
  template: `
    <ngt-group #plant [position]="spot().position" [rotation]="spot().rotation">
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenPlantComponent {
  readonly cropId = input.required<CropId>();
  readonly spot = input.required<PlantSpot>();

  private readonly plantGroup = viewChild<ElementRef<Group>>('plant');

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);
  readonly #viewport = inject(ViewportService);

  protected readonly parts = computed(() =>
    buildPlantParts(this.cropId(), this.#colors(), this.spot().seed),
  );

  readonly #sway = computed(() =>
    this.#viewport.prefersReducedMotion() ? NO_SWAY : PLANT_MODEL_BY_CROP[this.cropId()].sway,
  );

  constructor() {
    beforeRender(({ clock }) => {
      const group = this.plantGroup()?.nativeElement;
      if (!group) {
        return;
      }
      const spot = this.spot();
      const sway = this.#sway();
      if (sway === NO_SWAY) {
        group.rotation.z = NO_SWAY;
        group.rotation.x = NO_SWAY;
        group.scale.set(spot.spreadScale, spot.heightScale, spot.spreadScale);
        return;
      }
      const elapsed = clock.elapsedTime;
      const phase = spot.phase;
      group.rotation.z = Math.sin(elapsed * SWAY_SPEED + phase) * sway;
      group.rotation.x =
        Math.cos(elapsed * SWAY_SPEED * CROSS_SWAY_RATIO + phase) * sway * CROSS_SWAY_AMPLITUDE;
      const growth = Math.max(
        MIN_GROWTH_SCALE,
        Math.min(FULL_SCALE, elapsed * GROWTH_SPEED - phase * GROWTH_STAGGER),
      );
      group.scale.set(
        spot.spreadScale * growth,
        spot.heightScale * growth,
        spot.spreadScale * growth,
      );
    });
  }
}
