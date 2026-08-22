import { type Camera, MathUtils, Spherical, Vector3 } from 'three';
import { type OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FULL_TURN = Math.PI * 2;
const TWO_FINGERS = 2;
const LOCK_THRESHOLD_PX = 12;

/**
 * Deux doigts qui glissent ensemble ne gardent jamais un écart parfaitement
 * constant : c'est le mouvement dominant qui décide, et le pincement doit
 * nettement l'emporter pour être lu comme un zoom plutôt qu'une rotation.
 */
const ZOOM_DOMINANCE = 1.5;
const ROTATE_SPEED = 0.9;
const TOUCH_POINTER = 'touch';

const GESTURE = {
  undecided: 'undecided',
  zoom: 'zoom',
  rotate: 'rotate',
} as const;

type Gesture = (typeof GESTURE)[keyof typeof GESTURE];

type Point = {
  readonly x: number;
  readonly y: number;
};

function span(points: readonly Point[]): number {
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function centre(points: readonly Point[]): Point {
  return {
    x: (points[0].x + points[1].x) / TWO_FINGERS,
    y: (points[0].y + points[1].y) / TWO_FINGERS,
  };
}

/**
 * Gestes à deux doigts exclusifs : le premier mouvement décide s'il s'agit d'un
 * pincement ou d'une rotation, et le geste s'y tient jusqu'au relâchement.
 * `DOLLY_ROTATE` d'`OrbitControls` mêle les deux, et la moindre rotation
 * emportait un zoom — d'où des pivots qui sautaient d'échelle.
 */
export function bindMapGestures(
  element: HTMLElement,
  camera: Camera,
  controls: OrbitControls,
  invalidate: () => void,
): () => void {
  const pointers = new Map<number, Point>();
  const offset = new Vector3();
  const spherical = new Spherical();

  let gesture: Gesture = GESTURE.undecided;
  let startSpan = 0;
  let startCentre: Point = { x: 0, y: 0 };
  let lastSpan = 0;
  let lastCentre: Point = { x: 0, y: 0 };

  function rotate(deltaX: number, deltaY: number): void {
    offset.copy(camera.position).sub(controls.target);
    spherical.setFromVector3(offset);
    spherical.theta -= (FULL_TURN * deltaX * ROTATE_SPEED) / element.clientHeight;
    spherical.phi -= (FULL_TURN * deltaY * ROTATE_SPEED) / element.clientHeight;
    spherical.phi = MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    spherical.makeSafe();
    camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
  }

  function zoom(factor: number): void {
    offset.copy(camera.position).sub(controls.target);
    const distance = MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance,
    );
    camera.position.copy(controls.target).add(offset.setLength(distance));
  }

  function trackedPoints(): readonly Point[] {
    return Array.from(pointers.values());
  }

  function onDown(event: PointerEvent): void {
    if (event.pointerType !== TOUCH_POINTER) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size !== TWO_FINGERS) {
      return;
    }
    const points = trackedPoints();
    gesture = GESTURE.undecided;
    startSpan = span(points);
    startCentre = centre(points);
    lastSpan = startSpan;
    lastCentre = startCentre;
  }

  function decide(points: readonly Point[]): void {
    const pinched = Math.abs(span(points) - startSpan);
    const moved = centre(points);
    const slid = Math.hypot(moved.x - startCentre.x, moved.y - startCentre.y);
    if (Math.max(pinched, slid) < LOCK_THRESHOLD_PX) {
      return;
    }
    gesture = pinched > slid * ZOOM_DOMINANCE ? GESTURE.zoom : GESTURE.rotate;
  }

  function onMove(event: PointerEvent): void {
    if (event.pointerType !== TOUCH_POINTER || !pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size !== TWO_FINGERS) {
      return;
    }
    const points = trackedPoints();
    if (gesture === GESTURE.undecided) {
      decide(points);
    }
    const currentSpan = span(points);
    const currentCentre = centre(points);
    if (gesture === GESTURE.zoom && currentSpan > 0) {
      zoom(lastSpan / currentSpan);
    }
    if (gesture === GESTURE.rotate) {
      rotate(currentCentre.x - lastCentre.x, currentCentre.y - lastCentre.y);
    }
    lastSpan = currentSpan;
    lastCentre = currentCentre;
    if (gesture !== GESTURE.undecided) {
      controls.update();
      invalidate();
    }
  }

  function onRelease(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    gesture = GESTURE.undecided;
  }

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onRelease);
  element.addEventListener('pointercancel', onRelease);

  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onRelease);
    element.removeEventListener('pointercancel', onRelease);
  };
}
