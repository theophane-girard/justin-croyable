# Pokémon Comparator

Application web (Angular 21, zoneless) permettant de comparer les statistiques de
base de plusieurs Pokémon.

## Fonctionnalités

- **Navigation par sidebar** (composants DS `layout`/`sidebar`) : deux pages —
  **Comparateur** et **Pokédex**.
- **Grille Pokédex partagée** (`PokedexGridComponent`) : cartes colorées par
  type (sprite avec **skeleton de chargement**, badges de type, numéro),
  **virtual scroll** (CDK) pour afficher tout le Pokédex efficacement, et un
  **speed dial** (composant DS `fab`) à deux boutons :
  - **Filtrer** : type (multi), stade d'évolution, légendaires ;
  - **Trier** : par n°, type, total ou n'importe quelle statistique, ordre
    croissant/décroissant.
  Cette grille est utilisée par la page Pokédex **et** par la recherche du
  comparateur (mêmes filtres/tri disponibles).
- **Page de détail** (`/pokedex/:id`) : en-tête coloré par type avec l'artwork,
  puis deux onglets (composant DS `tabs`) :
  - **Aperçu** : informations en tags colorés (une couleur réservée par type
    d'info : stade, catégorie/légendaire, total), **talents** (clic → popover
    avec la description) et **statistiques de base** ;
  - **Attaques** : liste des attaques apprenables (nom, type, catégorie
    physique/spéciale/statut, puissance) avec un **speed dial** pour filtrer
    (type, catégorie) et trier (puissance / nom).
  Les talents et attaques sont chargés à la demande par Pokémon (httpResource).
  Un clic sur un Pokémon du **comparateur** ouvre aussi sa page de détail.
- **Ajout depuis le Comparateur** : un bouton ouvre le Pokédex en bottom sheet
  **pleine page** (composant DS `sheet`).
- **Recherche multilingue** : le champ filtre sur les noms dans toutes les
  langues (français, anglais, allemand, japonais), insensible aux accents et aux
  tirets/espaces. Exemple : saisir `snor` remonte **Ronflex** (Snorlax en
  anglais) ; `méga dracaufeu` remonte les méga-évolutions de Dracaufeu.
- **Visualisation en barres** : les statistiques (PV, Attaque, Défense, Attaque
  Spéciale, Défense Spéciale, Vitesse) sont affichées avec des barres de
  progression, une par Pokémon, empilées les unes en dessous des autres.
- **Visualisation en radar** : un bouton segment bascule l'affichage vers un
  graphique radar comparant les six statistiques d'un coup d'œil.
- **Thème clair / sombre** commutable.

L'app s'appuie exclusivement sur les composants de `@justin-croyable/design-system`
(command, card, chip, progress, segment, chart, empty, button, layout).

## Données

Les données Pokémon (noms multilingues, types, statistiques de base) sont
récupérées en direct depuis l'**API GraphQL de PokéAPI**
(`https://graphql.pokeapi.co/v1beta2`) en une seule requête au démarrage, via
`PokemonApiService` (`src/app/core/pokemon-api.service.ts`) qui s'appuie sur
`httpResource`. Les noms sont demandés en français, anglais, allemand et rōmaji
(japonais) pour alimenter la recherche multilingue. L'app gère les états de
chargement et d'erreur (avec bouton « Réessayer »).

## Commandes

```bash
# Build de production
nx build @justin-croyable/pokemon-comparator-web

# Serveur de développement (port 4301)
nx serve @justin-croyable/pokemon-comparator-web
```
