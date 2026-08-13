# Design — Variétés custom par utilisateur

Objectif : permettre à un utilisateur de **créer ses propres variétés** (ex.
« Tomate de mémé ») en plus du catalogue de référence, sans avoir à saisir de
prix. À la création, l'utilisateur choisit une **variété de référence RNM** ; la
variété custom **emprunte dynamiquement** le prix et la culture parente de cette
référence.

Ce document décrit l'architecture cible et un plan de mise en œuvre phasé
(Phase 0 fondations jardin → Phase 1 socle variétés → Phase 2 création custom). La
visibilité des variétés custom étant pilotée par le **partage de jardins**
(décision ratifiée #2), ce doc pose les fondations jardin nécessaires ; le partage
complet (invitations, UI, expiration) fera l'objet d'un doc dédié.

---

## 0. État d'implémentation

> **Statut : Phases 0/1/2 implémentées** sur la branche
> `claude/plants-varieties-dashboard-fixes-9pyjpu`
> (commits « socle backend » + « catalogue en base + variétés custom + bascule uuid »).

**✅ Fait**
- Tables `gardens`, `garden_members` (rôles + `email` + `expires_at`), `varieties`
  (migration `0005`). `GardenService` (jardin personnel lazy, rôle effectif avec
  expiration, jardins accessibles) et `VarietyService` (`GET`/`POST`/`DELETE
  /varieties`, visibilité par jardins accessibles, garde-fous référence/rôle/usage).
- Front : `CatalogStore` (signals) alimenté par `GET /varieties` remplace le
  catalogue en dur ; `VarietyId` devient `string` (uuid) ; indirection
  `pricingVarietyId` (custom → référence) avec repli culture.
- UI « + Nouvelle variété » (libellé + référence RNM) dans add-harvest et add-plant.
- **Bascule uuid + FK** de `harvests.variety_id`, `plants.variety_id`,
  `variety_prices.variety_id` (slug texte → uuid) : migration `0006` avec snapshot
  drizzle-kit et corps SQL édité pour un transfert de données sûr (insertion
  idempotente des références puis mapping `slug → uuid`). Seed adapté.

**⚠️ À valider en environnement réel** (non exécuté ici, faute de base)
- Jouer `0005` puis `0006` + `db-seed`, vérifier que récoltes/plants/prix existants
  résolvent après le mapping `slug → uuid`.
- Smoke test création variété custom → récolte/plant → remontée dans les charts
  sous la culture parente + héritage du prix.

**⏳ Différé (épopée « jardins partagés » dédiée)**
- Flux d'invitation par e-mail, UI multi-jardins, expiration côté UI.
- Migration de l'ownership de `plants`/`harvests`/`expenses` de `user_id` vers un
  scoping `garden_id` (aujourd'hui encore scoping `user_id`).

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

> **Décisions ratifiées** (à trancher listées § 9, désormais actées) :
> 1. **Pas d'édition** d'une variété custom pour le moment (création + suppression
>    seulement). Voir § 2, point 6.
> 2. **Visibilité pilotée par le jardin, pas par l'utilisateur.** À terme les
>    jardins seront partagés (invité simple, co-propriétaire, éditeur temporaire) ;
>    toute personne ayant accès à un jardin doit voir ses variétés custom. →
>    ownership par **jardin**, pas par user. Prérequis transverse détaillé § 2 bis.
> 3. **Bascule uuid + FK dès la Phase 1** (pas de `variety_id` en texte durable) :
>    identité et références en `uuid`, intégrité garantie par des clés étrangères.
>    Voir § 3 et § 4.

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

5. **Ownership par jardin.** Une variété custom appartient à un **jardin**
   (`garden_id`), pas directement à un user. Sa visibilité suit l'appartenance au
   jardin (décision ratifiée #2). Les variétés de référence sont globales
   (`garden_id = NULL`).

6. **Pas d'édition (pour l'instant).** Une variété custom se crée et se supprime,
   ne se modifie pas (décision ratifiée #1). Ni le `label` ni la référence ne
   changent après création → pas de recalcul rétroactif surprise, logique
   simplifiée. À rouvrir plus tard si besoin (§ 9).

7. **Tout en uuid + FK.** L'identité des variétés et les colonnes `variety_id`
   des tables transac passent en `uuid` avec clés étrangères vers `varieties.id`
   dès la Phase 1 (décision ratifiée #3). Pas de colonne texte hétérogène.

### Entrées utilisateur à la création

Seulement deux champs :

- `label` — nom libre (« Tomate de mémé ») ;
- `referenceVarietyId` — pilote **le prix ET la culture**.

Le `garden_id` est déduit côté serveur (le jardin courant de l'utilisateur), pas
saisi.

---

## 2 bis. Prérequis transverse — jardins & partage

La décision ratifiée #2 introduit un thème **plus large que les variétés custom** :
un modèle de **jardins partagés avec rôles**. Il touche toutes les ressources
aujourd'hui possédées par `user_id` (plants, récoltes, dépenses **et** variétés
custom). Ce doc en pose les fondations nécessaires aux variétés ; le partage
complet (invitations, UI, expiration) mérite son propre doc de design dédié.

### Ce qui existe aujourd'hui

- Aucune entité « jardin ». Les ressources sont possédées via `user_id` et
  filtrées par `where user_id = me` dans les services.
- Permissions [`auth/ability.ts`](../packages/potager-api/src/auth/ability.ts) :
  CASL basé sur le **rôle utilisateur** (`admin` / `user`), pas de partage par
  ressource.

### Modèle cible

- **`gardens`** — un potager partageable (`id`, `owner_user_id`, `name`…). Chaque
  user existant reçoit un jardin personnel auto-créé (backfill, § 4).
- **`garden_members`** — appartenance `(garden_id, user_id, role, expires_at?)`.
- **Rôles** (du plus au moins capable) :

  | Rôle | Contenu (plants/récoltes/dépenses/variétés custom) | Gère les membres | Supprime le jardin | À l'expiration (`expires_at`) |
  | --- | --- | --- | --- | --- |
  | `owner` (créateur) | CRUD complet | oui | **oui (seul)** | — (permanent) |
  | `co_owner` (co-propriétaire) | CRUD complet | oui | non | — (permanent) |
  | `temp_editor_viewer` (éditeur temporaire → invité) | CRUD tant que non expiré | non | non | **retombe en `viewer`** (lecture) |
  | `temp_editor_revoked` (éditeur temporaire → révoqué) | CRUD tant que non expiré | non | non | **plus aucun accès** |
  | `viewer` (invité simple) | lecture seule | non | non | — (permanent) |

  Décisions ratifiées : **seul le `owner` (créateur) supprime le jardin** ; l'éditeur
  temporaire existe en **deux variantes** distinctes selon le comportement voulu à
  l'expiration (repli lecture vs. accès coupé).

- **Toutes** les ressources migrent de `user_id` vers `garden_id` (ownership), la
  permission effective venant du rôle **effectif** du membre (rôle brut recalculé
  selon `expires_at` pour les deux rôles temporaires). CASL est étendu pour
  construire l'ability à partir des appartenances (`garden_id ∈ mes jardins` +
  rôle effectif), au lieu du seul rôle global.

- **Invitation par e-mail.** Un membre est invité via l'e-mail de son compte.
  L'accès n'est accordé que si l'e-mail du compte authentifié **correspond** à
  l'e-mail invité ; sinon **on bloque** (pas de rattachement silencieux à un autre
  compte). `garden_members` porte donc l'`email` invité ; `user_id` est résolu au
  premier accès, sous réserve que l'e-mail corresponde.

- **Un seul jardin pour l'instant.** Chaque user a **un** jardin personnel
  (auto-créé). Pas de sélecteur ni de liste multi-jardins en Phase 0 : le « jardin
  courant » est toujours le jardin personnel. La navigation multi-jardins (lister,
  basculer) est remise à plus tard. Le schéma `garden_members` est néanmoins posé
  dès maintenant pour ne pas remigrer ensuite.

### Portée dans ce doc

On ne construit ici **que** le strict nécessaire côté variétés (colonne
`garden_id`, visibilité par membre). La table `gardens`, `garden_members`,
l'extension CASL, les invitations et l'expiration des éditeurs temporaires sont
l'objet de la **Phase 0** (§ 8) et d'un doc de design séparé à rédiger.

---

## 3. Modèle de données

### Table `varieties` (nouvelle)

```
varieties
├─ id                  uuid    PK      -- identité stable, pour TOUTES les lignes
├─ garden_id           uuid    NULL    -- NULL = référence globale ; sinon = custom du jardin (FK gardens.id)
├─ slug                text    NULL    -- réservé au référentiel (= ancien varietyId) ; NULL pour le custom
├─ crop_id             text    NOT NULL-- culture parente (déduite de la référence pour le custom)
├─ label               text    NOT NULL
├─ reference_variety_id uuid   NULL    -- NULL pour une référence ; FK vers varieties.id (une référence)
├─ created_at          timestamptz
└─ updated_at          timestamptz
```

- `garden_id = NULL` → variété de référence globale (on **seed** les variétés
  actuelles).
- `garden_id` renseigné → variété custom, appartenant à ce jardin (visible par ses
  membres, décision ratifiée #2). FK vers `gardens.id`, `ON DELETE CASCADE`.
- `reference_variety_id` → uniquement pour le custom ; **FK vers `varieties.id`**
  d'une ligne `garden_id IS NULL` (garde-fou § 7).
- **L'identité est toujours l'`id` (uuid)**, y compris pour le custom.

#### Slug : réservé au référentiel, pas au custom

- `slug` n'est renseigné que pour les **variétés de référence** (`garden_id IS
  NULL`), où il conserve les identifiants historiques (`tomate-coeur-de-boeuf`).
  Il sert de pivot pour la migration slug → uuid des données existantes (§ 4).
- Les **variétés custom n'ont pas de slug** (`slug = NULL`). Décision actée :
  un slug custom serait purement cosmétique et n'apporte rien de fonctionnel —
  prix et rollups passent par `reference_variety_id` et `crop_id`, jamais par le
  slug. Le `label` suffit à l'affichage, l'`id` à l'identité.
- Ne **pas** dériver de slug du libellé custom (§ 6 · décision #1 : pas d'édition,
  mais le principe tient : libellé non unique, slug-clé fragile). On pourra
  ajouter un slug custom plus tard **uniquement** si un besoin lisible concret
  apparaît (page détail partageable, export), figé à la création.
- Unicité du référentiel : `slug` unique là où `garden_id IS NULL`. Pour éviter
  qu'un jardin ait deux fois la même variété, on contraint sur le **libellé
  normalisé par jardin** : unicité `(garden_id, lower(trim(label)))`.

### Cultures (`crops`)

Inchangées, en dur dans `potager.model.ts`. Elles restent la source des icônes,
labels et catégories.

### Impact sur les tables existantes

Décision ratifiée #3 → on bascule **directement en `uuid` + FK**, pas de colonne
texte durable :

- `harvests.variety_id`, `plants.variety_id`, `variety_prices.variety_id`
  deviennent des `uuid` avec **FK vers `varieties.id`**. Migration de mapping
  `slug → id` sur les lignes existantes (§ 4).
- Ownership : `plants`, `harvests`, `expenses` migrent aussi de `user_id` vers
  `garden_id` (prérequis § 2 bis / Phase 0). `variety_prices` reste global (lié à
  une variété de référence, pas à un jardin).

Intégrité garantie par la base : plus de `variety_id` orphelin, plus de résolution
ambiguë texte/uuid.

---

## 4. Migration des données existantes

Les lignes actuelles (`harvests`, `plants`, `variety_prices`) stockent des
**slugs**, et les ressources sont possédées par `user_id`. Cible : `uuid` + FK
partout, ownership par `garden_id`. Tout via drizzle-kit (jamais de SQL à la main —
`nx db-generate` puis `nx db-migrate`), chaque étape étant une migration séparée.

**A. Fondations jardin (Phase 0)**

1. Créer `gardens` et `garden_members`.
2. **Backfill** : un jardin personnel par user existant (`owner_user_id = user`,
   membre `owner`), puis renseigner `garden_id` sur les `plants` / `harvests` /
   `expenses` existants à partir de leur `user_id`.
3. Basculer ces tables de `user_id` vers `garden_id` (FK), une fois le backfill
   vérifié.

**B. Table variétés + bascule uuid (Phase 1)**

4. Créer la table `varieties`.
5. **Seed des variétés de référence** : une ligne par entrée du catalogue en dur,
   `garden_id = NULL`, `slug = ancien varietyId`, `crop_id`, `label`, `id` uuid
   généré. Dans [`db/seed.ts`](../packages/potager-api/src/db/seed.ts).
6. **Mapping `slug → id`** : migration de données qui, pour `harvests`, `plants`,
   `variety_prices`, remplace le `variety_id` texte (slug) par l'`uuid`
   correspondant de `varieties`, puis convertit la colonne en `uuid` + FK.
7. Vérification : aucun `variety_id` non résolu avant de poser la contrainte FK
   (un slug inconnu doit échouer bruyamment, pas être silencieusement ignoré).

> La bascule uuid coûte une migration de données (étape 6), assumée (décision #3).
> En contrepartie : intégrité référentielle garantie, plus de colonne hétérogène,
> et les lignes custom sont nativement propres dès leur création.

---

## 5. API

### Contrat (`libs/api-contract`)

Nouveau `variety.schema.ts` + `varietyContract` :

```
GET    /varieties           -> référence globale + customs des jardins accessibles
POST   /varieties           -> créer une variété custom  { label, referenceVarietyId }
DELETE /varieties/:id       -> supprimer une variété custom (rôle suffisant sur son jardin)
```

- `GET` renvoie `garden_id IS NULL` **OU** `garden_id ∈ mes jardins` (jardins dont
  je suis membre, quel que soit le rôle — même un `viewer` doit voir les customs).
- `POST` : le serveur déduit `crop_id` depuis la référence, force `garden_id` au
  **jardin courant** de l'utilisateur, et vérifie que son rôle sur ce jardin
  autorise l'écriture (`owner` / `co_owner` / `editor` non expiré). Pas de slug
  généré (custom sans slug).
- `DELETE` : interdit sur une variété de référence ; autorisé si rôle d'écriture
  sur le jardin propriétaire. Refuser (ou avertir) si la variété est déjà utilisée
  par des récoltes/plants du jardin.

### Service NestJS

Nouveau `variety.module.ts` sur le modèle de `plant.module.ts`
([exemple](../packages/potager-api/src/plants/plant.module.ts)) : garde
`FirebaseAuthGuard`, **scoping par jardin via CASL** (appartenance + rôle, § 2 bis)
plutôt que par `user.id` brut, et validation de `referenceVarietyId` (doit exister
et être une variété de référence, `garden_id IS NULL`).

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
l'index de prix sur `pricingVarietyId(v)` au lieu de `v.id`. Après la bascule uuid
(§ 4-B), `variety_prices.variety_id` est un `uuid` pointant une variété de
**référence** ; `pricingVarietyId` renvoie justement l'id de cette référence
(`referenceVarietyId` pour un custom, `id` pour une référence) → clés homogènes en
uuid. Le repli existant « variété par défaut de la culture »
(`cropFallbackVarietyId`) reste en dernier filet si la référence n'a pas de prix.

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

1. `referenceVarietyId` **doit** pointer une variété de référence (`garden_id IS
   NULL`). Validé côté serveur + FK.
2. Résolution de prix **au read-time** : si la référence disparaît, repli sur la
   culture parente (filet existant). Pas de prix figé.
3. Suppression d'une variété custom : bloquée (ou avertie) si des récoltes/plants
   la référencent, pour ne pas créer de lignes orphelines.
4. Identité = `id` (uuid) pour toutes les variétés ; **le custom n'a pas de
   slug** (§ 3). Pas de dérivation de slug depuis le libellé.
5. Unicité côté custom sur le **libellé normalisé par jardin** (`(garden_id,
   lower(trim(label)))`), pas sur un slug.
6. Accès piloté par l'appartenance au jardin + rôle (§ 2 bis) : lecture pour tout
   membre, écriture/suppression pour `owner` / `co_owner` / `editor` non expiré.

---

## 8. Plan de mise en œuvre

### Phase 0 — Fondations jardin (prérequis, § 2 bis)

- Tables `gardens` + `garden_members`, rôles `owner` / `co_owner` /
  `temp_editor_viewer` / `temp_editor_revoked` / `viewer` (+ `email`, `expires_at`).
- Backfill : un jardin personnel par user (membre `owner`) + `garden_id` sur
  plants/récoltes/dépenses. Auto-création du jardin personnel à la création d'un user.
- Extension CASL : ability construite depuis les appartenances (jardin + rôle
  effectif, en tenant compte de `expires_at`).
- **Un seul jardin courant** (le personnel) ; navigation/liste multi-jardins et
  flux d'invitation UX → plus tard (schéma posé dès maintenant).

### Phase 1 — Socle variétés (aucun changement visible pour l'utilisateur)

- Table `varieties` via `nx db-generate` ; seed du référentiel (`garden_id = NULL`,
  `slug`, `id` uuid).
- Bascule uuid + FK des colonnes `variety_id` (mapping slug → id, § 4-B).
- Endpoint `GET /varieties` (référence + customs des jardins accessibles) +
  contrat + service.
- `CatalogStore` front qui remplace les const ; relâchement du typage `VarietyId`
  (index par `id`, plus besoin d'index par slug puisque tout est uuid côté transac).
- Non-régression : comportement identique, mais catalogue et références en base.

### Phase 2 — Création de variétés custom

- Endpoints `POST` / `DELETE /varieties` (scoping jardin + rôle).
- Indirection `pricingVarietyId` dans `price-store`.
- UI « + Nouvelle variété » (label + référence RNM) dans add-plant / add-harvest.
- Garde-fous § 7.

> Séquencement : Phase 0 avant Phase 1 (l'ownership `garden_id` des variétés en
> dépend). Si on veut livrer les variétés custom plus tôt, une variante consiste à
> démarrer la Phase 1 en scoping `user_id` provisoire — mais ça crée exactement la
> dette de remigration que la décision #3 cherche à éviter. **Recommandé : 0 → 1 → 2.**

---

## 9. Questions ouvertes

**Tranchées** (voir encadré § 2) :

- ~~Édition d'une variété custom~~ → **non** pour l'instant (création + suppression).
- ~~Variétés custom privées ou partagées~~ → **partagées via le jardin** ; tout
  membre les voit. Ownership par `garden_id`.
- ~~Bascule uuid + FK~~ → **oui, dès la Phase 1** (pas de texte durable).

**Partage de jardins — tranché** :

- **Suppression du jardin** → réservée au `owner` (créateur) uniquement.
- **Éditeur temporaire** → **deux rôles distincts** : `temp_editor_viewer` (repli
  en `viewer` à l'expiration) et `temp_editor_revoked` (accès coupé à l'expiration).
- **Invitation** → par **e-mail** ; si l'e-mail du compte authentifié ne correspond
  pas à l'e-mail invité, **on bloque**.
- **Multi-jardins** → **un seul jardin** (personnel) pour l'instant ; lister /
  basculer entre jardins remis à plus tard.

**Restent à préciser (plus tard, non bloquant)** :

- Sémantique fine de « gérer les membres » pour un `co_owner` (peut-il inviter /
  changer les rôles, ou seulement voir ?).
- Flux d'acceptation d'invitation (lien e-mail, écran d'acceptation) — la Phase 0
  pose le schéma, l'UX d'invitation viendra avec la navigation multi-jardins.
- **Promotion** d'une variété custom en référentiel global (par un admin) : utile ?
