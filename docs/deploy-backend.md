# Déployer le backend sur Cloud Run (guide débutant)

Objectif : mettre l'API `potager-api` en ligne pour qu'une URL `https://…`
publique y réponde (au lieu de `localhost:3000`).

Tout le mécanisme (build de l'image Docker, envoi, déploiement) est **déjà
automatisé** dans le job **Build & déploiement backend** de
[`/.github/workflows/ci.yml`](../.github/workflows/ci.yml). Il se déclenche tout
seul, après le job de vérifications (rien n'est déployé si la CI est rouge) :

- **push sur `master`** → l'API en ligne (version « live ») ;
- **pull request** → une URL de prévisualisation dédiée, commentée sur la PR.

Tant que les secrets ne sont pas configurés, **il ne fait rien et reste vert**.
Ce guide couvre uniquement la config à faire **une seule fois**.

> 💡 Pas besoin d'installer quoi que ce soit : utilise **Google Cloud Shell**,
> le terminal dans le navigateur (bouton `>_` en haut à droite de la
> [console Google Cloud](https://console.cloud.google.com)). Copie-colle les
> blocs ci-dessous dedans.
>
> 💡 Ton projet Google existe déjà : c'est ton projet Firebase
> `justin-croyable-story`. On le réutilise.

---

## Étape 1 — Préparer Google (à coller dans Cloud Shell)

```bash
PROJECT_ID=justin-croyable-story
REGION=europe-west1
gcloud config set project "$PROJECT_ID"

# Activer les services utilisés
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# Créer le dépôt d'images Docker (le workflow attend le nom "potager")
gcloud artifacts repositories create potager \
  --repository-format=docker --location="$REGION"
```

## Étape 2 — Le « robot » de déploiement + sa clé

GitHub a besoin d'un compte de service Google (un « robot ») avec une clé pour
déployer à ta place.

```bash
gcloud iam service-accounts create gha-deployer \
  --display-name="GitHub Actions deployer"

SA="gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Droits nécessaires (déployer Cloud Run, pousser l'image, lire les secrets)
for ROLE in roles/run.admin roles/artifactregistry.writer \
            roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA" --role="$ROLE"
done

# Générer la clé JSON, puis l'afficher pour la copier
gcloud iam service-accounts keys create gha-key.json --iam-account="$SA"
echo "=== COPIE TOUT LE BLOC JSON CI-DESSOUS (secret GitHub GARDEN_HARVEST_GCP_SA_KEY) ==="
cat gha-key.json
```

Copie **l'intégralité** du JSON affiché (des `{` au `}`). Tu le colleras à
l'étape 4 dans le secret `GARDEN_HARVEST_GCP_SA_KEY`.

## Étape 3 — Les 4 valeurs dont l'API a besoin pour tourner

Ton API a besoin des mêmes valeurs qu'en local — **tu les as déjà** dans
`packages/potager-api/.env`. On les met dans le coffre-fort de Google
(« Secret Manager »).

Le plus simple : la [console Secret Manager](https://console.cloud.google.com/security/secret-manager)
→ **Create secret** → coller la valeur. Crée **exactement** ces 4 secrets
(le nom doit être identique) :

| Nom du secret | Valeur (depuis ton `.env`) |
| --- | --- |
| `DATABASE_URL` | ta chaîne de connexion Supabase (`postgres://…`) |
| `FIREBASE_PROJECT_ID` | `justin-croyable-story` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-…@….iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | la clé privée, **exactement** comme dans ton `.env` (avec les `\n`) |

Enfin, **autorise le compte qui exécute le conteneur** à lire ces secrets. Ce
n'est pas le même compte que le « robot » de l'étape 2 : Cloud Run exécute le
conteneur avec le *compte Compute par défaut* du projet. À coller dans Cloud
Shell :

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Étape 4 — Les secrets côté GitHub

Dans GitHub : **Settings → Secrets and variables → Actions → New repository
secret**. Crée :

| Secret GitHub | Valeur |
| --- | --- |
| `GARDEN_HARVEST_GCP_PROJECT_ID` | `justin-croyable-story` |
| `GARDEN_HARVEST_GCP_SA_KEY` | tout le JSON copié à l'étape 2 |
| `GARDEN_HARVEST_API_CORS_ORIGIN` | l'URL de ton front (ex. `https://justin-croyable-potager.web.app`) |
| `GARDEN_HARVEST_API_CORS_ORIGIN_REGEX` | `^https://justin-croyable-potager--[a-z0-9-]+\.web\.app$` (autorise les previews) |
| `GARDEN_HARVEST_DATABASE_URL` | *(optionnel)* même valeur que `DATABASE_URL` → applique les migrations Drizzle avant chaque déploiement |

## Étape 5 — Déclencher et récupérer l'URL

Une fois les secrets en place, relance le workflow **CI** (onglet Actions → CI
→ *Re-run*), ou pousse un commit. À la fin :

- version live : `gcloud run services describe potager-api --region europe-west1 --format='value(status.url)'` ;
- prévisualisation : l'URL est **commentée automatiquement sur la PR**.

Teste avec `curl https://TON-URL/api/health` → doit répondre `{"status":"ok"}`.

Cette URL est celle à mettre dans le secret `GARDEN_HARVEST_STAGING_API_URL` pour le front
(voir [deploy-frontend.md](./deploy-frontend.md)).

---

### En cas de souci

- « permission denied » à la création d'un secret → l'API Secret Manager
  n'est pas activée (refais l'étape 1).
- Le job reste vert mais ne déploie rien → un secret `GARDEN_HARVEST_GCP_SA_KEY` ou
  `GARDEN_HARVEST_GCP_PROJECT_ID` manque côté GitHub.
- « already exists » sur un secret → il existe déjà ; ajoute une version :
  `printf '%s' 'nouvelle-valeur' | gcloud secrets versions add NOM --data-file=-`.
