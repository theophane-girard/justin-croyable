# @justin-croyable/resume-admin

Interface d'administration du CV : connexion Google puis édition du profil, des
expériences, des compétences et des tags via `@justin-croyable/cv-api`.

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | Angular 21, standalone, zoneless, `OnPush` |
| UI | `@justin-croyable/design-system` + Tailwind v4 |
| API | ts-rest typé de bout en bout (`@justin-croyable/cv-contract`) |
| Auth | Firebase Auth, provider Google |

## Contrôle d'accès

L'app calcule un état d'accès (`SessionStore.access`) et n'affiche les écrans
d'édition que si le compte connecté est autorisé :

| État | Écran affiché |
| --- | --- |
| Firebase pas encore initialisé, ou `/auth/me` en cours | squelette de chargement |
| Personne n'est connecté | écran de connexion Google |
| Connecté mais `isAdmin: false` | « Accès refusé » + bouton pour changer de compte |
| Connecté et `isAdmin: true` | l'administration complète |

`isAdmin` vient de `GET /api/auth/me` : l'adresse autorisée est le secret
serveur `RESUME_ADMIN_EMAIL`, jamais exposé au navigateur. Le back reste seul
juge — il répond `403` à toute écriture faite avec un autre compte, même si le
front était contourné.

## Configuration

`src/environments/environment.ts` pointe l'API en développement
(`http://localhost:3100`). La configuration `production` remplace ce fichier
par `environment.production.ts` : y renseigner l'URL Cloud Run de `cv-api`.

La configuration Firebase (`src/app/core/app-config.ts`) est celle du projet
`justin-croyable-story`, partagée avec les autres apps du dépôt.

## Lancer

```bash
npx nx serve @justin-croyable/resume-admin   # dev, port 4400
npx nx build @justin-croyable/resume-admin   # build production (dist/resume-admin)
```

L'API doit tourner en parallèle (`npx nx serve cv-api`), et son `CORS_ORIGIN`
doit inclure `http://localhost:4400` — c'est le cas par défaut.

## Déployer

L'app est hébergée sur le site Firebase **`theophane-girard-resume-admin`**, dans
le projet `justin-croyable-story` partagé avec les autres apps. La cible de
hosting `resume-admin` fait le lien (`.firebaserc` + `firebase.json`).

```bash
npm run deploy:resume-admin           # build + déploiement sur le canal live
npm run deploy:resume-admin:preview   # canal de prévisualisation, 7 jours
```

En CI, `.github/workflows/deploy-resume-admin.yml` déploie sur `live` à chaque
push sur `master` où l'app est affectée. Il injecte au préalable l'URL Cloud Run
de `cv-api` (secret `CV_API_URL`) à la place du placeholder de
`environment.production.ts` ; sans ce secret le build reste fonctionnel mais
l'API est injoignable.

Il n'y a volontairement pas de déploiement de prévisualisation par PR : chaque
canal de preview est un domaine distinct qu'il faudrait autoriser dans Firebase
Auth → Settings → Authorized domains pour que la connexion Google fonctionne.
Le domaine du site live, lui, est à autoriser une fois.

Penser aussi à ajouter l'origine du site déployé au `CORS_ORIGIN` de `cv-api`.

## Écrans

| Route | Contenu |
| --- | --- |
| `/` | Profil : les 11 champs, enregistrés en un `PUT` (remplacement complet). |
| `/experiences` | Liste triée du plus récent au plus ancien, tags affichés. |
| `/experiences/ajouter`, `/experiences/:id` | Formulaire : type, titre, dates, tags (multi-sélection), description HTML. |
| `/competences` | Liste des compétences avec leur tag. |
| `/competences/ajouter`, `/competences/:id` | Formulaire : libellé + tag. |
| `/tags` | Liste des tags. |
| `/tags/ajouter`, `/tags/:id` | Formulaire : libellé, type, icône, image. |

Les suppressions passent par une confirmation (`DialogService.confirm`). Un tag
utilisé par une compétence ne peut pas être supprimé : l'API répond `409` et le
message est affiché en toast.

## Description riche des expériences

Le champ description est stocké et renvoyé en HTML brut. L'éditeur est une zone
de texte monospace : on y saisit le HTML directement. Aucun éditeur WYSIWYG
n'est embarqué — le design system n'en fournit pas, et en ajouter un serait un
composant custom à valider au préalable.
