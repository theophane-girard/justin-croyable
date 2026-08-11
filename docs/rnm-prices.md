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

## Déclenchement

### Manuel (disponible)

Interface admin → page **Administration des prix** → bouton
**« Rafraîchir (RNM) »**. Appelle `POST /api/variety-prices/refresh`
(réservé aux admins, garde Firebase + CASL).

### Automatique (à mettre en place)

L'endpoint étant protégé par l'authentification Firebase admin, Cloud Scheduler
(jeton OIDC Google) ne peut pas l'appeler tel quel. Deux options pour un
rafraîchissement quotidien :

1. **Endpoint dédié à secret** : ajouter une route non-Firebase protégée par un
   en-tête secret (`X-Refresh-Token`), et configurer Cloud Scheduler pour l'appeler
   quotidiennement avec ce secret.
2. **Cloud Run Job** : exécuter le service d'ingestion en job planifié (pas
   d'authentification HTTP), déclenché par Cloud Scheduler.

Rappel : la donnée détail RNM est **hebdomadaire** avec ~8 j de décalage. Un job
quotidien ingère simplement dès qu'une nouvelle semaine paraît ; l'app affiche la
date effective (`effective_from`), pas « aujourd'hui ».

## Attribution

Afficher, à côté des prix issus du RNM, une mention du type :
« Source : Réseau des Nouvelles des Marchés — FranceAgriMer (stade détail) ».
