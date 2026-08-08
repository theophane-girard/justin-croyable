# Pokémon Comparator

Application web (Angular 21, zoneless) permettant de comparer les statistiques de
base de plusieurs Pokémon.

## Fonctionnalités

- **Recherche multilingue** : le champ de recherche filtre sur les noms dans
  toutes les langues (français, anglais, allemand, japonais) et est insensible
  aux accents. Exemple : saisir `snor` remonte **Ronflex** (Snorlax en anglais).
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
