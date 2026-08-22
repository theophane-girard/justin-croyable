import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { provideJustinCroyableDS, SceneThemeService } from '@justin-croyable/design-system';
import {
  SCENE_GEOMETRY,
  type SceneBounds,
  type SceneCanvasSkyVariants,
  SceneImports,
  type SceneLighting,
  type ScenePart,
  ScenePartComponent,
  type ScenePartDraft,
  sceneParts,
  withThree,
} from '@justin-croyable/design-system/components/scene';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { beforeRender, type NgtFrameloop } from 'angular-three';
import type { Group } from 'three';
import { expect, waitFor } from 'storybook/test';

const GROUND_SIZE = 4.6;
const GROUND_THICKNESS = 0.24;
const PEDESTAL_RADIUS = 0.42;
const PEDESTAL_HEIGHT = 0.14;
const SHOWCASE_COLUMNS = 3;
const SHOWCASE_SPACING = 1.35;
const SHAPE_HEIGHT = 0.72;
const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const ORIGIN_ROTATION: [number, number, number] = [0, 0, 0];
const ORIGIN_POSITION: [number, number, number] = [0, 0, 0];

type ShowcaseShape = {
  readonly geometry: (typeof SCENE_GEOMETRY)[keyof typeof SCENE_GEOMETRY];
  readonly args: number[];
  readonly flat: boolean;
};

const SHOWCASE_SHAPES: readonly ShowcaseShape[] = [
  { geometry: SCENE_GEOMETRY.box, args: [0.52, 0.52, 0.52], flat: false },
  { geometry: SCENE_GEOMETRY.sphere, args: [0.32, 18, 14], flat: false },
  { geometry: SCENE_GEOMETRY.cylinder, args: [0.26, 0.26, 0.56, 18], flat: false },
  { geometry: SCENE_GEOMETRY.cone, args: [0.3, 0.62, 18], flat: false },
  { geometry: SCENE_GEOMETRY.capsule, args: [0.2, 0.3, 6, 14], flat: false },
  { geometry: SCENE_GEOMETRY.torus, args: [0.28, 0.1, 12, 28], flat: false },
  { geometry: SCENE_GEOMETRY.icosahedron, args: [0.36, 0], flat: false },
  { geometry: SCENE_GEOMETRY.circle, args: [0.34, 20], flat: true },
  { geometry: SCENE_GEOMETRY.ring, args: [0.16, 0.34, 22], flat: true },
];

const SHOWCASE_BOUNDS: SceneBounds = { width: GROUND_SIZE, depth: GROUND_SIZE, height: 1.6 };

const SPIN_SPEED = 0.35;

@Component({
  selector: 'app-scene-spinner',
  imports: [ScenePartComponent],
  template: `
    <ngt-group #spinner [position]="part().position">
      <app-scene-part [part]="centeredPart()" />
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SceneSpinnerComponent {
  readonly part = input.required<ScenePart>();
  readonly mounted = output<void>();

  private readonly spinner = viewChild<ElementRef<Group>>('spinner');

  protected readonly centeredPart = computed<ScenePart>(() => ({
    ...this.part(),
    position: ORIGIN_POSITION,
  }));

  #rendered = false;

  constructor() {
    beforeRender(({ clock }) => {
      const group = this.spinner()?.nativeElement;
      if (!group) {
        return;
      }
      group.rotation.y = clock.elapsedTime * SPIN_SPEED;
      if (this.#rendered) {
        return;
      }
      this.#rendered = true;
      this.mounted.emit();
    });
  }
}

@Component({
  selector: 'app-scene-showcase',
  imports: [...SceneImports, SceneSpinnerComponent],
  template: `
    <app-scene-canvas
      [height]="height()"
      [label]="label()"
      [bounds]="bounds"
      [lighting]="lighting()"
      [orbit]="orbit()"
      [autoRotate]="autoRotate()"
      [fog]="fog()"
      [sky]="sky()"
      [loading]="loading()"
      [frameloop]="frameloop()"
    >
      <ng-template sceneContent>
        @for (part of groundParts(); track part.id) {
          <app-scene-part [part]="part" />
        }
        @for (part of shapeParts(); track part.id) {
          <app-scene-spinner [part]="part" (mounted)="onSpinnerMounted()" />
        }
      </ng-template>

      <div
        sceneOverlay
        class="bg-card/85 border-border text-muted-foreground absolute top-3 left-3 rounded-lg border px-3 py-2 text-xs backdrop-blur"
      >
        <span data-testid="scene-mounted-count">{{ mountedCount() }}</span> géométries animées ·
        couleurs issues de <span class="font-mono">SceneThemeService</span>
      </div>
    </app-scene-canvas>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SceneShowcaseComponent {
  readonly height = input('26rem');
  readonly label = input('Vitrine des géométries du socle 3D');
  readonly lighting = input<SceneLighting>('auto');
  readonly frameloop = input<NgtFrameloop>('demand');
  readonly orbit = input(true);
  readonly autoRotate = input(false);
  readonly fog = input(true);
  readonly sky = input<SceneCanvasSkyVariants>('none');
  readonly loading = input(false);

  readonly #sceneTheme = inject(SceneThemeService);

  protected readonly bounds = SHOWCASE_BOUNDS;

  protected readonly mountedCount = signal(0);

  readonly #layout = computed(() => {
    const colors = this.#sceneTheme.roles();
    const series = [
      colors.series1,
      colors.series2,
      colors.series3,
      colors.series4,
      colors.series5,
      colors.series6,
      colors.success,
      colors.warning,
      colors.info,
    ];
    const rows = Math.ceil(SHOWCASE_SHAPES.length / SHOWCASE_COLUMNS);
    const placements = SHOWCASE_SHAPES.map((shape, index) => {
      const column = index % SHOWCASE_COLUMNS;
      const row = Math.floor(index / SHOWCASE_COLUMNS);
      return {
        shape,
        color: series[index],
        x: (column - (SHOWCASE_COLUMNS - 1) / 2) * SHOWCASE_SPACING,
        z: (row - (rows - 1) / 2) * SHOWCASE_SPACING,
      };
    });
    return { colors, placements };
  });

  protected readonly groundParts = computed<ScenePart[]>(() => {
    const { colors, placements } = this.#layout();
    const ground: ScenePartDraft = {
      geometry: SCENE_GEOMETRY.box,
      args: [GROUND_SIZE, GROUND_THICKNESS, GROUND_SIZE],
      position: [0, -GROUND_THICKNESS / 2, 0],
      color: colors.ground,
      roughness: 1,
    };
    const pedestals = placements.map(
      ({ x, z }): ScenePartDraft => ({
        geometry: SCENE_GEOMETRY.cylinder,
        args: [PEDESTAL_RADIUS, PEDESTAL_RADIUS, PEDESTAL_HEIGHT, 20],
        position: [x, PEDESTAL_HEIGHT / 2, z],
        color: colors.groundAlt,
        roughness: 1,
      }),
    );
    return sceneParts('ground', [ground, ...pedestals]);
  });

  protected onSpinnerMounted(): void {
    this.mountedCount.update(count => count + 1);
  }

  protected readonly shapeParts = computed<ScenePart[]>(() =>
    sceneParts(
      'shape',
      this.#layout().placements.map(
        ({ shape, color, x, z }): ScenePartDraft => ({
          geometry: shape.geometry,
          args: shape.args,
          position: [x, PEDESTAL_HEIGHT + SHAPE_HEIGHT / 2, z],
          rotation: shape.flat ? FLAT_ROTATION : ORIGIN_ROTATION,
          color,
          roughness: 0.55,
          flatShading: shape.geometry === SCENE_GEOMETRY.icosahedron,
        }),
      ),
    ),
  );
}

