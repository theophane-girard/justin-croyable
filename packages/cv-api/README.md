# @justin-croyable/cv-api

Backend NestJS du site CV : sert les données publiques du CV (profil,
expériences, compétences, tags) et permet de les mettre à jour. API typée de
bout en bout via `@justin-croyable/cv-contract` (ts-rest + Zod), persistance
Postgres via Drizzle.

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | NestJS 11 |
| API | ts-rest + Zod (contrat partagé `libs/cv-contract`) |
| ORM | Drizzle ORM (`postgres-js`) |
| Base | Postgres (Supabase / Neon) |
| Auth | Jeton d'administration en écriture, lecture publique |

## Modèle de données

| Table | Colonnes |
| --- | --- |
| `tags` | `label`, `img` (nullable), `icon` (nullable), `type` |
| `experiences` | `type` (`job` \| `extra`), `title` (varchar 255), `description` (text, HTML/rich text), `start_date`, `end_date` (nullable) |
| `experience_tags` | table de relation `experiences` ↔ `tags` (clé primaire composite) |
| `skills` | `label`, `tag_id` → `tags` |
| `profiles` | `firstname`, `lastname`, `date_of_birth`, `description`, `phone_number`, `driver_licence`, `email`, `website`, `linkedin`, `street_name`, `city` |

Seuls `firstname` et `lastname` sont obligatoires sur le profil : tous les
autres champs sont nullables, pour pouvoir remplir le CV progressivement.

Règles de suppression :

- supprimer un tag détache automatiquement les expériences associées
  (cascade sur `experience_tags`) ;
- supprimer un tag utilisé par une compétence renvoie `409` : détacher ou
  supprimer la compétence d'abord (`skills.tag_id` est obligatoire).

## Authentification

- **Lectures (`GET`) : publiques.** Le site CV n'a besoin d'aucun secret.
- **Écritures (`POST`, `PATCH`, `PUT`, `DELETE`) : jeton d'administration**
  attendu dans l'en-tête `Authorization: Bearer <ADMIN_TOKEN>`.

Le garde est global (`APP_GUARD`) : toute route non-`GET` ajoutée plus tard est
protégée par défaut. La comparaison du jeton est faite en temps constant.

```bash
curl -X POST http://localhost:3100/api/tags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"label":"Angular","type":"techno","icon":"phosphorCode"}'
```

## Configuration

Copier `.env.example` vers `.env` et renseigner les valeurs :

```bash
cp packages/cv-api/.env.example packages/cv-api/.env
```

- `DATABASE_URL` : chaîne de connexion Postgres (Supabase → Project Settings →
  Database → Connection string ; utiliser le pooler pour la prod serverless).
- `ADMIN_TOKEN` : secret d'écriture, 24 caractères minimum
  (`openssl rand -hex 32`). L'application refuse de démarrer sans lui.
- `CORS_ORIGIN` : origine(s) du site CV, séparées par des virgules.

## Base de données (Drizzle)

`drizzle.config.ts` charge automatiquement `packages/cv-api/.env` (via dotenv) :
une fois `DATABASE_URL` renseigné dans ce fichier, les commandes ci-dessous
fonctionnent sans préfixer la variable, sur tout OS (Windows inclus).

```bash
# Générer une migration SQL à partir du schéma (src/db/schema.ts)
npx nx db-generate cv-api

# Appliquer les migrations sur la base pointée par DATABASE_URL
npx nx db-migrate cv-api

# Alternative dev : pousser le schéma sans fichier de migration
npx nx db-push cv-api
```

## Lancer

```bash
npx nx serve cv-api      # dev (watch)
npx nx build cv-api      # build production (dist/)
```

Port par défaut : `3100` (le potager utilise `3000`).

## Routes

Toutes préfixées par `/api`.

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Sonde publique. |
| `GET` | `/cv` | — | Agrégat en un appel : profil + expériences + compétences + tags. |
| `GET` | `/profile` | — | Profil (`404` s'il n'est pas encore renseigné). |
| `PUT` | `/profile` | 🔒 | Crée ou remplace le profil (singleton). |
| `GET` | `/tags` | — | Liste des tags, filtre optionnel `?type=`. |
| `GET` | `/tags/:id` | — | Un tag. |
| `POST` | `/tags` | 🔒 | Crée un tag. |
| `PATCH` | `/tags/:id` | 🔒 | Met à jour un tag (partiel). |
| `DELETE` | `/tags/:id` | 🔒 | Supprime un tag (`409` si utilisé par une compétence). |
| `GET` | `/experiences` | — | Liste triée par date de début décroissante, filtre optionnel `?type=job\|extra`. |
| `GET` | `/experiences/:id` | — | Une expérience, tags inclus. |
| `POST` | `/experiences` | 🔒 | Crée une expérience (`tagIds` accepté). |
| `PATCH` | `/experiences/:id` | 🔒 | Met à jour une expérience ; `tagIds` remplace l'ensemble des tags. |
| `DELETE` | `/experiences/:id` | 🔒 | Supprime une expérience. |
| `GET` | `/skills` | — | Liste des compétences (tag inclus), filtre optionnel `?tagId=`. |
| `POST` | `/skills` | 🔒 | Crée une compétence. |
| `PATCH` | `/skills/:id` | 🔒 | Met à jour une compétence (partiel). |
| `DELETE` | `/skills/:id` | 🔒 | Supprime une compétence. |

`GET /cv` est l'appel prévu pour le site CV : une seule requête publique
renvoie tout ce qu'il faut pour peindre la page.

### Sémantique de mise à jour

- `PATCH` (tags, expériences, compétences) est **partiel** : seuls les champs
  fournis sont modifiés.
- `PUT /profile` est un **remplacement complet** : un champ omis est remis à
  `null`. Envoyer le profil entier à chaque enregistrement.

Les expériences renvoient leurs tags complets (`tags: Tag[]`), les compétences
leur tag (`tag: Tag`) : pas de jointure à refaire côté front.

## Consommer l'API depuis le front

Le contrat ts-rest est partagé, donc typé de bout en bout :

```typescript
import { apiContract } from '@justin-croyable/cv-contract';
import { initClient } from '@ts-rest/core';

const client = initClient(apiContract, { baseUrl: 'http://localhost:3100/api' });
const { status, body } = await client.cv.get();
```
