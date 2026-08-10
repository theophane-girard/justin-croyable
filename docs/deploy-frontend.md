# Déploiement du front (Firebase Hosting)

Le workflow [`/.github/workflows/deploy-web.yml`](../.github/workflows/deploy-web.yml)
build `potager-web` en configuration `production` et le déploie sur Firebase
Hosting (site `justin-croyable-potager`) :

- **push sur `master`** → déploiement sur le canal **live** (production).
- **pull request** → **canal de prévisualisation** `pr-<n>` avec une URL
  temporaire (expire au bout de 7 jours), commentée automatiquement sur la PR.

Tant que le secret `FIREBASE_SERVICE_ACCOUNT` n'est pas configuré, **le job
reste vert et ne déploie rien** (même garde que le déploiement backend).

## URL de l'API

`API_BASE_URL` est résolue au build via les fichiers d'environnement Angular :

- dev / `nx serve` → `environment.ts` → `http://localhost:3000` ;
- build `production` → `environment.production.ts`, dont l'URL est remplacée en
  CI par le secret `GARDEN_HARVEST_STAGING_API_URL` (l'URL Cloud Run du backend).

Toutes les prévisualisations front pointent vers **la même API de staging**
partagée (l'URL live Cloud Run), conformément au choix « base de staging
partagée ».

## Secrets GitHub Actions (Settings → Secrets → Actions)

| Secret | Valeur |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON d'un compte de service Firebase avec le rôle *Firebase Hosting Admin* (projet `justin-croyable-story`) |
| `GARDEN_HARVEST_STAGING_API_URL` | URL publique de l'API Cloud Run (ex. `https://potager-api-xxxx-ew.a.run.app`) |

Créer le compte de service Firebase :

```bash
firebase init hosting:github   # génère et enregistre FIREBASE_SERVICE_ACCOUNT
# ou manuellement : GCP Console → IAM → comptes de service → clé JSON,
# rôle "Firebase Hosting Admin", collée dans le secret FIREBASE_SERVICE_ACCOUNT.
```

## CORS (indispensable pour les previews)

Les canaux de prévisualisation ont un sous-domaine dynamique
(`justin-croyable-potager--pr-<n>-<hash>.web.app`). Pour que l'API les accepte,
renseigner côté backend (voir [deploy-backend.md](./deploy-backend.md)) le
secret :

| Secret | Valeur |
| --- | --- |
| `API_CORS_ORIGIN_REGEX` | `^https://justin-croyable-potager--[a-z0-9-]+\.web\.app$` |

Et mettre les domaines stables (front live) dans `API_CORS_ORIGIN`
(liste séparée par des virgules).
