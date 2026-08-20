# Déployer le backend sur Cloud Run (guide débutant)

Objectif : mettre l'API `potager-api` en ligne pour qu'une URL `https://…`
publique y réponde (au lieu de `localhost:3000`).

Tout le mécanisme (build de l'image Docker, envoi, déploiement) est **déjà
automatisé** dans le job **Build & déploiement backend** de
[`/.github/workflows/ci.yml`](../.github/workflows/ci.yml). Il se déclenche tout
seul, après le job de vérifications (rien n'est déployé si la CI est rouge) :

- **push sur `master`** → service `potager-api`, branché sur la **base de
  production** ;
- **pull request** → service `potager-api-staging`, branché sur la **base de
  staging**, avec une URL de prévisualisation dédiée commentée sur la PR.

Les deux services vivent dans le **même projet Google Cloud** et partagent la
même image Docker : ce qui a été validé en staging est bit pour bit ce qui part
en production. Voir [l'étape 6](#étape-6--ajouter-lenvironnement-de-staging)
pour la mise en place du staging.

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
| `DATABASE_URL` | ta chaîne de connexion Supabase de **production** (`postgres://…`) |
| `FIREBASE_PROJECT_ID` | `justin-croyable-story` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-…@….iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | la clé privée, **exactement** comme dans ton `.env` (avec les `\n`) |

Les trois secrets Firebase sont **partagés** par la production et le staging
(même projet Firebase, donc mêmes comptes utilisateurs). Seule la base de
données est dédoublée, via un secret `DATABASE_URL_STAGING` ajouté à l'étape 6.

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
| `GARDEN_HARVEST_API_CORS_ORIGIN_REGEX` | optionnel : motif d'origine supplémentaire. Les canaux live et de prévisualisation de Firebase Hosting sont déjà reconnus par l'API |
| `GARDEN_HARVEST_DATABASE_URL` | *(optionnel)* même valeur que `DATABASE_URL` → applique les migrations Drizzle sur la base de **production** avant chaque déploiement `master` |

## Étape 5 — Déclencher et récupérer l'URL

Une fois les secrets en place, relance le workflow **CI** (onglet Actions → CI
→ *Re-run*), ou pousse un commit. À la fin :

- version live : `gcloud run services describe potager-api --region europe-west1 --format='value(status.url)'` ;
- prévisualisation : l'URL est **commentée automatiquement sur la PR**.

Teste avec `curl https://TON-URL/api/health` → doit répondre `{"status":"ok"}`.

Cette URL est celle à mettre dans le secret `GARDEN_HARVEST_PROD_API_URL` pour le
front (voir [deploy-frontend.md](./deploy-frontend.md)).

---

## Étape 6 — Ajouter l'environnement de staging

Objectif : que les pull requests ne travaillent plus jamais sur la base de
production. Rien à faire côté Google au-delà d'**un secret** : le service
`potager-api-staging` est créé automatiquement par la CI à sa première exécution
sur une PR.

### 6.1 — La base de staging (Supabase)

Le plan gratuit de Supabase donne **2 projets actifs** (le quota est compté sur
ton compte, pas par organisation) : le premier est la production, le second sera
le staging. Il n'est pas possible d'avoir deux bases isolées dans un *même*
projet Supabase — l'outil prévu pour ça, le *Branching*, est réservé au plan Pro.

1. [Dashboard Supabase](https://supabase.com/dashboard) → **New project**, par
   exemple `potager-staging`, même région que la production.
2. Récupérer la chaîne de connexion (**Connect** → *Session pooler*), au même
   format que celle de production.
3. Créer le schéma : Actions → **Migrate & Seed DB** → *Run workflow* →
   environnement `staging`. Ça applique les migrations Drizzle puis le seed de
   référence (variétés et prix). À faire **après** l'étape 6.2, qui crée le
   secret utilisé par ce workflow.

> ⚠️ Un projet Supabase gratuit est **mis en pause après 7 jours sans requête**.
> Un staging peu utilisé se réveille en un clic depuis le dashboard. Un projet
> en pause ne consomme pas de slot.

### 6.2 — Les deux secrets à créer

| Où | Nom | Valeur |
| --- | --- | --- |
| Secret Manager (GCP) | `DATABASE_URL_STAGING` | la chaîne de connexion Supabase de staging |
| GitHub Actions | `GARDEN_HARVEST_DATABASE_URL_STAGING` | la même valeur (sert aux migrations lancées par la CI) |

Le compte Compute par défaut a déjà le rôle `secretmanager.secretAccessor` sur
tout le projet (étape 3) : aucun droit supplémentaire à donner.

Aucun repli n'est prévu d'un environnement sur l'autre : si l'un de ces secrets
manque, l'étape correspondante est **sautée avec un avertissement** plutôt que
de risquer de toucher la mauvaise base.

### 6.3 — Récupérer l'URL du staging

Après le premier déploiement sur une PR :

```bash
gcloud run services describe potager-api-staging \
  --region europe-west1 --format='value(status.url)'
```

À mettre dans le secret GitHub `GARDEN_HARVEST_STAGING_API_URL` : c'est l'API
que viseront les prévisualisations du front.

### 6.4 — Ménage dans les images Docker

Deux services, c'est deux fois plus d'images poussées. Artifact Registry n'offre
que 0,5 Go gratuits par mois ; une règle de nettoyage évite la dérive :

```bash
gcloud artifacts repositories set-cleanup-policies potager \
  --location=europe-west1 \
  --policy=- <<'EOF'
[{"name":"garder-10-dernieres","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":10}}]
EOF
```

### 6.5 — Plus tard : basculer le staging sur un projet GCP dédié

Le workflow est déjà paramétré pour ça. Il suffit de créer les secrets GitHub
`GARDEN_HARVEST_GCP_PROJECT_ID_STAGING` et `GARDEN_HARVEST_GCP_SA_KEY_STAGING`
(en refaisant les étapes 1 à 3 dans le nouveau projet) : **aucune modification
de `ci.yml` n'est nécessaire**. Tant qu'ils sont absents, le staging utilise le
projet de production. Attention : les deux services ne partageront alors plus la
même image, et il faudra dupliquer les secrets Firebase dans le nouveau projet.

---

### En cas de souci

- « permission denied » à la création d'un secret → l'API Secret Manager
  n'est pas activée (refais l'étape 1).
- Le job reste vert mais ne déploie rien → un secret `GARDEN_HARVEST_GCP_SA_KEY` ou
  `GARDEN_HARVEST_GCP_PROJECT_ID` manque côté GitHub.
- « already exists » sur un secret → il existe déjà ; ajoute une version :
  `printf '%s' 'nouvelle-valeur' | gcloud secrets versions add NOM --data-file=-`.
