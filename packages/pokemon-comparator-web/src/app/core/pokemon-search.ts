import { type Lang, type Pokemon, pokemonName } from './pokemon.model';

export interface PokemonMatch {
  readonly pokemon: Pokemon;
  readonly matchedLang: Lang;
  readonly matchedName: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

function findMatch(pokemon: Pokemon, needle: string): PokemonMatch | undefined {
  const primary = pokemon.names.find(name => normalize(name.value).includes(needle));
  if (!primary) {
    return undefined;
  }
  return { pokemon, matchedLang: primary.lang, matchedName: primary.value };
}

const FRENCH_LANG: Lang = 'fr';

export function searchPokemons(
  pokemons: readonly Pokemon[],
  query: string,
  excludedIds: ReadonlySet<number>,
): readonly PokemonMatch[] {
  const needle = normalize(query);
  if (needle.length === 0) {
    return [];
  }
  return pokemons
    .filter(pokemon => !excludedIds.has(pokemon.id))
    .map(pokemon => findMatch(pokemon, needle))
    .filter((match): match is PokemonMatch => match !== undefined)
    .sort((a, b) =>
      pokemonName(a.pokemon, FRENCH_LANG).localeCompare(pokemonName(b.pokemon, FRENCH_LANG), 'fr'),
    );
}
