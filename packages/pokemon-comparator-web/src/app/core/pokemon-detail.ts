export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

export interface PokemonAbility {
  readonly name: string;
  readonly description: string;
  readonly hidden: boolean;
}

export interface PokemonMove {
  readonly name: string;
  readonly power: number | null;
  readonly type: string;
  readonly damageClass: string;
}

export interface PokemonDetailData {
  readonly abilities: readonly PokemonAbility[];
  readonly moves: readonly PokemonMove[];
}

export const EMPTY_DETAIL: PokemonDetailData = { abilities: [], moves: [] };

export const POKEMON_DETAIL_QUERY = `
query PokemonDetail($id: Int!) {
  pokemon(where: { id: { _eq: $id } }) {
    pokemonabilities(order_by: { slot: asc }) {
      is_hidden
      ability {
        name
        abilitynames(where: { language: { name: { _in: ["fr", "en"] } } }) {
          name
          language { name }
        }
        abilityeffecttexts(where: { language: { name: { _in: ["fr", "en"] } } }) {
          short_effect
          effect
          language { name }
        }
      }
    }
    pokemonmoves(distinct_on: move_id, order_by: { move_id: asc }) {
      move {
        name
        power
        movenames(where: { language: { name: { _in: ["fr", "en"] } } }) {
          name
          language { name }
        }
        type { name }
        movedamageclass { name }
      }
    }
  }
}`;

interface LocalizedName {
  readonly name: string;
  readonly language: { readonly name: string };
}

interface EffectText {
  readonly short_effect: string | null;
  readonly effect: string | null;
  readonly language: { readonly name: string };
}

interface RawAbility {
  readonly is_hidden: boolean;
  readonly ability: {
    readonly name: string;
    readonly abilitynames: readonly LocalizedName[];
    readonly abilityeffecttexts: readonly EffectText[];
  } | null;
}

interface RawMove {
  readonly move: {
    readonly name: string;
    readonly power: number | null;
    readonly movenames: readonly LocalizedName[];
    readonly type: { readonly name: string } | null;
    readonly movedamageclass: { readonly name: string } | null;
  } | null;
}

interface RawPokemon {
  readonly pokemonabilities: readonly RawAbility[];
  readonly pokemonmoves: readonly RawMove[];
}

interface DetailResponse {
  readonly data?: { readonly pokemon?: readonly RawPokemon[] };
}

function pickName(names: readonly LocalizedName[], fallback: string): string {
  const french = names.find(entry => entry.language.name === 'fr');
  const english = names.find(entry => entry.language.name === 'en');
  return french?.name ?? english?.name ?? fallback;
}

function pickEffect(texts: readonly EffectText[]): string {
  const french = texts.find(entry => entry.language.name === 'fr');
  const english = texts.find(entry => entry.language.name === 'en');
  const chosen = french ?? english;
  return chosen?.short_effect ?? chosen?.effect ?? 'Description indisponible.';
}

export function parsePokemonDetail(value: unknown): PokemonDetailData {
  const pokemon = (value as DetailResponse).data?.pokemon?.[0];
  if (!pokemon) {
    return EMPTY_DETAIL;
  }

  const abilities = pokemon.pokemonabilities
    .filter((entry): entry is RawAbility & { ability: NonNullable<RawAbility['ability']> } =>
      entry.ability !== null,
    )
    .map(entry => ({
      name: pickName(entry.ability.abilitynames, entry.ability.name),
      description: pickEffect(entry.ability.abilityeffecttexts),
      hidden: entry.is_hidden,
    }));

  const moves = pokemon.pokemonmoves
    .filter((entry): entry is RawMove & { move: NonNullable<RawMove['move']> } => entry.move !== null)
    .map(entry => ({
      name: pickName(entry.move.movenames, entry.move.name),
      power: entry.move.power,
      type: entry.move.type?.name ?? '',
      damageClass: entry.move.movedamageclass?.name ?? '',
    }));

  return { abilities, moves };
}
