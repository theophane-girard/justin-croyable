# Déploiement du front (Firebase Hosting)

Le workflow [`/.github/workflows/ci.yml`](../.github/workflows/ci.yml) build
`potager-web` en configuration `production` dans le job **Vérifications et
builds**, puis le job **Déploiement de l'app potager** publie ce build sur
Firebase Hosting (site `justin-croyable-potager`) :

- **push sur `master`** → déploiement sur le canal **live** (production).
- **pull request** → **canal de prévisualisation** `pr<n>-<branche tronquée>`
  avec une URL temporaire (expire au bout de 7 jours), commentée automatiquement
  sur la PR.

Tant que le secret `FIREBASE_SERVICE_ACCOUNT` n'est pas configuré, **le job de
déploiement est simplement ignoré** (même garde que le déploiement backend).

Le déploiement dépend (`needs`) du job de vérifications : si le typecheck, le
lint ou les tests échouent, **rien n'est déployé**.

## URL de l'API

`API_BASE_URL` est résolue au build via les fichiers d'environnement Angular :

- dev / `nx serve` → `environment.ts` → `http://localhost:3000` ;
- build `production` → `environment.production.ts`, dont l'URL est remplacée en
  CI par l'URL Cloud Run de l'environnement déployé :
  - push sur `master` → `GARDEN_HARVEST_PROD_API_URL` (service `potager-api`,
    base de production) ;
  - pull request → `GARDEN_HARVEST_STAGING_API_URL` (service
    `potager-api-staging`, base de staging).

Toutes les prévisualisations front pointent vers **la même API de staging**
partagée — l'URL racine du service de staging, qui sert la dernière révision de
PR déployée. Aucune d'elles ne touche donc plus la base de production.

> Tant que `GARDEN_HARVEST_PROD_API_URL` n'est pas créé, le build live retombe
> sur l'URL de staging (avec un avertissement dans les logs de la CI) : c'est le
> comportement d'avant la séparation des environnements.

## Secrets GitHub Actions (Settings → Secrets → Actions)

| Secret | Valeur |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON d'un compte de service Firebase avec le rôle *Firebase Hosting Admin* (projet `justin-croyable-story`) |
| `GARDEN_HARVEST_PROD_API_URL` | URL publique du service `potager-api` (ex. `https://potager-api-xxxx-ew.a.run.app`) |
| `GARDEN_HARVEST_STAGING_API_URL` | URL publique du service `potager-api-staging` |

Créer le compte de service Firebase :

```bash
firebase init hosting:github   # génère et enregistre FIREBASE_SERVICE_ACCOUNT
# ou manuellement : GCP Console → IAM → comptes de service → clé JSON,
# rôle "Firebase Hosting Admin", collée dans le secret FIREBASE_SERVICE_ACCOUNT.
```

## CORS (previews)

Les canaux de prévisualisation ont un sous-domaine dynamique, de la forme
`justin-croyable-potager--<canal>-<empreinte>.web.app`. Le nom de canal est
produit par l'action de déploiement (`pr<n>-` suivi des 20 premiers caractères
de la branche, tirets compris), pas par un simple numéro de PR : une branche
`claude/potager-app-updates-56zitv` sur la PR 105 donne
`justin-croyable-potager--pr105-claude-potager-app-u-<empreinte>.web.app`.

L'API reconnaît ces origines d'elle-même
([`cors-origin.ts`](../packages/potager-api/src/config/cors-origin.ts), couvert
par des tests) : elle accepte le canal live et tout canal de prévisualisation des
sites qu'elle sert. **Aucun secret n'est nécessaire pour les previews.**

Restent utiles côté backend (voir [deploy-backend.md](./deploy-backend.md)) :

| Secret | Usage |
| --- | --- |
| `GARDEN_HARVEST_API_CORS_ORIGIN` | domaines stables hors Firebase Hosting (liste séparée par des virgules) |
| `GARDEN_HARVEST_API_CORS_ORIGIN_REGEX` | motif supplémentaire, pour une origine que la règle Firebase ne couvre pas |
