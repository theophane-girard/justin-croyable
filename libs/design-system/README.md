# @justin-croyable/design-system

Design System **web** (Angular). Les composants viennent de zard (`form-test`) : standalone,
signals, `ChangeDetectionStrategy.OnPush`, `ViewEncapsulation.None` — le style vient de
Tailwind, pas du Shadow DOM.

Le pendant mobile est [`@justin-croyable/mobile-ds`](../mobile-ds) (React Native / NativeWind).
Les deux libs partagent le vocabulaire de tokens (`primary`, `muted`, `destructive`, …) mais
pas le code : rien n'est censé être importé de l'une dans l'autre.

## Installation dans une app du monorepo

```jsonc
// package.json de l'app
{
  "dependencies": {
    "@justin-croyable/design-system": "*"
  }
}
```

La lib est **source-only** : `main` pointe sur `src/index.ts`, il n'y a pas d'étape de build.
L'app compile donc les sources, ce qui suppose que son compilateur Angular les voie. Dans un
tsconfig d'app, mapper le paquet sur son chemin réel (et non sur le lien symbolique
`node_modules`, que ngtsc traiterait comme un paquet précompilé sans `.d.ts`) :

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@justin-croyable/design-system": ["../../libs/design-system/src/index.ts"],
      "@justin-croyable/design-system/*": ["../../libs/design-system/src/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

Voir `packages/storybook-web` pour un exemple complet et fonctionnel.

## Preset Tailwind

Tailwind v4 n'a plus de presets JavaScript : **le preset d'un DS est un fichier CSS**.
L'app fournit Tailwind et le plugin d'animations, puis importe le preset :

```css
/* styles.css de l'app */
@layer ng-icon, theme, base, components, utilities; /* ng-icon avant base */

@import 'tailwindcss';
@plugin "tailwindcss-animate";

@import '@justin-croyable/design-system/theme.css';

/* Choix de la palette : importer un fichier de palette APRÈS le preset.
   Sans cette ligne, le DS reste sur `fuchsia` (palette par défaut). */
@import '@justin-croyable/design-system/palettes/emerald.css';

/* Les classes des composants du DS sont hors de l'arborescence de l'app, et
   Tailwind ignore node_modules (`.gitignore`) : redéclarer la source par son
   chemin réel, sinon les utilitaires propres au DS sont purgés. */
@source '../../../libs/design-system/src/components';
```

C'est volontairement l'app qui possède les lignes `@import 'tailwindcss'` et `@plugin` : les
imports d'un CSS se résolvent depuis le dossier du fichier qui les contient, donc un preset
qui importerait ses propres outils exigerait que `tailwindcss` soit résolvable depuis
`libs/design-system`. Faux ici, où la racine hoiste Tailwind 3 pour le track NativeWind
pendant que le DS web tourne sur Tailwind 4.

Points d'entrée exportés :

| Export | Contenu |
| --- | --- |
| `@justin-croyable/design-system/theme.css` | Le preset : rôles, bascule dark, `@theme inline`, couche `base`. Importe `primitives.css` + la palette `fuchsia` par défaut. |
| `@justin-croyable/design-system/primitives.css` | Valeurs **partagées** entre palettes : sémantiques, décoratives, typo, rayon. Importé par `theme.css`. |
| `@justin-croyable/design-system/palettes/<nom>.css` | Une **palette** (identité de marque) : rampes `brand`/`primary`/`gray` + rôles + série de graphiques (`--chart-1..6`), clair et sombre. `fuchsia`, `emerald`. |
| `@justin-croyable/design-system/tailwind.preset` | Preset **JS** de compatibilité (Tailwind v3, `@config`, outillage). |

### Palettes

Une **palette** porte l'identité chromatique de marque (rampes `brand` /
`primary` / `gray` + rôles `--color-*`, en clair et en sombre) **et une série de
graphiques** (`--chart-1..6`) : un jeu catégoriel **curé à la main** pour cette
palette, menant sur sa teinte de marque. Les charts sont donc assortis à la
palette active. Les sémantiques (`--success`…), les décoratives
(orange/lime/cyan/violet/rose) et la typo sont **partagées** (`primitives.css`) :
elles ne changent pas d'une palette à l'autre — c'est voulu, ces teintes sont
placées à des valeurs absolues pour ne pas se confondre entre elles ni avec la
marque.

