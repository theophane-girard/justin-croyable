# Skeletons de route partagés

Système de skeletons de chargement dépendant du **type de page** ciblé, partagé
entre les apps. Deux couches :

- **Présentation** (`components/skeleton` + `components/page-skeletons`) :
  primitives (`sk-line`, `sk-text`, `sk-block`, `sk-circle`) et skeletons de page
  (`app-list-skeleton`, `app-detail-skeleton`, `app-dashboard-skeleton`,
  `app-map-skeleton`, `app-form-skeleton`, `app-grid-skeleton`,
  `app-generic-skeleton`). Purement présentationnels, sans dépendance au Router.
- **Router** (`core/skeleton`) : `RouteSkeletonStore`, registry par token,
  `provideRouteSkeletons()`, `app-skeleton-outlet`, `*skeletonWhile`,
  `withLoadingDelay`. Ne connaît jamais les composants concrets — l’app les câble
  via le registry.

## 1. Déclarer le type de page sur la route

```ts
import { SKELETON_KIND } from '@justin-croyable/design-system';

export const routes: Routes = [
  { path: '', loadComponent: ..., data: { skeleton: SKELETON_KIND.dashboard } },
  { path: 'items', loadComponent: ..., data: { skeleton: SKELETON_KIND.list } },
  { path: 'items/:id', loadComponent: ..., data: { skeleton: SKELETON_KIND.detail } },
];
```

## 2. Enregistrer le catalogue

```ts
import {
  DEFAULT_ROUTE_SKELETONS,
  GenericSkeletonComponent,
  provideRouteSkeletons,
} from '@justin-croyable/design-system';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouteSkeletons({
      registry: DEFAULT_ROUTE_SKELETONS,
      fallback: GenericSkeletonComponent,
      appearDelayMs: 120,
      minVisibleMs: 400,
    }),
  ],
};
```

Une lib de feature peut enregistrer ses propres skeletons sans toucher la config
de l’app, grâce au token `multi` :

```ts
provideRouteSkeletonKinds({ carto: CartoSkeletonComponent });
```

## 3. Afficher

```html
<app-skeleton-outlet>
  <router-outlet />
</app-skeleton-outlet>
```

Le `@if` est **à l’intérieur** de l’outlet, jamais autour du `router-outlet` :
l’outlet n’est jamais détruit. Le contenu est masqué en CSS (`invisible`, pas
`hidden`) pour préserver la mise en page et éviter le saut de scroll.

## 4. Niveau composant

Pour brancher les mêmes skeletons sur un état de chargement local :

```html
<div *skeletonWhile="items.isLoading(); kind: 'list'">…</div>
```

Même registry, même anti-flicker (`withLoadingDelay`).

## Ajouter un nouveau type de page

1. Un composant présentationnel sans input requis (instanciable par
   `NgComponentOutlet`).
2. Une entrée de registry (`{ carto: CartoSkeletonComponent }`).
3. Une clé `data: { skeleton: 'carto' }` sur la route.

Pour garder le typage, augmenter `SkeletonKindMap` :

```ts
declare module '@justin-croyable/design-system' {
  interface SkeletonKindMap {
    carto: unknown;
  }
}
```

Aucune modification du store ni de l’outlet.

## Anti-flicker

`withLoadingDelay(appearDelayMs, minVisibleMs)` :

- **Délai d’apparition** (~120 ms) : rien ne s’affiche sur les navigations
  instantanées.
- **Durée minimale** (~400 ms) : évite le flash quand le contenu arrive juste
  après l’apparition.

Les deux valeurs sont configurables via `provideRouteSkeletons`.

## Le piège `NavigationEnd`

`NavigationEnd` signale le chargement du **composant**, pas des **données**. Deux
stratégies :

- **Resolver sur la route** → `NavigationEnd` attend la donnée, le skeleton de
  route couvre tout le cycle. Simple, mais navigation bloquante (l’URL ne change
  qu’à la fin).
- **Skeleton local** via `*skeletonWhile` → le skeleton de route ne couvre que le
  chargement du chunk, la page prend le relais avec le même composant skeleton.
  Meilleur compromis dans la plupart des cas.
