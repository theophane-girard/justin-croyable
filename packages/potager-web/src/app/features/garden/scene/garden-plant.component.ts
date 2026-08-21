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
import { beforeRender } from 'angular-three';
import { type Group } from 'three';

import { type CropId } from '../../../core/potager.model';

import { GardenSceneThemeService } from './garden-scene-theme';
import { type PlantSpot } from './garden-layout';
import { PLANT_MODEL_BY_CROP } from './plant-models';
import { buildPlantParts } from './plant-parts';
import { ScenePartComponent } from './scene-part.component';

const SWAY_SPEED = 0.9;
const GROWTH_SPEED = 2.4;

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

  readonly #theme = inject(GardenSceneThemeService);

  protected readonly parts = computed(() =>
    buildPlantParts(this.cropId(), this.#theme.colors(), this.spot().seed),
  );

  readonly #sway = computed(() => PLANT_MODEL_BY_CROP[this.cropId()].sway);

  constructor() {
    beforeRender(({ clock }) => {
      const group = this.plantGroup()?.nativeElement;
      if (!group) {
        return;
      }
      const elapsed = clock.elapsedTime;
      const phase = this.spot().phase;
      group.rotation.z = Math.sin(elapsed * SWAY_SPEED + phase) * this.#sway();
      group.rotation.x = Math.cos(elapsed * SWAY_SPEED * 0.7 + phase) * this.#sway() * 0.6;
      const growth = Math.min(1, elapsed * GROWTH_SPEED - phase * 0.12);
      group.scale.setScalar(Math.max(0.05, growth));
    });
  }
}