La série de graphiques est **choisie et ordonnée à la main** par palette : les
couleurs *et* leur ordre sont pensés pour que des séries voisines restent
distinctes (un ordre séquentiel de teintes proches, ou une rotation mécanique,
tasse le rendu). Valeurs **littérales** (pas de `calc(var(--brand-hue)…)`) :
`ThemePaletteService` les lit via `getComputedStyle` pour peindre le canvas
ECharts, qui exige des couleurs concrètes.

| Palette | Teinte | Rôle |
| --- | --- | --- |
| `fuchsia` | 323 (magenta) | Par défaut. Importée par `theme.css`, aucun réglage requis. |
| `emerald` | 160 (vert) | Optionnelle. `@import '.../palettes/emerald.css';` après `theme.css`. |

**Choisir une palette** = importer son fichier CSS après `theme.css` (c'est la
« conf » côté Tailwind v4). Le preset JS (v3) lit les variables CSS, il suit donc
la palette sans configuration supplémentaire. **Ajouter une palette** = déposer un
`palettes/<nom>.css` sur le même contrat de tokens (prendre `fuchsia.css` comme
gabarit et changer la teinte). Un point d'attention : la série `--chart-1..6` ne
se déduit pas mécaniquement de la teinte de marque — **choisir les couleurs et
leur ordre à la main** pour que des séries voisines restent discernables.

**Prévisualiser** : le Storybook web expose une toolbar « Palette » (fuchsia /
emerald) qui bascule la palette au runtime sur toutes les stories — pratique pour
comparer, sans rebuild. Voir la story `Design System/Tokens › Palette`.

### Tokens

- `primitives.css` — les valeurs **partagées** : sémantiques (`--success`, `--warning`,
  `--error`, `--info`), palette décorative (orange, lime, cyan, violet, rose), typo
  (`--font-display`, `--font-body`, `--font-mono`) et rayon. Les écarts de perception qui
  justifient les cinq teintes décoratives sont documentés dans le fichier.
- `palettes/<nom>.css` — l'identité de marque **par palette** : rampes `--brand-*`,
  `--primary-*`, `--gray-*` et rôles (`--color-brand`, `--color-action`, `--color-bg`, …),
  clair et sombre.
