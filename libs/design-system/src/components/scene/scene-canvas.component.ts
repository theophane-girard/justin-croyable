import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import type { NgtFrameloop } from 'angular-three';
import type { ClassValue } from 'clsx';

import { ViewportService } from '../../core/services/viewport.service';
import { SCENE_DEFAULTS } from '../../providers/tokens';
import { mergeClasses } from '../../utils/merge-classes';

import { sceneCanvasVariants } from './scene-canvas.variants';

import { SceneEnvironmentComponent, type SceneLighting, SCENE_LIGHTING } from './scene-environment.component';
import { SceneOrbitControlsComponent } from './scene-orbit-controls.component';
import type { SceneBounds } from './scene-part';

const DEFAULT_BOUNDS: SceneBounds = { width: 4, depth: 4, height: 2 };
const CAMERA_OPTIONS = { fov: 42, near: 0.1, far: 400 } as const;
const GL_OPTIONS = { antialias: true, alpha: true } as const;
const DEMAND_FRAMELOOP: NgtFrameloop = 'demand';

/**
 * Contenu 3D d'une `app-scene-canvas`.
 *
 * Le gabarit est instancié *dans* l'arbre `angular-three`, à côté de
 * l'éclairage et des contrôles fournis par la coquille.
 *
 * @example
 * <app-scene-canvas>
 *   <ng-template sceneContent>
 *     <app-scene-part [part]="part" />
 *   </ng-template>
 * </app-scene-canvas>
 */
@Directive({ selector: 'ng-template[sceneContent]' })
export class SceneContentDirective {}

/**
 * Coquille d'une scène 3D : dimensionnement, fond dégradé suivant le thème,
 * brouillard, éclairage trois points, orbite, squelette de chargement et
 * étiquette d'accessibilité.
 *
 * Le rendu est en `demand` par défaut : une image n'est produite que lorsque la
 * scène change ou que l'utilisateur manipule la caméra. Une scène animée en
 * continu doit passer `frameloop="always"`.
 *
 * Nécessite `withThree()` dans `provideJustinCroyableDS(...)`.
 */
@Component({
  selector: 'app-scene-canvas',
  imports: [NgtCanvas, NgTemplateOutlet, SceneEnvironmentComponent, SceneOrbitControlsComponent],
  template: `
    <ngt-canvas
      class="block size-full"
      [gl]="glOptions"
      [camera]="cameraOptions"
      [dpr]="dpr()"
      [frameloop]="frameloop()"
    >
      <ng-container *canvasContent>
        <app-scene-environment [bounds]="bounds()" [lighting]="lighting()" [fog]="fog()" />
        @if (orbit()) {
          <app-scene-orbit-controls [bounds]="bounds()" [autoRotate]="autoRotate()" />
        }
        <ng-container [ngTemplateOutlet]="contentTemplate()" />
      </ng-container>
    </ngt-canvas>

    @if (loading()) {
      <div
        data-slot="scene-skeleton"
        role="status"
        aria-busy="true"
        class="bg-background absolute inset-0 flex items-center justify-center"
      >
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" class="text-accent h-2/5 animate-skeleton">
          <path d="M50 12 L86 32 L86 68 L50 88 L14 68 L14 32 Z" stroke-width="6" stroke-linejoin="round" />
          <path d="M50 12 L50 50 M50 50 L86 32 M50 50 L14 32" stroke-width="4" />
        </svg>
      </div>
    }

    <ng-content select="[sceneOverlay]" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'scene-canvas',
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[attr.aria-busy]': 'loading()',
    '[class]': 'classes()',
    '[style.height]': 'height()',
  },
  exportAs: 'appSceneCanvas',
})
export class SceneCanvasComponent {
  readonly #defaults = inject(SCENE_DEFAULTS);
  readonly #viewport = inject(ViewportService);

  readonly bounds = input<SceneBounds>(DEFAULT_BOUNDS);
  readonly lighting = input<SceneLighting>(SCENE_LIGHTING.auto);
  readonly frameloop = input<NgtFrameloop>(DEMAND_FRAMELOOP);
  readonly fog = input(true);
  readonly orbit = input(true);
  readonly autoRotate = input(false);
  readonly loading = input(false);
  readonly label = input.required<string>();
  readonly height = input<string>(this.#defaults.height);
  readonly class = input<ClassValue>('');

  private readonly sceneContent = contentChild(SceneContentDirective, { read: TemplateRef });

  protected readonly cameraOptions = CAMERA_OPTIONS;
  protected readonly glOptions = GL_OPTIONS;

  protected readonly contentTemplate = computed(() => this.sceneContent() ?? null);

  protected readonly dpr = computed(() =>
    this.#viewport.isMobile() ? this.#defaults.mobileDpr : this.#defaults.dpr,
  );

  protected readonly classes = computed(() => mergeClasses(sceneCanvasVariants(), this.class()));
}
