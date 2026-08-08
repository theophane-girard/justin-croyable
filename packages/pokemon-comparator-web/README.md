# Pokémon Comparator

Application web (Angular 21, zoneless) permettant de comparer les statistiques de
base de plusieurs Pokémon.

## Fonctionnalités

- **Navigation par sidebar** (composants DS `layout`/`sidebar`) : deux pages —
  **Comparateur** et **Pokédex**.
- **Page Pokédex** : grille de cartes colorées par type (sprite via le composant
  `avatar`, badges de type, numéro) avec recherche. Un **FAB** (composant DS
  `fab-button`) ouvre un panneau de **filtres** (type, stade d'évolution,
  légendaires) et de **tri** (par n°, type, total ou n'importe quelle
  statistique, ordre croissant/décroissant).
- **Page de détail** (`/pokedex/:id`) : en-tête coloré par type avec l'artwork,
  puis des onglets (composant DS `tabs`) « À propos » (noms dans les 4 langues,
  stade, catégorie, total) et « Statistiques » (barres), et un bouton
  « Ajouter au comparateur ».
- **Ajout depuis le Comparateur** : un bouton ouvre le même Pokédex en bottom
  sheet **pleine page** (composant DS `sheet`, grille scrollable).
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
