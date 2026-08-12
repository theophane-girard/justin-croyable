# Design — Variétés custom par utilisateur

Objectif : permettre à un utilisateur de **créer ses propres variétés** (ex.
« Tomate de mémé ») en plus du catalogue de référence, sans avoir à saisir de
prix. À la création, l'utilisateur choisit une **variété de référence RNM** ; la
variété custom **emprunte dynamiquement** le prix et la culture parente de cette
référence.

Ce document décrit l'architecture cible et un plan de mise en œuvre en deux
phases. Il ne contient pas encore de code de production : c'est la base à valider
avant d'implémenter.

---

## 1. État actuel

### Le catalogue est en dur

`crops` (cultures) et `varieties` (variétés) sont des tableaux `const … as const`
dans [`packages/potager-web/src/app/core/potager.model.ts`](../packages/potager-web/src/app/core/potager.model.ts).

Trois niveaux hiérarchiques à ne pas confondre :

| Niveau | Champ | Exemple | Rôle |
| --- | --- | --- | --- |
| Catégorie | `category` | `legume` / `fruit` | Grand groupe |
| Culture | `cropId` | `tomate` | Plante générique (icône, catégorie) |
| Variété | `varietyId` | `tomate-coeur-de-boeuf` | Cultivar précis (prix, mots-clés RNM) |

Une variété référence sa culture parente via son champ `cropId`. La « remontée »
d'une variété vers sa culture (pour les charts « par culture ») se fait par
`VARIETY_BY_ID[varietyId].cropId`.

### Ce qui est déjà « prêt pour une table »

- **Backend** : `varietyId` / `cropId` sont de simples `text` / `z.string()`,
  **sans clé étrangère**. L'API traite déjà ces ids comme des chaînes opaques.
- **Table `variety_prices`** : déjà en base, indexée sur `varietyId` (texte).
- **Indirection de prix** : `PriceStore.#resolve()`
  ([`price-store.ts`](../packages/potager-web/src/app/core/price-store.ts))
  tente d'abord le prix direct de la variété, **puis retombe** sur la variété par
  défaut de la culture (`cropFallbackVarietyId`). Le design custom réutilise
  exactement ce point d'indirection.

### Ce qui coince pour le custom

- Le catalogue en dur ne peut pas porter de données utilisateur → **persistance
  nécessaire**.
- Côté front, les **types union** `CropId` / `VarietyId` (dérivés des const) sont
  utilisés à ~54 endroits (`Record<VarietyId, …>`, gardes `isVarietyId`…). Dès que
  le catalogue devient runtime, ces ids redeviennent des `string`. C'est le
  principal coût du refacto (détaillé § 6).

---

## 2. Décisions d'architecture

1. **Seules les variétés passent en table.** Les cultures (`crops`) restent en dur :
   liste botanique stable, un utilisateur invente une *variété*, pas une *culture*.
   Elles continuent de porter l'icône et la catégorie.

2. **Une variété custom ne stocke aucun prix.** Elle stocke un
   `referenceVarietyId` (variété RNM de comparaison). Le prix est résolu au
   read-time depuis cette référence → recalcul automatique quand les prix RNM
   changent, zéro donnée de prix custom.

3. **La référence détermine aussi la culture parente.** Une variété de référence
   appartient déjà à une culture. La variété custom hérite donc de
   `cropId = référence.cropId` (déduit, non saisi). Impossible d'être incohérent
   (custom « tomate » comparée à une courgette). La remontée dans les charts suit
   la culture de la référence → gratuit, la logique de rollup par `cropId` existe.

4. **La référence est toujours une variété du référentiel global.** Jamais une
   autre variété custom → pas de chaîne de résolution, pas de référence orpheline.

### Entrées utilisateur à la création

Seulement deux champs :

- `label` — nom libre (« Tomate de mémé ») ;
- `referenceVarietyId` — pilote **le prix ET la culture**.

---

## 3. Modèle de données

### Table `varieties` (nouvelle)

```
varieties
├─ id                  uuid    PK      -- identité stable
├─ user_id             uuid    NULL    -- NULL = référence globale ; sinon = custom du user
├─ slug                text            -- id lisible ; = ancien varietyId pour les lignes de référence
├─ crop_id             text    NOT NULL-- culture parente (déduite de la référence pour le custom)
├─ label               text    NOT NULL
├─ reference_variety_id uuid   NULL    -- NULL pour une référence ; l'id de la réf RNM pour un custom
├─ created_at          timestamptz
└─ updated_at          timestamptz
```

- `user_id = NULL` → variété de référence (on **seed** les variétés actuelles).
- `user_id` renseigné → variété custom.
- `reference_variety_id` → uniquement pour le custom, pointe vers une ligne
  `user_id IS NULL`.
- `slug` conserve les identifiants historiques (`tomate-coeur-de-boeuf`) pour la
  compatibilité avec les données existantes (voir § 4). Unicité :
  `(user_id, slug)` — un user ne peut pas avoir deux variétés au même slug.

### Cultures (`crops`)

Inchangées, en dur dans `potager.model.ts`. Elles restent la source des icônes,
labels et catégories.

### Impact sur les tables existantes

`harvests.variety_id`, `plants.variety_id`, `variety_prices.variety_id` restent
en `text` et continuent de stocker le **slug**. On ne met pas (encore) de clé
étrangère uuid pour limiter le blast radius de la migration (voir § 4). Une
seconde étape pourra les convertir en `uuid` référençant `varieties.id`.

---

## 4. Migration des données existantes

Les lignes actuelles (`harvests`, `plants`, `variety_prices`) stockent des
**slugs**, pas des uuid. Plan avec drizzle-kit (jamais de SQL à la main —
`nx db-generate` puis `nx db-migrate`) :

