# Prix de détail RNM (FranceAgriMer)

Ce document décrit l'ingestion des prix de vente au détail des fruits & légumes
depuis le **Réseau des Nouvelles des Marchés** (RNM / FranceAgriMer), utilisés
pour valoriser les récoltes et estimer les économies.

## Source

- Fichier annuel Visionet : `COT-MUL-prd_RNM-A{AA}.zip` (ex. `A26` = 2026),
  téléchargé via `https://visionet.franceagrimer.fr/Pages/OpenDocument.aspx`.
- Contenu : 1 CSV, encodage **ISO-8859-1**, séparateur **`;`**, date `JJ/MM/AAAA`,
  décimale à la virgule, ~228 000 lignes/an.
- Licence ouverte FranceAgriMer, **réutilisation commerciale autorisée** avec
  **mention des sources**.

## Ce que l'ingestion retient

- **stade** = `Détail` uniquement ;
- **marchés** = `Fruits/Légumes France DETAIL GMS` (conventionnel + bio) et
  `… MAG. SPECIALISES BIO` (bio) ;
- **unité** = `le kg` strictement (les lignes à la pièce / botte / barquette /
  tige sont rejetées) ;
- **bio** = libellé contenant `biologique` **ou** marché spécialisé bio ;
  priorité au **magasin spécialisé**, GMS bio en repli (`BIO_MARKET_PRIORITY`).

Le mapping libellé RNM → variété est configurable dans
`packages/potager-api/src/variety-prices/rnm/rnm-mapping.ts`. Les variétés sans
prix conventionnel au détail au kg (salade à la pièce, radis en botte, épinard,
concombre, tomates « terroir »…) sont **ignorées** et conservent le prix de
référence du seed.

L'ingestion remplace, en transaction, les lignes `source = 'rnm'` de
`variety_prices`. **Anti-clobber** : rien n'est écrasé si le téléchargement ou
le parsing échoue, ou si le fichier contient trop peu de cotations détail.

## Inventaire des libellés (pour enrichir le mapping)

Le RNM publie au stade détail des libellés bien plus fins que nos catégories
(variété + couleur + calibre + conditionnement, ex. `AUBERGINE violette`,
`PÊCHE chair jaune`, `POMME Gala`). Pour découvrir ces libellés avant d'écrire
de nouveaux matchers, un script liste **tous les libellés détail distincts** du
fichier annuel, avec leur fréquence, leurs marchés et leurs unités :

```bash
# Tous les libellés détail de l'année courante
npx nx rnm-inventory potager-api

# Année précise + filtre texte (variables d'env, toujours transmises)
RNM_YEAR=2026 RNM_FILTER=tomate npx nx rnm-inventory potager-api
```

Il n'écrit rien en base : il télécharge le ZIP, parse le CSV et affiche
trois sections (marchés, unités, libellés produit). Utile pour transformer les
lignes « probables » de la nomenclature en matchers concrets dans
`rnm-mapping.ts`.

## Déclenchement

### Manuel (disponible)

Interface admin → page **Administration des prix** → bouton
**« Rafraîchir (RNM) »**. Appelle `POST /api/variety-prices/refresh`
(réservé aux admins : FirebaseAuthGuard + AdminGuard).

### Automatique (Cloud Scheduler)

L'endpoint admin étant protégé par Firebase, un **second endpoint** est prévu
pour la planification, hors Firebase, protégé par un **jeton secret** :

`POST /api/variety-prices/refresh-cron` — en-tête `X-Refresh-Token: <secret>`.

Le secret est la variable d'environnement Cloud Run **`RNM_REFRESH_TOKEN`** ;
si elle est absente, l'endpoint refuse tout (403). Le workflow `deploy-api.yml`
l'injecte depuis le secret GitHub **`GARDEN_HARVEST_RNM_REFRESH_TOKEN`**.

Mise en place (une fois) :

```bash
# 1. Choisir un secret et le déclarer côté GitHub
#    Settings → Secrets → Actions → GARDEN_HARVEST_RNM_REFRESH_TOKEN = <secret>
#    (le prochain déploiement backend le posera sur Cloud Run)

# 2. Créer le job Cloud Scheduler (quotidien 06:00 Europe/Paris)
API_URL=$(gcloud run services describe potager-api --region europe-west1 --format='value(status.url)')
gcloud scheduler jobs create http rnm-refresh \
  --location europe-west1 \
  --schedule "0 6 * * *" \
  --time-zone "Europe/Paris" \
  --uri "${API_URL}/api/variety-prices/refresh-cron" \
  --http-method POST \
  --headers "X-Refresh-Token=<secret>" \
  --attempt-deadline 300s
```

Coût : Cloud Scheduler offre 3 jobs gratuits/mois ; l'appel quotidien reste ~0 €.

Rappel : la donnée détail RNM est **hebdomadaire** avec ~8 j de décalage. Le job
quotidien ingère simplement dès qu'une nouvelle semaine paraît ; l'app affiche la
date effective (`effective_from`), pas « aujourd'hui ».

## Attribution

Afficher, à côté des prix issus du RNM, une mention du type :
« Source : Réseau des Nouvelles des Marchés — FranceAgriMer (stade détail) ».