- `theme.css` — les **rôles** (`--background`, `--primary`, `--brand`, `--muted`, `--ring`, …)
  adossés aux primitives, plus l'exposition en utilitaires : `bg-brand` / `bg-brand-600`
  (rampe de marque) et `font-display` / `font-body` / `font-mono` (les tokens seulement — le
  chargement des fontes reste à la charge de l'app). Les composants ne référencent que des
  rôles : retheming = surcharger les primitives (ou les rôles) après l'import, sans toucher un
  composant.

Le mode sombre est la classe `.dark` sur l'élément racine (`@custom-variant dark`).

### Preset JS (compatibilité)

`tailwind.preset.js` expose les mêmes noms de tokens sous forme d'objet de config, pour un
consommateur Tailwind v3 ou un outil qui veut lire les tokens par programme. Limite connue en
v3 : les rôles pointent vers des variables contenant une couleur complète (`oklch(...)`), donc
les modificateurs d'opacité (`bg-primary/80`) ne peuvent pas être calculés. En v4, `theme.css`
gère ce cas nativement via `color-mix()`.

## Composants

20 composants, importables globalement ou à l'unité
(`@justin-croyable/design-system/components/button`) :

badge · breadcrumb · button · calendar · card · combobox · command · date-picker · divider ·
empty · input · input-group · layout (layout / header / footer / content / sidebar) · loader ·
popover · select · skeleton · switch · tabs · tooltip

Les groupes composables exportent un tableau d'imports prêt à l'emploi : `SelectImports`,
`CommandImports`, `TooltipImports`, `LayoutImports`, `BreadcrumbImports`.

## Filtres réactifs dans l'URL : `injectQueryFilters()`

Synchronise les filtres d'une page (tableau, liste de cards…) avec les query params de l'URL.
L'URL est la **source de vérité unique** : la lecture initiale, l'application des filtres et la
réaction aux navigations (précédent / suivant, lien partagé) passent toutes par le même flux
réactif — aucun code d'initialisation dédié. Les valeurs par défaut ne sont pas écrites dans
l'URL (URL propre), et les écritures fusionnent les params existants (`queryParamsHandling:
'merge'`) sans polluer l'historique (`replaceUrl` par défaut).

À appeler dans un contexte d'injection (initialiseur de champ ou constructeur). Chaque filtre est
décrit par un **codec** typé ; codecs fournis : `stringFilter`, `numberFilter`, `booleanFilter`,
`enumFilter`, `arrayFilter` (multi-select) et `sortFilter` (tri).

```typescript
import {
  arrayFilter,
  enumFilter,
  injectQueryFilters,
  sortFilter,
  stringFilter,
} from '@justin-croyable/design-system';

export class CatalogComponent {
  protected readonly filters = injectQueryFilters({
    search: stringFilter(),
    tags: arrayFilter(),
    sort: sortFilter(['name', 'date'], { field: 'name', direction: 'asc' }),
  });

  // Réactif : dérivé de l'URL, se ré-applique tout seul à l'init et sur navigation.
  protected readonly rows = computed(() =>
    filterAndSort(this.store.rows(), this.filters.value()),
  );
}
```

```html
<!-- Lecture : un signal par filtre, directement sur `filters`. Écriture : set / patch / reset. -->
<app-input
  [value]="filters.search()"
  (valueChange)="filters.set('search', $event)"
/>
<button appButton variant="ghost" (click)="filters.reset()">Réinitialiser</button>
```

- `filters.<clé>()` — signal en lecture par filtre (idéal pour `[value]` et les `computed`).
- `filters.value()` — signal de l'objet agrégé des filtres courants.
- `filters.set(clé, valeur)` / `filters.patch({ … })` — applique un ou plusieurs filtres (un seul
  `navigate`). `filters.reset()` — retire tous les params.
- Options : `prefix` (préfixe les params pour plusieurs jeux de filtres sur une même page),
  `replaceUrl` (passer à `false` pour empiler les filtres dans l'historique).

Les clés `value`, `set`, `patch` et `reset` sont réservées : les utiliser comme nom de filtre est
une erreur de compilation (elles cohabitent avec les signals sur le même objet).

### Tri dans l'URL

`sortFilter(champsAutorisés, défaut?)` encode l'état de tri de façon compacte (`?sort=date` en
ascendant, `?sort=-date` en descendant), en validant le champ contre la liste autorisée. La valeur
est `SortState | null` (`{ field, direction: 'asc' | 'desc' }`) :

```typescript
protected readonly filters = injectQueryFilters({
  sort: sortFilter(['name', 'date', 'price'], { field: 'name', direction: 'asc' }),
});

protected readonly rows = computed(() => sortRows(this.store.rows(), this.filters.sort()));

protected toggleSort(field: 'name' | 'date' | 'price'): void {
  const current = this.filters.sort();
  const direction = current?.field === field && current.direction === 'asc' ? 'desc' : 'asc';
  this.filters.set('sort', { field, direction });
}
```

Pour un tableau `app-table` (ag-grid), brancher le tri de la grille sur le codec : lire
`filters.sort()` pour positionner l'état des colonnes (`applyColumnState`) et pousser
`onSortChanged` vers `filters.set('sort', …)`.

## Configuration : `provideJustinCroyableDS()`

Point d'entrée unique, composable par fonctionnalités façon `provideRouter()` :

```ts
providers: [
  provideJustinCroyableDS(
    withIcons(SCOPED_APP_ICONS), // jeu @ng-icons de l'app (Phosphor, Lucide…)
    withTables(),                // AG Grid community + défauts de `app-table`
    withCharts(),                // ECharts via ngx-echarts
    withTranslations(),          // Transloco + traductions du DS
  ),
];
```

Chaque fonctionnalité n'apporte que ses providers : une application sans tableaux
ne charge pas AG Grid. `provideZard()` est inclus d'office, il n'est pas optionnel
(cf. plus bas).

| Fonctionnalité | Ce qu'elle fait | À savoir |
| --- | --- | --- |
| `withIcons(icons)` | `provideIcons()` pour tout l'arbre | Le jeu vient de l'app. Seules les icônes passées **par nom** à une entrée (`app-empty [icon]`) en ont besoin. |
| `withTables(opts?)` | Enregistre `AllCommunityModule`, fixe les défauts de `app-table` | L'enregistrement est fait dans un initialiseur, donc uniquement si la fonctionnalité est déclarée. |
| `withCharts(opts?)` | `provideEchartsCore()`, défauts de `app-chart` | Charge le bundle ECharts complet à la demande. Passer `echarts` pour un `echarts/core` réduit au strict nécessaire. |
| `withTranslations(opts?)` | Transloco + les 5 langues du DS | À omettre si l'app gère déjà Transloco, les deux configurations se remplaceraient. |

## Thème et couleurs

`ThemeService` bascule entre `light` et `dark` en posant la classe `.dark` sur
l'élément racine, avec persistance et sans toucher à `localStorage` ni
`matchMedia` côté serveur.

`app-table` et `app-chart` suivent ce service, par deux chemins différents :

- **`app-table`** est du DOM. Son thème AG Grid pointe directement les variables
  CSS (`var(--primary)`, `var(--border)`…), donc il suit le thème sans
  JavaScript ; seule la partie de schéma clair / sombre est permutée.
- **`app-chart`** dessine dans un canvas, où `var(--primary)` ne veut rien dire.
  `ThemePaletteService` résout les variables en valeurs concrètes et les
  recalcule à chaque bascule. La lecture se fait sur un élément sonde portant la
  classe `dark`, pas sur la racine : sinon le résultat dépendrait de l'ordre
  d'exécution des effets.

### `provideZard()` est requis

Select, command et sidebar utilisent la syntaxe d'événements groupés
`(keydown.{arrowdown,enter,escape}.prevent)`, fournie par les plugins d'event manager de
`provideZard()`. Sans cet appel dans les providers de l'app, la navigation clavier est
silencieusement inerte.

```ts
providers: [provideZard(), provideRouter(routes)];
```

`provideRouter` n'est pas optionnel non plus dès que breadcrumb ou header sont utilisés : ils
rendent des `routerLink`.

### Icônes

Chaque composant enregistre les icônes de son propre template (`viewProviders: provideIcons`).
En revanche, les entrées qui reçoivent un **nom** d'icône (`app-empty [icon]`,
`app-command-option [icon]`) supposent que l'app a enregistré l'icône correspondante via
`provideIcons()`.

## Contraintes de versions

Angular **21** (et non 22) : `@angular/compiler-cli@22` exige TypeScript >= 6.0, alors que la
racine du monorepo est en TS 5.9 (Nx, React Native). Angular 21 accepte TS 5.9. Voir aussi
`packages/storybook-web/package.json`, qui isole Storybook 10 et Tailwind 4 pour ne pas casser
le Storybook 8.6 / Tailwind 3 du track React Native.

Tailwind n'est volontairement pas déclaré en `peerDependencies` : aucun fichier TS de la lib ne
l'importe, c'est une dépendance de build du CSS de l'app, et le déclarer casserait
l'installation du monorepo (conflit avec le Tailwind 3 hoisté).

## Stories

Les stories vivent dans l'app Storybook (`packages/storybook-web/src/stories`), pas dans la
lib :

```sh
npx nx storybook @justin-croyable/storybook-web        # http://localhost:6007
npx nx build-storybook @justin-croyable/storybook-web  # dist/storybook-web
```
