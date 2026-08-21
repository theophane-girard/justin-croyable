import type { DesignSystemFeature } from '../../providers/provide-design-system';
import { provideNgtRenderer } from 'angular-three/dom';

import { extendSceneCatalogue } from './three-catalogue';

const THREE_FEATURE_KIND = 'three';

/**
 * Active le rendu 3D du Design System : moteur de rendu `angular-three` et
 * catalogue d'éléments `ngt-*` utilisés par `app-scene-canvas`.
 *
 * `provideNgtRenderer()` remplace `RendererFactory2` pour la portée où il est
 * fourni. À déclarer au niveau de la route qui affiche la scène plutôt qu'à la
 * racine de l'application : three.js reste alors hors du bundle initial et les
 * autres écrans gardent le moteur de rendu DOM d'Angular.
 *
 * @example
 * // app.routes.ts
 * {
 *   path: 'atelier',
 *   loadComponent: () => import('./atelier.component').then(m => m.AtelierComponent),
 *   providers: [provideJustinCroyableDS(withThree())],
 * }
 */
export function withThree(): DesignSystemFeature {
  extendSceneCatalogue();
  return { kind: THREE_FEATURE_KIND, providers: [provideNgtRenderer()] };
}
