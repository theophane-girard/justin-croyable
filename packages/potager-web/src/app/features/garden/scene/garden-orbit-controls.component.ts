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

const DAMPING_FACTOR = 0.075;
const MIN_POLAR_ANGLE = Math.PI / 8;
const MAX_POLAR_ANGLE = Math.PI / 2.25;
const MIN_DISTANCE_RATIO = 0.3;
const MAX_DISTANCE_RATIO = 1.9;
const TARGET_HEIGHT = 0.4;
const ROTATE_SPEED = 0.65;
const ZOOM_SPEED = 0.7;
const SCENE_HEIGHT = 2.6;
const FRAME_PADDING = 1.06;
const FALLBACK_ASPECT = 1.6;
const FALLBACK_FOV = 42;
const HALVING = 2;

const VIEW_DIRECTION = new Vector3(0.62, 0.54, 0.78).normalize();
const WORLD_UP = new Vector3(0, 1, 0);

function projectedHalfExtent(axis: Vector3, halfExtents: Vector3): number {
  return (
    Math.abs(axis.x) * halfExtents.x +
    Math.abs(axis.y) * halfExtents.y +
    Math.abs(axis.z) * halfExtents.z
  );
}

function fitDistance(fov: number, aspect: number, width: number, depth: number): number {
  const right = new Vector3().crossVectors(WORLD_UP, VIEW_DIRECTION).normalize();
  const up = new Vector3().crossVectors(VIEW_DIRECTION, right).normalize();
  const halfExtents = new Vector3(width / HALVING, SCENE_HEIGHT / HALVING, depth / HALVING);
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
  selector: 'app-garden-orbit-controls',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenOrbitControlsComponent {
  readonly width = input.required<number>();
  readonly depth = input.required<number>();

  readonly #store = injectStore();

  #framedWidth = 0;
  #framedDepth = 0;

  constructor() {
    const camera = this.#store.camera();
    const controls = new OrbitControls(camera, this.#store.gl().domElement);
    controls.enableDamping = true;
    controls.dampingFactor = DAMPING_FACTOR;
    controls.enablePan = false;
    controls.rotateSpeed = ROTATE_SPEED;
    controls.zoomSpeed = ZOOM_SPEED;
    controls.minPolarAngle = MIN_POLAR_ANGLE;
    controls.maxPolarAngle = MAX_POLAR_ANGLE;
    controls.target.set(0, TARGET_HEIGHT, 0);

    effect(() => {
      const size = this.#store.size();
      const width = this.width();
      const depth = this.depth();
      const aspect = size.height > 0 ? size.width / size.height : FALLBACK_ASPECT;
      const fov = camera instanceof PerspectiveCamera ? camera.fov : FALLBACK_FOV;
      const distance = fitDistance(fov, aspect, width, depth);
      controls.minDistance = distance * MIN_DISTANCE_RATIO;
      controls.maxDistance = distance * MAX_DISTANCE_RATIO;
      if (this.#framedWidth === width && this.#framedDepth === depth) {
        return;
      }
      this.#framedWidth = width;
      this.#framedDepth = depth;
      camera.position.copy(controls.target).addScaledVector(VIEW_DIRECTION, distance);
      controls.update();
    });

    beforeRender(() => controls.update());

    inject(DestroyRef).onDestroy(() => controls.dispose());
  }
}
