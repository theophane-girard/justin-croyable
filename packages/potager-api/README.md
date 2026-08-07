# @justin-croyable/potager-api

Backend NestJS du potager : comptes utilisateurs (Firebase Auth), API typée
de bout en bout via `@justin-croyable/api-contract` (ts-rest + Zod), et
persistance Postgres via Drizzle.

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | NestJS 11 |
| API | ts-rest + Zod (contrat partagé `libs/api-contract`) |
| ORM | Drizzle ORM (`postgres-js`) |
| Base | Postgres (Supabase / Neon) |
| Auth | Firebase Auth (provider Google) — le back vérifie l'ID token |
| Permissions | Scoping par propriétaire + CASL (`AbilityFactory`) |

## Configuration

Copier `.env.example` vers `.env` et renseigner les valeurs :

```bash
cp packages/potager-api/.env.example packages/potager-api/.env
```

- `DATABASE_URL` : chaîne de connexion Postgres (Supabase → Project Settings →
  Database → Connection string ; utiliser le pooler pour la prod serverless).
- `FIREBASE_*` : Console Firebase → Paramètres du projet → Comptes de service →
  « Générer une nouvelle clé privée ». Reporter `project_id`, `client_email` et
  `private_key` (garder les `\n` échappés entre guillemets).
- `CORS_ORIGIN` : origine de l'app Angular (dev : `http://localhost:4200`).

## Base de données (Drizzle)

```bash
# Générer une migration SQL à partir du schéma (src/db/schema.ts)
npx nx db-generate potager-api

# Appliquer les migrations sur la base pointée par DATABASE_URL
npx nx db-migrate potager-api

# Alternative dev : pousser le schéma sans fichier de migration
npx nx db-push potager-api
```

## Lancer

```bash
npx nx serve potager-api      # dev (watch)
npx nx build potager-api      # build production (dist/)
```

## Routes

- `GET  /api/health` — sonde publique.
- `GET  /api/users/me` — profil de l'utilisateur authentifié (créé à la volée
  au premier appel authentifié).
- `PATCH /api/users/me` — met à jour le nom affiché.

Toutes les routes `/users/*` exigent un header `Authorization: Bearer <idToken>`
(ID token Firebase obtenu côté front après connexion Google).
