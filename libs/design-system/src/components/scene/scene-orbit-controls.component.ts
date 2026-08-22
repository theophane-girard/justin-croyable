import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { ViewportService } from '../../core/services/viewport.service';

import type { SceneBounds } from './scene-part';

const DAMPING_FACTOR = 0.075;
const MIN_POLAR_ANGLE = Math.PI / 8;
const MAX_POLAR_ANGLE = Math.PI / 2.25;
const MIN_DISTANCE_RATIO = 0.08;
const MAX_DISTANCE_RATIO = 1.9;
const ROTATE_SPEED = 0.65;
const ZOOM_SPEED = 0.7;
const AUTO_ROTATE_SPEED = 0.35;
const FRAME_PADDING = 1.16;
const FALLBACK_ASPECT = 1.6;
const FALLBACK_FOV = 42;
const HALVING = 2;
const TARGET_HEIGHT_RATIO = 0.28;

const VIEW_DIRECTION = new Vector3(0.62, 0.54, 0.78).normalize();
const WORLD_UP = new Vector3(0, 1, 0);

function projectedHalfExtent(axis: Vector3, halfExtents: Vector3): number {
  return (
    Math.abs(axis.x) * halfExtents.x +
    Math.abs(axis.y) * halfExtents.y +
    Math.abs(axis.z) * halfExtents.z
  );
}

function fitDistance(fov: number, aspect: number, bounds: SceneBounds): number {
  const right = new Vector3().crossVectors(WORLD_UP, VIEW_DIRECTION).normalize();
  const up = new Vector3().crossVectors(VIEW_DIRECTION, right).normalize();
  const halfExtents = new Vector3(
    bounds.width / HALVING,
    bounds.height / HALVING,
    bounds.depth / HALVING,
  );
  const tangentVertical = Math.tan((fov * MathUtils.DEG2RAD) / HALVING);
  const tangentHorizontal = tangentVertical * aspect;
  return (
    Math.max(
      projectedHalfExtent(up, halfExtents) / tangentVertical,
      projectedHalfExtent(right, halfExtents) / tangentHorizontal,
    ) * FRAME_PADDING
  );
}

@Component({
  selector: 'app-scene-orbit-controls',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appSceneOrbitControls',
})
export class SceneOrbitControlsComponent {
  readonly bounds = input.required<SceneBounds>();
  readonly autoRotate = input(false);
  readonly enabled = input(true);
  readonly pan = input(false);

  readonly #store = injectStore();
  readonly #viewport = inject(ViewportService);

  #framedWidth = 0;
  #framedDepth = 0;
  #recenter: () => void = () => void 0;

  constructor() {
    const camera = this.#store.camera();
    const controls = new OrbitControls(camera, this.#store.gl().domElement);
    controls.enableDamping = true;
    controls.dampingFactor = DAMPING_FACTOR;
    controls.screenSpacePanning = false;
    controls.rotateSpeed = ROTATE_SPEED;
    controls.zoomSpeed = ZOOM_SPEED;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    controls.minPolarAngle = MIN_POLAR_ANGLE;
    controls.maxPolarAngle = MAX_POLAR_ANGLE;
    controls.addEventListener('change', () => this.#store.snapshot.invalidate());

    effect(() => {
      controls.enabled = this.enabled();
      controls.autoRotate = this.autoRotate() && !this.#viewport.prefersReducedMotion();
    });

    effect(() => {
      const size = this.#store.size();
      const bounds = this.bounds();
      const aspect = size.height > 0 ? size.width / size.height : FALLBACK_ASPECT;
      const fov = camera instanceof PerspectiveCamera ? camera.fov : FALLBACK_FOV;
      const distance = fitDistance(fov, aspect, bounds);
      controls.minDistance = distance * MIN_DISTANCE_RATIO;
      controls.maxDistance = distance * MAX_DISTANCE_RATIO;
      if (this.#framedWidth === bounds.width && this.#framedDepth === bounds.depth) {
        return;
      }
      this.#framedWidth = bounds.width;
      this.#framedDepth = bounds.depth;
      controls.target.set(0, bounds.height * TARGET_HEIGHT_RATIO, 0);
      camera.position.copy(controls.target).addScaledVector(VIEW_DIRECTION, distance);
      controls.update();
    });

    beforeRender(() => controls.update());

    this.#recenter = () => {
      const bounds = this.bounds();
      const size = this.#store.size();
      const aspect =
        size.height > 0 ? size.width / size.height : FALLBACK_ASPECT;
      const fov =
        camera instanceof PerspectiveCamera ? camera.fov : FALLBACK_FOV;
      controls.target.set(0, bounds.height * TARGET_HEIGHT_RATIO, 0);
      camera.position
        .copy(controls.target)
        .addScaledVector(VIEW_DIRECTION, fitDistance(fov, aspect, bounds));
      controls.update();
      this.#store.snapshot.invalidate();
    };

    inject(DestroyRef).onDestroy(() => controls.dispose());
  }

  /** Ramène la caméra sur son cadrage d'origine, après déplacement ou zoom. */
  recenter(): void {
    this.#recenter();
  }
}
