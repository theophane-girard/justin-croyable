# Déploiement du front (Firebase Hosting)

Le workflow [`/.github/workflows/ci.yml`](../.github/workflows/ci.yml) build
`potager-web` en configuration `production` dans le job **Vérifications et
builds**, puis le job **Déploiement de l'app potager** publie ce build sur
Firebase Hosting (site `justin-croyable-potager`) :

- **push sur `master`** → déploiement sur le canal **live** (production).
- **pull request** → **canal de prévisualisation** `pr-<n>` avec une URL
  temporaire (expire au bout de 7 jours), commentée automatiquement sur la PR.

Tant que le secret `FIREBASE_SERVICE_ACCOUNT` n'est pas configuré, **le job de
déploiement est simplement ignoré** (même garde que le déploiement backend).

Le déploiement dépend (`needs`) du job de vérifications : si le typecheck, le
lint ou les tests échouent, **rien n'est déployé**.

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
