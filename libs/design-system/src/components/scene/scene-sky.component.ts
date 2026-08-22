import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { BackSide, CanvasTexture, type Texture } from 'three';

import { ThemeService } from '../../core/services/theme.service';

import { OPEN_SKY_HAZE } from './scene-canvas.variants';

const DOME_WIDTH_SEGMENTS = 24;
const DOME_HEIGHT_SEGMENTS = 16;
const TEXTURE_HEIGHT = 256;
const TEXTURE_WIDTH = 1;
const HORIZON_ROW = 0.5;
const HAZE_TOP_ROW = 0.38;
const HAZE_EASE_ROW = 0.45;
const HAZE_EASE_ALPHA = 0.4;
const OPAQUE = 1;
const CLEAR = 0;
const BEHIND_EVERYTHING = -1;

function hazeGradient(context: CanvasRenderingContext2D, color: string): CanvasGradient {
  const gradient = context.createLinearGradient(0, 0, 0, TEXTURE_HEIGHT);
  gradient.addColorStop(0, colorWithAlpha(color, CLEAR));
  gradient.addColorStop(HAZE_TOP_ROW, colorWithAlpha(color, CLEAR));
  gradient.addColorStop(HAZE_EASE_ROW, colorWithAlpha(color, HAZE_EASE_ALPHA));
  gradient.addColorStop(HORIZON_ROW, colorWithAlpha(color, OPAQUE));
  gradient.addColorStop(1, colorWithAlpha(color, OPAQUE));
  return gradient;
}

function colorWithAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;
  return `rgba(${red},${green},${blue},${alpha})`;
}

function domeTexture(document: Document, color: string): Texture | null {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (context === null) {
    return null;
  }
  context.fillStyle = hazeGradient(context, color);
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  return new CanvasTexture(canvas);
}

/**
 * Bande de brume posée sur l'horizon du monde : opaque au niveau de l'œil et
 * en dessous, effacée quelques degrés plus haut. Le sol lointain, teinté de la
 * même couleur par le brouillard, s'y fond sans couture, quel que soit l'angle
 * de la caméra — ce qu'un fond en CSS, solidaire du cadre et non du monde, ne
 * peut pas faire.
 */
@Component({
  selector: 'app-scene-sky',
  imports: [NgtArgs],
  template: `
    @if (texture(); as map) {
      <ngt-mesh [renderOrder]="behindEverything">
        <ngt-sphere-geometry *args="[radius(), domeWidthSegments, domeHeightSegments]" />
        <ngt-mesh-basic-material
          [map]="map"
          [side]="backSide"
          [transparent]="true"
          [depthWrite]="false"
          [fog]="false"
          [toneMapped]="false"
        />
      </ngt-mesh>
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appSceneSky',
})
export class SceneSkyComponent {
  readonly radius = input.required<number>();

  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #theme = inject(ThemeService);
  readonly #texture = signal<Texture | null>(null);
  #previous: Texture | null = null;

  protected readonly backSide = BackSide;
  protected readonly behindEverything = BEHIND_EVERYTHING;
  protected readonly domeWidthSegments = DOME_WIDTH_SEGMENTS;
  protected readonly domeHeightSegments = DOME_HEIGHT_SEGMENTS;
  protected readonly texture = this.#texture.asReadonly();

  readonly #haze = computed(() =>
    this.#theme.isDark() ? OPEN_SKY_HAZE.dark : OPEN_SKY_HAZE.light,
  );

  constructor() {
    effect(() => {
      const haze = this.#haze();
      if (!this.#isBrowser) {
        return;
      }
      const next = domeTexture(this.#document, haze);
      this.#previous?.dispose();
      this.#previous = next;
      this.#texture.set(next);
    });

    inject(DestroyRef).onDestroy(() => this.#previous?.dispose());
  }
}
