import { httpResource } from '@angular/common/http';
import { computed, Injectable, type Signal } from '@angular/core';

import {
  LANG,
  type Lang,
  type Pokemon,
  type PokemonName,
  type Stat,
  STAT,
  STAT_ORDER,
} from './pokemon.model';

const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

const POKEDEX_QUERY = `
query PokemonComparatorDex {
  pokemonspecies(order_by: { id: asc }, where: { pokemons: { is_default: { _eq: true } } }) {
    id
    name
    pokemonspeciesnames(where: { language: { name: { _in: ["fr", "en", "de", "roomaji"] } } }) {
      name
      language {
        name
      }
    }
    pokemons(where: { is_default: { _eq: true } }, limit: 1) {
      pokemonstats {
        base_stat
        stat {
          name
        }
      }
      pokemontypes {
        type {
          name
        }
      }
    }
  }
}`;

interface GraphQlName {
  readonly name: string;
  readonly language: { readonly name: string };
}

interface GraphQlStat {
  readonly base_stat: number;
  readonly stat: { readonly name: string };
}

interface GraphQlType {
  readonly type: { readonly name: string };
}

interface GraphQlPokemon {
  readonly pokemonstats: readonly GraphQlStat[];
  readonly pokemontypes: readonly GraphQlType[];
}

interface GraphQlSpecies {
  readonly id: number;
  readonly name: string;
  readonly pokemonspeciesnames: readonly GraphQlName[];
  readonly pokemons: readonly GraphQlPokemon[];
}

interface GraphQlResponse {
  readonly data?: { readonly pokemonspecies?: readonly GraphQlSpecies[] };
}

const LANG_BY_API_NAME = new Map<string, Lang>([
  ['fr', LANG.fr],
  ['en', LANG.en],
  ['de', LANG.de],
  ['roomaji', LANG.ja],
]);

const STAT_BY_API_NAME = new Map<string, Stat>([
  ['hp', STAT.hp],
  ['attack', STAT.attack],
  ['defense', STAT.defense],
  ['special-attack', STAT.specialAttack],
  ['special-defense', STAT.specialDefense],
  ['speed', STAT.speed],
]);

function mapNames(raw: readonly GraphQlName[]): PokemonName[] {
  return raw
    .map(entry => {
      const lang = LANG_BY_API_NAME.get(entry.language.name);
      return lang ? { lang, value: entry.name } : undefined;
    })
    .filter((name): name is PokemonName => name !== undefined);
}

function mapStats(raw: readonly GraphQlStat[]): Record<Stat, number> | undefined {
  const entries = raw
    .map(entry => {
      const stat = STAT_BY_API_NAME.get(entry.stat.name);
      return stat ? ([stat, entry.base_stat] as const) : undefined;
    })
    .filter((entry): entry is readonly [Stat, number] => entry !== undefined);
  if (entries.length < STAT_ORDER.length) {
    return undefined;
  }
  return Object.fromEntries(entries) as Record<Stat, number>;
}

function mapSpecies(species: readonly GraphQlSpecies[]): Pokemon[] {
  return species
    .map((entry): Pokemon | undefined => {
      const pokemon = entry.pokemons[0];
      if (!pokemon) {
        return undefined;
      }
      const stats = mapStats(pokemon.pokemonstats);
      if (!stats) {
        return undefined;
      }
      const names = mapNames(entry.pokemonspeciesnames);
      if (names.length === 0) {
        return undefined;
      }
      const types = pokemon.pokemontypes.map(item => item.type.name);
      return { id: entry.id, names, types, stats };
    })
    .filter((pokemon): pokemon is Pokemon => pokemon !== undefined);
}

function parseResponse(value: unknown): readonly Pokemon[] {
  const species = (value as GraphQlResponse).data?.pokemonspecies;
  return species ? mapSpecies(species) : [];
}

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  readonly #resource = httpResource<readonly Pokemon[]>(
    () => ({
      url: POKEAPI_GRAPHQL_URL,
      method: 'POST',
      body: { query: POKEDEX_QUERY },
    }),
    { parse: parseResponse, defaultValue: [] },
  );

  readonly pokemons: Signal<readonly Pokemon[]> = this.#resource.value;
  readonly isLoading: Signal<boolean> = this.#resource.isLoading;
  readonly hasError = computed(() => this.#resource.error() !== undefined);

  reload(): void {
    this.#resource.reload();
  }
}
