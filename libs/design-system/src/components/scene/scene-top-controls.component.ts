import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { MOUSE, OrthographicCamera, TOUCH, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { SceneBounds } from './scene-part';

const DAMPING_FACTOR = 0.12;
const ZOOM_SPEED = 0.9;
const FRAME_PADDING = 1.1;
const MIN_ZOOM_RATIO = 0.35;
const MAX_ZOOM_RATIO = 6;
const CAMERA_ALTITUDE_RATIO = 4;
const MIN_CAMERA_ALTITUDE = 20;
const FALLBACK_PIXELS = 800;
const PERSPECTIVE_ALTITUDE_RATIO = 1.25;

/** La caméra regarde vers -Y ; « haut de l'écran » devient donc -Z. */
const TOP_DOWN_UP = new Vector3(0, 0, -1);
const SCENE_ORIGIN = new Vector3(0, 0, 0);

function fitZoom(pixelWidth: number, pixelHeight: number, bounds: SceneBounds): number {
  const width = Math.max(bounds.width, Number.EPSILON);
  const depth = Math.max(bounds.depth, Number.EPSILON);
  return Math.min(pixelWidth / width, pixelHeight / depth) / FRAME_PADDING;
}

/**
 * Caméra verrouillée à la verticale, en vue de dessus : la rotation est
 * interdite, seuls le déplacement (clic droit ou deux doigts) et le zoom
 * (molette ou pincement) restent. Le bouton gauche est laissé libre pour que la
 * scène puisse gérer ses propres manipulations d'objets.
 *
 * Prévu pour une `app-scene-canvas` en `orthographic` : la projection écran ↔
 * sol y est linéaire, donc un glisser-déposer est aussi précis que sur un plan
 * en deux dimensions. Fonctionne aussi en perspective, avec la déformation que
 * cela implique sur les bords.
 *
 * À utiliser à la place de `app-scene-orbit-controls`, donc avec
 * `[orbit]="false"` sur la coquille.
 */
@Component({
  selector: 'app-scene-top-controls',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appSceneTopControls',
})
export class SceneTopControlsComponent {
  readonly bounds = input.required<SceneBounds>();
  readonly enabled = input(true);
  readonly pan = input(true);

  readonly #store = injectStore();

  #framedWidth = 0;
  #framedDepth = 0;

  constructor() {
    const camera = this.#store.camera();
    const controls = new OrbitControls(camera, this.#store.gl().domElement);
    controls.enableRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = DAMPING_FACTOR;
    controls.zoomSpeed = ZOOM_SPEED;
    controls.screenSpacePanning = true;
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    };
    controls.touches = { ONE: null, TWO: TOUCH.DOLLY_PAN };
    controls.addEventListener('change', () => this.#store.snapshot.invalidate());

    camera.up.copy(TOP_DOWN_UP);

    effect(() => {
      controls.enabled = this.enabled();
      controls.enablePan = this.enabled() && this.pan();
    });

    effect(() => {
      const size = this.#store.size();
      const bounds = this.bounds();
      const pixelWidth = size.width > 0 ? size.width : FALLBACK_PIXELS;
      const pixelHeight = size.height > 0 ? size.height : FALLBACK_PIXELS;

      const zoom = fitZoom(pixelWidth, pixelHeight, bounds);
      if (camera instanceof OrthographicCamera) {
        controls.minZoom = zoom * MIN_ZOOM_RATIO;
        controls.maxZoom = zoom * MAX_ZOOM_RATIO;
      }

      if (this.#framedWidth === bounds.width && this.#framedDepth === bounds.depth) {
        controls.update();
        this.#store.snapshot.invalidate();
        return;
      }
      this.#framedWidth = bounds.width;
      this.#framedDepth = bounds.depth;

      if (camera instanceof OrthographicCamera) {
        camera.zoom = zoom;
        camera.position.set(
          0,
          Math.max(MIN_CAMERA_ALTITUDE, bounds.height * CAMERA_ALTITUDE_RATIO),
          0,
        );
      } else {
        const span = Math.max(bounds.width, bounds.depth);
        camera.position.set(0, span * PERSPECTIVE_ALTITUDE_RATIO, 0);
      }

      camera.up.copy(TOP_DOWN_UP);
      camera.lookAt(SCENE_ORIGIN);
      camera.updateProjectionMatrix();
      controls.target.copy(SCENE_ORIGIN);
      controls.update();
      this.#store.snapshot.invalidate();
    });

    beforeRender(() => controls.update());

    inject(DestroyRef).onDestroy(() => controls.dispose());
  }
}
