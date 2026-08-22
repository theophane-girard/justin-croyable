# Scène 3D (`@justin-croyable/design-system/components/scene`)

Socle 3D du Design System, bâti sur [`angular-three`](https://angularthree.org)
(NGT) et `three`.

## Pourquoi un import profond

Ce dossier n'est **pas** réexporté depuis `src/index.ts`. `three` pèse plusieurs
centaines de kilooctets : le laisser entrer dans le barrel le ferait entrer dans
le graphe de dépendances de toutes les applications, y compris celles qui
n'affichent aucune scène. L'accès se fait donc uniquement par :

```ts
import { SceneImports, withThree } from '@justin-croyable/design-system/components/scene';
```

## Activation

`withThree()` fournit `provideNgtRenderer()`, qui remplace `RendererFactory2`
pour la portée où il est déclaré. À poser **au niveau de la route**, pas à la
racine : three.js reste ainsi hors du bundle initial.

```ts
// mon-module.routes.ts
export const ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./atelier.component').then((m) => m.AtelierComponent),
    providers: [provideJustinCroyableDS(withThree())],
  },
];
```

## Composer une scène

```html
<app-scene-canvas
  height="26rem"
  label="Aperçu de la pièce en trois dimensions"
  [bounds]="bounds"
  [autoRotate]="true"
>
  <ng-template sceneContent>
    @for (part of parts(); track part.id) {
    <app-scene-part [part]="part" />
    }
  </ng-template>

  <div sceneOverlay class="absolute top-3 left-3">…</div>
</app-scene-canvas>
```

`app-scene-canvas` apporte le dimensionnement, le fond dégradé suivant le thème,
le brouillard, l'éclairage trois points, l'orbite, le squelette de chargement et
`role="img"` + `aria-label`. Le gabarit `sceneContent` est instancié dans l'arbre
NGT ; le contenu marqué `sceneOverlay` reste du DOM, au-dessus du canvas.

### `bounds`

`{ width, depth, height }` en unités de scène. Sert au cadrage automatique de la
caméra (qui tient compte du ratio du canvas), aux distances de brouillard et à la
position des lumières. Une scène dont les dimensions changent est recadrée.

### `frameloop`

`demand` par défaut : une image n'est produite que lorsque la scène change ou que
l'utilisateur manipule la caméra. Une scène animée en continu doit passer
`frameloop="always"`.

### `sky`

`none` par défaut : dégradé neutre suivant le thème. `open` peint un ciel
ouvert, bleu clair en thème clair et semé d'étoiles en thème sombre. Les teintes
de brume qui ferment le bas de ce ciel sont exportées via `OPEN_SKY_HAZE` : une
scène qui veut un horizon donne cette couleur à son brouillard pour que le sol
s'y dissolve sans couture.

### `orbitNavigation`

`orbit` par défaut : le glissement fait tourner la scène, comme une maquette que
l'on retourne. `map` la fait défiler comme un plan — glisser (ou un doigt)
déplace, le clic droit (ou deux doigts) pivote et abaisse la caméra, la molette
(ou le pincement) zoome. `orbitAzimuth` et `orbitElevation` donnent en degrés
l'angle de la vue au premier cadrage et au recentrage, et `orbitTargetLift`
relève le point visé — la scène descend dans le cadre et le ciel entre par le
haut, sans coucher la caméra.

### `fog`

`true` par défaut : brouillard déduit des `bounds`. `false` le supprime.
Un objet `SceneFog` (`{ color, near, far }`) impose ses propres distances, par
exemple pour dissoudre un sol lointain dans le ciel plutôt que la scène elle-même.

## Géométrie déclarative

`app-scene-part` rend un maillage décrit par un objet `ScenePart` — géométrie,
arguments de constructeur, transformation, couleur, rugosité. La géométrie se
décrit donc en TypeScript testable plutôt qu'en gabarits dupliqués :

```ts
const parts = sceneParts('socle', [
  { geometry: SCENE_GEOMETRY.box, args: [2, 0.2, 2], color: colors().ground },
  {
    geometry: SCENE_GEOMETRY.sphere,
    args: [0.4, 16, 12],
    position: [0, 0.6, 0],
    color: colors().accent,
  },
]);
```

`sceneNoise` / `sceneNoiseRange` fournissent un aléa **déterministe** à partir
d'une graine : deux rendus successifs de la même scène sont identiques, ce qui
rend les captures de référence stables.

## Couleurs

`SceneThemeService` (exporté depuis le barrel principal, sans dépendance à
three) résout les tokens du thème en hexadécimal utilisable par WebGL :

- `roles` : palette générique prête à l'emploi (`ground`, `surface`, `accent`,
  `series1..6`, `success`…), déclinée clair/sombre ;
- `palette(tokens)` : résolveur pour une palette métier, construite avec
  `sceneRamp(ramp, step, lightness?, chroma?)` et `sceneSemantic(name, …)`.

Les deux suivent la palette active de l'application (fuchsia, emerald…) puisque
les valeurs sont lues dans les variables CSS, et se recalculent au changement de
thème.

## Accessibilité

- `label` est **obligatoire** : le canvas est annoncé comme `role="img"`.
- `autoRotate` est ignoré quand l'utilisateur a demandé `prefers-reduced-motion`
  (`ViewportService.prefersReducedMotion`). Une scène qui anime son propre
  contenu doit faire de même.
