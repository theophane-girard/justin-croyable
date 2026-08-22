import { type Camera, MathUtils, Spherical, Vector3 } from 'three';
import { type OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FULL_TURN = Math.PI * 2;
const HALF_TURN = Math.PI;
const TWO_FINGERS = 2;
const LOCK_THRESHOLD_PX = 12;

/**
 * Deux doigts ne gardent jamais un écart parfaitement constant : le pincement
 * doit nettement l'emporter sur les autres mesures pour être lu comme un zoom,
 * sinon la moindre respiration des doigts changerait d'échelle.
 */
const ZOOM_DOMINANCE = 1.5;
const TILT_SPEED = 0.9;
const TOUCH_POINTER = 'touch';

const GESTURE = {
  undecided: 'undecided',
  zoom: 'zoom',
  turn: 'turn',
  tilt: 'tilt',
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

function bearing(points: readonly Point[]): number {
  return Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
}

/** Ramène un écart d'angle dans [-π, π] pour ignorer les tours complets. */
function shortestTurn(delta: number): number {
  const wrapped = (delta + HALF_TURN) % FULL_TURN;
  return (wrapped < 0 ? wrapped + FULL_TURN : wrapped) - HALF_TURN;
}

/**
 * Gestes à deux doigts exclusifs, calqués sur un plan : pincer zoome, tourner
 * les doigts fait pivoter la scène, glisser vers le haut couche la caméra vers
 * l'horizon et glisser vers le bas la redresse à la verticale. Le premier
 * mouvement décide et le geste s'y tient jusqu'au relâchement — `DOLLY_ROTATE`
 * d'`OrbitControls` mêlait zoom et rotation, et ne connaissait pas la torsion.
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
  let startBearing = 0;
  let lastSpan = 0;
  let lastCentre: Point = { x: 0, y: 0 };
  let lastBearing = 0;

  function orbit(deltaTheta: number, deltaPhi: number): void {
    offset.copy(camera.position).sub(controls.target);
    spherical.setFromVector3(offset);
    spherical.theta += deltaTheta;
    spherical.phi = MathUtils.clamp(
      spherical.phi + deltaPhi,
      controls.minPolarAngle,
      controls.maxPolarAngle,
    );
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
    startBearing = bearing(points);
    lastSpan = startSpan;
    lastCentre = startCentre;
    lastBearing = startBearing;
  }

  /**
   * Les trois mesures sont ramenées à des pixels — l'arc parcouru par un doigt
   * pour la torsion — afin d'être comparables entre elles.
   */
  function decide(points: readonly Point[]): void {
    const pinched = Math.abs(span(points) - startSpan);
    const turned =
      Math.abs(shortestTurn(bearing(points) - startBearing)) * (startSpan / TWO_FINGERS);
    const tilted = Math.abs(centre(points).y - startCentre.y);
    if (Math.max(pinched, turned, tilted) < LOCK_THRESHOLD_PX) {
      return;
    }
    if (pinched > Math.max(turned, tilted) * ZOOM_DOMINANCE) {
      gesture = GESTURE.zoom;
      return;
    }
    gesture = turned > tilted ? GESTURE.turn : GESTURE.tilt;
  }

  function apply(points: readonly Point[]): void {
    const currentSpan = span(points);
    const currentCentre = centre(points);
    const currentBearing = bearing(points);
    if (gesture === GESTURE.zoom && currentSpan > 0) {
      zoom(lastSpan / currentSpan);
    }
    if (gesture === GESTURE.turn) {
      orbit(shortestTurn(currentBearing - lastBearing), 0);
    }
    if (gesture === GESTURE.tilt) {
      orbit(0, ((lastCentre.y - currentCentre.y) * FULL_TURN * TILT_SPEED) / element.clientHeight);
    }
    lastSpan = currentSpan;
    lastCentre = currentCentre;
    lastBearing = currentBearing;
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
    apply(points);
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
