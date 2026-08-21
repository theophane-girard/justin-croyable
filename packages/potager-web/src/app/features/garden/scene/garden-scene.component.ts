import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { ThemeService } from '@justin-croyable/design-system';

import { type GardenField } from './garden-layout';
import { GardenSceneThemeService } from './garden-scene-theme';
import { buildFieldParts } from './garden-structure-parts';
import { GardenBedComponent } from './garden-bed.component';
import { GardenOrbitControlsComponent } from './garden-orbit-controls.component';
import { ScenePartComponent } from './scene-part.component';
import { type SceneVector } from './scene-part';

type SceneLighting = {
  readonly ambient: number;
  readonly hemisphere: number;
  readonly sun: number;
  readonly fill: number;
};

const DAY_LIGHTING: SceneLighting = { ambient: 0.5, hemisphere: 0.6, sun: 1.65, fill: 0.3 };
const NIGHT_LIGHTING: SceneLighting = { ambient: 0.5, hemisphere: 0.62, sun: 1.3, fill: 0.5 };

const SUN_POSITION: SceneVector = [7, 11, 5];
const FILL_POSITION: SceneVector = [-8, 5, -6];
const FOG_NEAR_RATIO = 1.1;
const FOG_FAR_RATIO = 3.4;

@Component({
  selector: 'app-garden-scene',
  imports: [NgtArgs, ScenePartComponent, GardenBedComponent, GardenOrbitControlsComponent],
  template: `
    <ngt-fog attach="fog" *args="fogArgs()" />
    <ngt-ambient-light [intensity]="lighting().ambient" />
    <ngt-hemisphere-light
      [intensity]="lighting().hemisphere"
      [color]="colors().sky"
      [groundColor]="colors().fieldSoil"
    />
    <ngt-directional-light [position]="sunPosition" [intensity]="lighting().sun" />
    <ngt-directional-light
      [position]="fillPosition"
      [intensity]="lighting().fill"
      [color]="colors().leafBright"
    />

    <app-garden-orbit-controls [width]="field().width" [depth]="field().depth" />

    @for (part of fieldParts(); track part.id) {
      <app-scene-part [part]="part" />
    }

    @for (bed of field().beds; track bed.id) {
      <app-garden-bed
        [bed]="bed"
        [selected]="bed.id === selectedId()"
        [hovered]="bed.id === hoveredId()"
        (picked)="picked.emit($event)"
        (hoverChange)="hoverChange.emit($event)"
      />
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenSceneComponent {
  readonly field = input.required<GardenField>();
  readonly selectedId = input<string | null>(null);
  readonly hoveredId = input<string | null>(null);

  readonly picked = output<string>();
  readonly hoverChange = output<string | null>();

  readonly #theme = inject(GardenSceneThemeService);
  readonly #themeMode = inject(ThemeService);

  protected readonly sunPosition = SUN_POSITION;
  protected readonly fillPosition = FILL_POSITION;

  protected readonly colors = this.#theme.colors;

  protected readonly lighting = computed<SceneLighting>(() =>
    this.#themeMode.isDark() ? NIGHT_LIGHTING : DAY_LIGHTING,
  );

  protected readonly fogArgs = computed(() => {
    const extent = this.field().extent;
    return [this.colors().sky, extent * FOG_NEAR_RATIO, extent * FOG_FAR_RATIO];
  });

  protected readonly fieldParts = computed(() =>
    buildFieldParts(this.field().width, this.field().depth, this.colors()),
  );
}
