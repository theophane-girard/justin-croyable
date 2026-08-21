import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgtArgs } from 'angular-three';

import { SceneThemeService } from '../../core/services/scene-theme.service';
import { ThemeService } from '../../core/services/theme.service';

import type { SceneBounds, SceneVector } from './scene-part';

export const SCENE_LIGHTING = {
  auto: 'auto',
  day: 'day',
  night: 'night',
} as const;

export type SceneLighting = (typeof SCENE_LIGHTING)[keyof typeof SCENE_LIGHTING];

type LightingPreset = {
  readonly ambient: number;
  readonly hemisphere: number;
  readonly key: number;
  readonly fill: number;
};

const DAY_PRESET: LightingPreset = { ambient: 0.5, hemisphere: 0.6, key: 1.65, fill: 0.3 };
const NIGHT_PRESET: LightingPreset = { ambient: 0.5, hemisphere: 0.62, key: 1.3, fill: 0.5 };

const KEY_DIRECTION: SceneVector = [0.62, 1, 0.45];
const FILL_DIRECTION: SceneVector = [-0.7, 0.45, -0.55];
const LIGHT_DISTANCE_RATIO = 1.4;
const FOG_NEAR_RATIO = 1.1;
const FOG_FAR_RATIO = 3.4;

function scaledDirection(direction: SceneVector, distance: number): SceneVector {
  return [direction[0] * distance, direction[1] * distance, direction[2] * distance];
}

@Component({
  selector: 'app-scene-environment',
  imports: [NgtArgs],
  template: `
    @if (fog()) {
      <ngt-fog attach="fog" *args="fogArgs()" />
    }
    <ngt-ambient-light [intensity]="preset().ambient" />
    <ngt-hemisphere-light
      [intensity]="preset().hemisphere"
      [color]="colors().sky"
      [groundColor]="colors().ground"
    />
    <ngt-directional-light [position]="keyPosition()" [intensity]="preset().key" />
    <ngt-directional-light
      [position]="fillPosition()"
      [intensity]="preset().fill"
      [color]="colors().accentSoft"
    />
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appSceneEnvironment',
})
export class SceneEnvironmentComponent {
  readonly bounds = input.required<SceneBounds>();
  readonly lighting = input<SceneLighting>(SCENE_LIGHTING.auto);
  readonly fog = input(true);

  readonly #sceneTheme = inject(SceneThemeService);
  readonly #theme = inject(ThemeService);

  protected readonly colors = this.#sceneTheme.roles;

  readonly #extent = computed(() => Math.max(this.bounds().width, this.bounds().depth));

  readonly #isNight = computed(() => {
    const lighting = this.lighting();
    if (lighting === SCENE_LIGHTING.auto) {
      return this.#theme.isDark();
    }
    return lighting === SCENE_LIGHTING.night;
  });

  protected readonly preset = computed(() => (this.#isNight() ? NIGHT_PRESET : DAY_PRESET));

  protected readonly keyPosition = computed(() =>
    scaledDirection(KEY_DIRECTION, this.#extent() * LIGHT_DISTANCE_RATIO),
  );

  protected readonly fillPosition = computed(() =>
    scaledDirection(FILL_DIRECTION, this.#extent() * LIGHT_DISTANCE_RATIO),
  );

  protected readonly fogArgs = computed(() => {
    const extent = this.#extent();
    return [this.colors().sky, extent * FOG_NEAR_RATIO, extent * FOG_FAR_RATIO];
  });
}
