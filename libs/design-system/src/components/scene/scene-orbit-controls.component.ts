import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { MathUtils, MOUSE, PerspectiveCamera, TOUCH, Vector3 } from 'three';
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

export const DEFAULT_AZIMUTH_DEGREES = 38.5;
export const DEFAULT_ELEVATION_DEGREES = 28.5;
const WORLD_UP = new Vector3(0, 1, 0);

/**
 * Deux façons de naviguer : `orbit` fait tourner la scène au glissement, comme
 * une maquette que l'on retourne ; `map` la fait défiler, comme un plan que
 * l'on pousse du doigt — un doigt déplace, deux doigts zooment, pivotent et
 * abaissent la caméra.
 */
export const SCENE_NAVIGATION = {
  orbit: 'orbit',
  map: 'map',
} as const;

export type SceneNavigation = (typeof SCENE_NAVIGATION)[keyof typeof SCENE_NAVIGATION];

const ORBIT_MOUSE = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN } as const;
const MAP_MOUSE = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE } as const;
const ORBIT_TOUCH = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN } as const;
const MAP_TOUCH = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE } as const;

function viewDirection(elevationDegrees: number, azimuthDegrees: number): Vector3 {
  const elevation = elevationDegrees * MathUtils.DEG2RAD;
  const azimuth = azimuthDegrees * MathUtils.DEG2RAD;
  return new Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  ).normalize();
}

function projectedHalfExtent(axis: Vector3, halfExtents: Vector3): number {
  return (
    Math.abs(axis.x) * halfExtents.x +
    Math.abs(axis.y) * halfExtents.y +
    Math.abs(axis.z) * halfExtents.z
  );
}

function fitDistance(fov: number, aspect: number, bounds: SceneBounds, direction: Vector3): number {
  const right = new Vector3().crossVectors(WORLD_UP, direction).normalize();
  const up = new Vector3().crossVectors(direction, right).normalize();
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
  readonly elevation = input(DEFAULT_ELEVATION_DEGREES);
  readonly azimuth = input(DEFAULT_AZIMUTH_DEGREES);
  readonly enabled = input(true);
  readonly navigation = input<SceneNavigation>(SCENE_NAVIGATION.orbit);

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
      const map = this.navigation() === SCENE_NAVIGATION.map;
      controls.mouseButtons = { ...(map ? MAP_MOUSE : ORBIT_MOUSE) };
      controls.touches = { ...(map ? MAP_TOUCH : ORBIT_TOUCH) };
    });

    effect(() => {
      const size = this.#store.size();
      const bounds = this.bounds();
      const aspect = size.height > 0 ? size.width / size.height : FALLBACK_ASPECT;
      const fov = camera instanceof PerspectiveCamera ? camera.fov : FALLBACK_FOV;
      const direction = viewDirection(this.elevation(), this.azimuth());
      const distance = fitDistance(fov, aspect, bounds, direction);
      controls.minDistance = distance * MIN_DISTANCE_RATIO;
      controls.maxDistance = distance * MAX_DISTANCE_RATIO;
      if (this.#framedWidth === bounds.width && this.#framedDepth === bounds.depth) {
        return;
      }
      this.#framedWidth = bounds.width;
      this.#framedDepth = bounds.depth;
      controls.target.set(0, bounds.height * TARGET_HEIGHT_RATIO, 0);
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.update();
    });

    beforeRender(() => controls.update());

    this.#recenter = () => {
      const bounds = this.bounds();
      const size = this.#store.size();
      const aspect = size.height > 0 ? size.width / size.height : FALLBACK_ASPECT;
      const fov = camera instanceof PerspectiveCamera ? camera.fov : FALLBACK_FOV;
      const direction = viewDirection(this.elevation(), this.azimuth());
      controls.target.set(0, bounds.height * TARGET_HEIGHT_RATIO, 0);
      camera.position
        .copy(controls.target)
        .addScaledVector(direction, fitDistance(fov, aspect, bounds, direction));
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
