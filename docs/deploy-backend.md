# Déploiement du backend (Cloud Run)

Le workflow [`/.github/workflows/deploy-api.yml`](../.github/workflows/deploy-api.yml)
construit une image Docker de `potager-api`, la pousse sur Artifact Registry et
déploie sur Cloud Run :

- **push sur `master`** → déploiement sur la révision **live** (`potager-api`).
- **pull request** → révision **taggée `pr-<n>`** sans trafic, avec une URL de
  prévisualisation dédiée commentée sur la PR (comme les canaux Firebase).

Tant que les secrets GCP ne sont pas configurés, **le job reste vert et ne
déploie rien** (garde identique au déploiement Firebase).

## 1. Ressources GCP (une seule fois)

```bash
PROJECT_ID=mon-projet
REGION=europe-west1

gcloud config set project "$PROJECT_ID"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  secretmanager.googleapis.com

# Dépôt d'images Docker (nom attendu par le workflow : "potager")
gcloud artifacts repositories create potager \
  --repository-format=docker --location="$REGION"
```

## 2. Secrets d'exécution (Secret Manager)

Le service Cloud Run lit ces secrets via `--set-secrets` :

```bash
printf '%s' 'postgres://…'                 | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' "$PROJECT_ID"                  | gcloud secrets create FIREBASE_PROJECT_ID --data-file=-
printf '%s' 'firebase-adminsdk-…@…'        | gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=-
printf '%s' '-----BEGIN PRIVATE KEY----- …'| gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
```

## 3. Compte de service de déploiement + Workload Identity Federation

```bash
# Compte de service utilisé par la CI
gcloud iam service-accounts create gha-deployer --display-name="GitHub Actions deployer"
SA="gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.writer \
            roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$ROLE"
done

# Pool + provider WIF liés au dépôt GitHub
gcloud iam workload-identity-pools create github --location=global
gcloud iam workload-identity-pools providers create-oidc github-actions \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='theophane-girard/justin-croyable'"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/theophane-girard/justin-croyable"
```

## 4. Secrets GitHub Actions (Settings → Secrets → Actions)

| Secret | Valeur |
| --- | --- |
| `GCP_PROJECT_ID` | l'ID du projet GCP |
| `GCP_SERVICE_ACCOUNT` | `gha-deployer@<projet>.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<num>/locations/global/workloadIdentityPools/github/providers/github-actions` |
| `API_CORS_ORIGIN` | origine autorisée (domaine du front) |
| `DATABASE_URL` | *(optionnel)* si présent, la CI applique les migrations Drizzle avant déploiement |

## 5. Base de données de prévisualisation

Le backend a besoin d'un schéma migré. Deux options :

- fournir le secret `DATABASE_URL` à la CI → migrations appliquées
  automatiquement (`nx db-migrate potager-api`) avant chaque déploiement ;
- ou appliquer les migrations manuellement une fois
  (`DATABASE_URL=… npx nx db-migrate potager-api`).

Sur Neon, préférer une **branche de base dédiée** aux prévisualisations pour
isoler les données ; sur Supabase, un projet de staging distinct de la prod.
