# @justin-croyable/potager-web

Application web (Angular 21, zoneless) de visualisation des récoltes d'un
potager et des économies réalisées, estimées d'après les prix moyens des fruits
et légumes en France.

Construite exclusivement avec les composants du design system
`@justin-croyable/design-system` (layout, sidebar, header, card, chart, table,
select, input, date-picker, badge, empty, button) et l'outillage Vite + Analog +
Tailwind v4, calqué sur `packages/storybook-web`.

## Fonctionnalités

- **Tableau de bord** : indicateurs clés (poids total récolté, économies
  estimées, nombre de cultures, nombre de récoltes) et trois graphiques
  (récoltes/économies par mois, économies par culture, répartition par
  catégorie).
- **Récoltes** : ajout d'une récolte (culture, poids, date), historique dans un
  tableau triable et paginé, suppression par sélection. Persistance locale via
  `localStorage`.

## Source des prix — API du gouvernement

Les économies sont valorisées au prix moyen au détail (€/kg) constaté en France.
La source est le **Réseau des Nouvelles des Marchés (RNM)** de **FranceAgriMer**,
dont les cotations sont publiées en open data sur **data.gouv.fr** (jeu de
données `cotations-du-reseau-des-nouvelles-des-marches`).

- `GovPriceService` interroge l'API de data.gouv.fr, sélectionne la dernière
  cotation « détail » (vente au consommateur), la charge via l'API tabulaire et
  calcule un prix moyen par culture.
- En l'absence de réseau, de CORS ou si le schéma diffère, l'application se
  rabat automatiquement sur une **table de prix de référence** (calée sur les
  ordres de grandeur du RNM) afin de rester fonctionnelle hors ligne. Le bandeau
  d'en-tête indique la source active (« Prix RNM en direct » ou « Prix de
  référence »).

## Développement

Depuis la racine du monorepo :

```bash
npm install
npx nx serve @justin-croyable/potager-web   # dev server (http://localhost:4300)
npx nx build @justin-croyable/potager-web   # build de production -> dist/potager-web
```
