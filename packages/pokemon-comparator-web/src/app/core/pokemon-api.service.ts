import { httpResource } from '@angular/common/http';
import { computed, Injectable, type Signal } from '@angular/core';

import { MEGA_SUPPLEMENT } from './mega-supplement.data';
import { type Ability, ABILITIES_QUERY, parseAbilities } from './pokemon-ability';
import {
  EVOLUTION_STAGE,
  type EvolutionStage,
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
    is_legendary
    is_mythical
    evolves_from_species_id
    pokemonspeciesnames(where: { language: { name: { _in: ["fr", "en", "de", "roomaji"] } } }) {
      name
      language {
        name
      }
    }
    pokemons(
      where: { _or: [{ is_default: { _eq: true } }, { name: { _ilike: "%-mega%" } }] }
      order_by: { id: asc }
    ) {
      id
      name
      is_default
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
      pokemonabilities(order_by: { slot: asc }) {
        ability {
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

interface GraphQlAbility {
  readonly ability: { readonly name: string } | null;
}

interface GraphQlPokemon {
  readonly id: number;
  readonly name: string;
  readonly is_default: boolean;
  readonly pokemonstats: readonly GraphQlStat[];
  readonly pokemontypes: readonly GraphQlType[];
  readonly pokemonabilities: readonly GraphQlAbility[];
}

interface GraphQlSpecies {
  readonly id: number;
  readonly name: string;
  readonly is_legendary: boolean;
  readonly is_mythical: boolean;
  readonly evolves_from_species_id: number | null;
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

const MEGA_PREFIX_BY_LANG: Record<Lang, string> = {
  [LANG.fr]: 'Méga-',
  [LANG.en]: 'Mega ',
  [LANG.de]: 'Mega-',
  [LANG.ja]: 'Mega ',
};

function megaVariant(slug: string): string | undefined {
  const marker = '-mega';
  const index = slug.indexOf(marker);
  if (index < 0) {
    return undefined;
  }
  return slug.slice(index + marker.length).replace(/^-/, '');
}

function megaNames(speciesNames: readonly PokemonName[], variant: string): PokemonName[] {
  const suffix = variant ? ` ${variant.toUpperCase()}` : '';
  return speciesNames.map(name => ({
    lang: name.lang,
    value: `${MEGA_PREFIX_BY_LANG[name.lang]}${name.value}${suffix}`,
  }));
}

interface SpeciesMeta {
  readonly stage: EvolutionStage;
  readonly legendary: boolean;
  readonly types: readonly string[];
  readonly abilitySlugs: readonly string[];
}

function mapAbilitySlugs(raw: readonly GraphQlAbility[]): string[] {
  return raw
    .map(entry => entry.ability?.name)
    .filter((slug): slug is string => slug !== undefined && slug !== null);
}

function mapForm(
  form: GraphQlPokemon,
  speciesNames: readonly PokemonName[],
  meta: SpeciesMeta,
): Pokemon | undefined {
  const stats = mapStats(form.pokemonstats);
  if (!stats) {
    return undefined;
  }
  const types = form.pokemontypes.map(item => item.type.name);
  const abilitySlugs = mapAbilitySlugs(form.pokemonabilities);
  const shared = { types, stats, stage: meta.stage, legendary: meta.legendary, abilitySlugs };
  if (form.is_default) {
    return { id: form.id, names: speciesNames, mega: false, ...shared };
  }
  const variant = megaVariant(form.name);
  if (variant === undefined) {
    return undefined;
  }
  return { id: form.id, names: megaNames(speciesNames, variant), mega: true, ...shared };
}

function buildStageResolver(
  species: readonly GraphQlSpecies[],
): (id: number) => EvolutionStage {
  const parentBySpecies = new Map<number, number | null>(
    species.map(entry => [entry.id, entry.evolves_from_species_id]),
  );
  const cache = new Map<number, EvolutionStage>();
  const resolve = (id: number, guard: number): EvolutionStage => {
    const cached = cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const parent = parentBySpecies.get(id);
    let stage: EvolutionStage = EVOLUTION_STAGE.base;
    if (parent != null && guard > 0) {
      stage = Math.min(resolve(parent, guard - 1) + 1, EVOLUTION_STAGE.final) as EvolutionStage;
    }
    cache.set(id, stage);
    return stage;
  };
  return (id: number) => resolve(id, 5);
}

function buildDex(species: readonly GraphQlSpecies[]): Pokemon[] {
  const namesBySpecies = new Map<number, readonly PokemonName[]>();
  const metaBySpecies = new Map<number, SpeciesMeta>();
  const stageOf = buildStageResolver(species);
  const base = species.flatMap(entry => {
    const speciesNames = mapNames(entry.pokemonspeciesnames);
    if (speciesNames.length === 0) {
      return [];
    }
    namesBySpecies.set(entry.id, speciesNames);
    const defaultForm = entry.pokemons.find(form => form.is_default);
    const meta: SpeciesMeta = {
      stage: stageOf(entry.id),
      legendary: entry.is_legendary || entry.is_mythical,
      types: defaultForm ? defaultForm.pokemontypes.map(item => item.type.name) : [],
      abilitySlugs: defaultForm ? mapAbilitySlugs(defaultForm.pokemonabilities) : [],
    };
    metaBySpecies.set(entry.id, meta);
    return entry.pokemons
      .map(form => mapForm(form, speciesNames, meta))
      .filter((pokemon): pokemon is Pokemon => pokemon !== undefined);
  });

  const known = new Set(base.map(pokemon => pokemon.id));
  const supplement = MEGA_SUPPLEMENT.flatMap((item): Pokemon[] => {
    if (known.has(item.id)) {
      return [];
    }
    const speciesNames = namesBySpecies.get(item.speciesId);
    const meta = metaBySpecies.get(item.speciesId);
    if (!speciesNames || !meta) {
      return [];
    }
    return [
      {
        id: item.id,
        names: megaNames(speciesNames, item.variant),
        types: meta.types,
        stats: item.stats,
        stage: meta.stage,
        legendary: meta.legendary,
        mega: true,
        abilitySlugs: meta.abilitySlugs,
      },
    ];
  });

  return [...base, ...supplement];
}

function parseResponse(value: unknown): readonly Pokemon[] {
  const species = (value as GraphQlResponse).data?.pokemonspecies;
  return species ? buildDex(species) : [];
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

  readonly #abilitiesResource = httpResource<readonly Ability[]>(
    () => ({
      url: POKEAPI_GRAPHQL_URL,
      method: 'POST',
      body: { query: ABILITIES_QUERY },
    }),
    { parse: parseAbilities, defaultValue: [] },
  );

  readonly pokemons: Signal<readonly Pokemon[]> = this.#resource.value;
  readonly isLoading: Signal<boolean> = this.#resource.isLoading;
  readonly hasError = computed(() => this.#resource.error() !== undefined);

  readonly abilities: Signal<readonly Ability[]> = this.#abilitiesResource.value;

  reload(): void {
    this.#resource.reload();
    this.#abilitiesResource.reload();
  }
}