type SceneArgs = {
  height: string;
  label: string;
  lighting: SceneLighting;
  frameloop: NgtFrameloop;
  orbit: boolean;
  autoRotate: boolean;
  fog: boolean;
  sky: SceneCanvasSkyVariants;
  loading: boolean;
};

const meta: Meta<SceneArgs> = {
  title: 'Composants/Scène 3D',
  decorators: [
    applicationConfig({ providers: [provideJustinCroyableDS(withThree())] }),
    moduleMetadata({ imports: [SceneShowcaseComponent] }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Socle 3D du DS (`angular-three` + `three`), importé en profondeur depuis `@justin-croyable/design-system/components/scene` pour garder three.js hors du bundle des applications qui n'affichent pas de scène. Volontairement une seule story : chaque story 3D crée un contexte WebGL, coûteux à l'exécution des stories comme tests Vitest en navigateur — les variantes s'explorent donc par les contrôles plutôt que par des stories multiples.",
      },
    },
  },
  argTypes: {
    height: { control: 'text' },
    label: { control: 'text' },
    lighting: { control: 'inline-radio', options: ['auto', 'day', 'night'] },
    frameloop: { control: 'inline-radio', options: ['demand', 'always'] },
    orbit: { control: 'boolean' },
    autoRotate: { control: 'boolean' },
    fog: { control: 'boolean' },
    sky: { control: 'inline-radio', options: ['none', 'open'] },
    loading: { control: 'boolean' },
  },
  args: {
    height: '26rem',
    label: 'Vitrine des géométries du socle 3D',
    lighting: 'auto',
    frameloop: 'demand',
    orbit: true,
    autoRotate: false,
    fog: true,
    sky: 'none',
    loading: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-scene-showcase
        [height]="height"
        [label]="label"
        [lighting]="lighting"
        [frameloop]="frameloop"
        [orbit]="orbit"
        [autoRotate]="autoRotate"
        [fog]="fog"
        [sky]="sky"
        [loading]="loading"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<SceneArgs>;

export const Vitrine: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await waitFor(
      () => {
        const found = canvasElement.querySelector('canvas');
        expect(found).toBeTruthy();
        return found as HTMLCanvasElement;
      },
      { timeout: 20_000 },
    );

    expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.getContext('webgl2') ?? canvas.getContext('webgl')).toBeTruthy();

    const shell = canvasElement.querySelector('[data-slot="scene-canvas"]');
    expect(shell?.getAttribute('role')).toBe('img');
    expect(shell?.getAttribute('aria-label')).toBe('Vitrine des géométries du socle 3D');

    await waitFor(
      () => {
        const mounted = canvasElement.querySelector('[data-testid="scene-mounted-count"]');
        expect(mounted?.textContent?.trim()).toBe(String(SHOWCASE_SHAPES.length));
      },
      { timeout: 15_000 },
    );
  },
};