1. **Créer la table `varieties`** (`nx db-generate`).
2. **Seed des variétés de référence** : une ligne par entrée du catalogue en dur,
   `user_id = NULL`, `slug = ancien varietyId`, `crop_id`, `label`. Fait dans le
   script de seed ([`db/seed.ts`](../packages/potager-api/src/db/seed.ts)).
3. **Pas de réécriture immédiate** des `variety_id` existants : ils restent des
   slugs et matchent `varieties.slug`. Rien à migrer sur les données transac.
4. (Optionnel, plus tard) Bascule des colonnes `variety_id` en `uuid` + FK vers
   `varieties.id`, avec une migration qui mappe `slug → id`.

> Garder le slug comme pivot évite une migration de données risquée dès la Phase 1
> et préserve la compatibilité avec `variety_prices` (indexée sur slug).

---

## 5. API

### Contrat (`libs/api-contract`)

Nouveau `variety.schema.ts` + `varietyContract` :

```
GET    /varieties           -> variétés visibles par le user (référence + ses customs)
POST   /varieties           -> créer une variété custom  { label, referenceVarietyId }
DELETE /varieties/:id       -> supprimer une variété custom (uniquement les siennes)
```

- `GET` renvoie la fusion `user_id IS NULL` **OU** `user_id = <moi>`.
- `POST` : le serveur déduit `crop_id` depuis la référence, force `user_id` au
  user courant, génère `slug` depuis le `label` (slugify + suffixe d'unicité).
- `DELETE` : interdit sur une variété de référence et sur celle d'un autre user.
  Refuser (ou avertir) si la variété est déjà utilisée par des récoltes/plants.

### Service NestJS

Nouveau `variety.module.ts` sur le modèle de `plant.module.ts`
([exemple](../packages/potager-api/src/plants/plant.module.ts)) : garde
`FirebaseAuthGuard`, scoping par `user.id`, validation de `referenceVarietyId`
(doit exister et être une variété de référence).

---

## 6. Front

### CatalogStore (nouveau)

Un store `providedIn: 'root'` qui charge les variétés via `GET /varieties` et les
expose en **signals**, en remplacement des const `VARIETIES` / `VARIETY_BY_ID` /
`VARIETIES_BY_CROP`. Les `crops` restent importées en dur.

Conséquence de typage : `VarietyId` redevient un `string`. Les ~54 emplacements
typés `Record<VarietyId, …>` / `VarietyId` se détendent en `string`. Migration
mécanique mais transverse (≈ 10 fichiers consommateurs : stores harvest/garden,
add-plant, add-harvest, prices, admin, catalog-filter). Les `crops` gardent leur
type union `CropId`.

### Indirection de prix — le cœur du design

Une seule fonction, réutilisée partout où un prix est résolu :

```ts
// résout la variété qui porte réellement la série de prix
function pricingVarietyId(v: Variety): string {
  return v.referenceVarietyId ?? v.id; // custom -> sa réf RNM ; référence -> elle-même
}
```

Dans `price-store`, `#resolve()` / `currentFor()` / `latestFor()` cherchent
l'index de prix sur `pricingVarietyId(v)` au lieu de `v.id`. Le repli existant
« variété par défaut de la culture » (`cropFallbackVarietyId`) reste en dernier
filet si la référence n'a pas de prix ou a disparu du catalogue.

Effets induits, **sans code supplémentaire** :

- une variété custom hérite prix conventionnel + bio + historique de sa référence ;
- elle hérite des mots-clés RNM de la référence (scraping admin) ;
- elle remonte dans les charts sous la culture de sa référence ;
- mise à jour des prix RNM → variétés custom recalculées automatiquement.

### UI de création

Dans `add-plant` et `add-harvest` (et éventuellement `prices`), un point d'entrée
« + Nouvelle variété » : champ `label` + sélecteur de variété de référence RNM
(liste triée, alimentée par le référentiel global). À la validation → `POST
/varieties`, puis la nouvelle variété apparaît dans les sélecteurs.

---

## 7. Garde-fous

1. `referenceVarietyId` **doit** pointer une variété de référence (`user_id IS
   NULL`). Validé côté serveur.
2. Résolution de prix **au read-time** : si la référence disparaît, repli sur la
   culture parente (filet existant). Pas de prix figé.
3. Suppression d'une variété custom : bloquée (ou avertie) si des récoltes/plants
   la référencent, pour ne pas créer de lignes orphelines.
4. Unicité `(user_id, slug)` pour éviter les collisions de sélecteur.

---

## 8. Plan de mise en œuvre

### Phase 1 — Socle (aucun changement visible pour l'utilisateur)

- Table `varieties` via `nx db-generate`.
- Seed des variétés de référence (`user_id = NULL`).
- Endpoint `GET /varieties` + contrat + service.
- `CatalogStore` front qui remplace les const ; relâchement du typage `VarietyId`.
- Non-régression : le comportement actuel est identique, mais le catalogue vient
  désormais de la base.

### Phase 2 — Création de variétés custom

- Endpoints `POST` / `DELETE /varieties` (scoping user).
- Indirection `pricingVarietyId` dans `price-store`.
- UI « + Nouvelle variété » (label + référence RNM) dans add-plant / add-harvest.
- Garde-fous § 7.

---

## 9. Questions ouvertes

- **Édition** d'une variété custom (changer le label / la référence) : utile en
  Phase 2 ou plus tard ?
- **Partage** : les variétés custom restent-elles strictement privées, ou peut-on
  envisager un partage / une promotion en référentiel global (admin) ?
- **Bascule uuid + FK** des colonnes `variety_id` : à planifier une fois la
  Phase 1 stabilisée, ou à laisser en slug durablement ?
