## Directives à suivre lors des développements

### Design system & composants

- **Priorité au design system :** utiliser en priorité les composants de `libs/design-system`. **Demander à l'utilisateur avant de créer un composant custom.**
- **Vérifier le DS AVANT de coder une structure d'UI :** avant d'assembler à la main un motif d'interface avec des `div` + classes Tailwind (card, en-tête de section, badge/tag, modale, onglets, accordéon, barre de progression, alerte/message, tooltip, breadcrumb, avatar, skeleton…), **chercher d'abord** si un composant du DS le fournit déjà. Reproduire un composant existant à coups de Tailwind brut **compte comme un composant custom** et est interdit sans validation. Ne pas partir du balisage existant d'une page comme preuve qu'aucun composant DS n'existe — il peut lui-même être à corriger.
- **Comment chercher un composant du DS :** lister les composants exportés et leurs sélecteurs/inputs dans `lib/design-system/src/index.ts` (ex. `grep -n "declare class .*Component" libs/design-system/src/index.ts`, ou chercher un sélecteur `app-…`).
- **Templates inline :** privilégier les composants à template HTML inline (`template:` dans le décorateur), pas de fichier `.html` séparé.
- **Composants standalone** (défaut Angular 21) et **`changeDetection: ChangeDetectionStrategy.OnPush`** explicite sur chaque composant.
- **Icônes :** utiliser `ng-icon` (`@ng-icons/core`), avec la library phosphor ! Jamais de SVG inline.

### Styling

- **Tailwind uniquement, dans le template :** utiliser exclusivement des classes Tailwind directement dans le template HTML. **Interdiction** de classes CSS custom ou de style custom (pas de fichier `.css`/`.scss` de composant, pas de `style=`, pas de `styleUrl`).

### TypeScript

- **Pas de `any`.** Typer explicitement.
- **Pas de commentaires.** Privilégier un nommage explicite des variables/méthodes et un découpage en sous-fonctions.
- **Pas d'enum** → utiliser des objets `const ... as const` (et types dérivés) à la place.
- **Pas de magic string** → typer / extraire en constantes. Extraire notamment les chemins de route en constantes.
- **`#` pour les membres privés**, et privilégier `protected` plutôt que `public`. Respecter les conventions du framework : n'utiliser `#` que sur les membres qu'Angular autorise en ES private. Les signal queries et APIs à base de champ (`viewChild`, `contentChild`, `input`, `model`, `output`, `viewChildren`, …) **interdisent** `#` (erreur `NG1053`) — les garder en `private` TypeScript.

### Structure du code

- **Pas de `if` imbriqués** → privilégier l'early return.
- **Dé-nester au maximum** les blocs de code.
- **Tableaux : méthodes déclaratives exclusivement** (`forEach`, `map`, `filter`, `reduce`, …), jamais de boucle `for`.
- Supprimer les `ngOnInit`, `constructor`, `ngOnDestroy` vides.

### État & réactivité (signals / observables)

- **Signals pour l'état, observables pour l'événementiel.**
- Dans les templates, privilégier l'usage des **signals**. Pour un observable, le convertir en signal avec **`toSignal`**.
- **Ne pas** setter un signal impérativement dans une souscription : préférer un flux observable complet en pipe, converti via `toSignal`.
- **Toujours** détruire les souscriptions avec **`takeUntilDestroyed()`**.
- **Code plat :** pas de `subscribe` imbriqués, pas d'opérateurs `pipe` imbriqués.
- **Pas d'appel de fonction dans le template HTML** → préférer un pipe Angular ou un formatage dans la classe. Seuls les signals peuvent être appelés (`maSignal()`) dans le template.
- **Pas d'appel de signal dans un flux observable** → transformer d'abord le signal en observable avec `toObservable`.

  ```typescript
  mySignal = signal('test');
  myObs$ = of('test2').pipe(
    map(data => this.mySignal()), // ❌ mauvaise pratique
  );
  ```

  ```typescript
  mySignal = signal('test');
  myValue$ = toObservable(this.mySignal);
  myObs$ = combineLatest([this.myValue$, of('test2')]).pipe(
    map(([value]) => value), // ✅ mieux
  );
  ```

- **Pas de `setTimeout`** ni de **`queueMicrotask`** → utiliser observables, lifecycle hooks, etc. à la place (l'app est zoneless).

## Conventions générales

- TypeScript en mode strict avec strictness supplémentaire (`noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) et templates Angular stricts. Privilégier signals et inputs typés (`input()`, `input.required()`).
- Prettier : single quotes, largeur 100 caractères ; HTML formaté avec le parser Angular.