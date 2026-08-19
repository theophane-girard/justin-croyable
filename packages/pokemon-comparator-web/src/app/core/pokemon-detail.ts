export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

export interface PokemonAbility {
  readonly name: string;
  readonly description: string;
  readonly hidden: boolean;
}

export interface PokemonMove {
  readonly name: string;
  readonly slug: string;
  readonly power: number | null;
  readonly accuracy: number | null;
  readonly type: string;
  readonly damageClass: string;
  readonly description: string;
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
        accuracy
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
    readonly accuracy: number | null;
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
      slug: entry.move.name,
      power: entry.move.power,
      accuracy: entry.move.accuracy,
      type: entry.move.type?.name ?? '',
      damageClass: entry.move.movedamageclass?.name ?? '',
      description: '',
    }));

  return { abilities, moves };
}

const FRENCH_LANGUAGE_ID = 5;
const ENGLISH_LANGUAGE_ID = 9;

export const MOVE_EFFECTS_QUERY = `
query PokemonComparatorMoveEffects($moves: [String!]!) {
  move(where: { name: { _in: $moves } }) {
    name
    move_effect_chance
    moveflavortexts(
      where: { language_id: { _eq: ${FRENCH_LANGUAGE_ID} } }
      order_by: { version_group_id: desc }
      limit: 1
    ) {
      flavor_text
    }
    moveeffect {
      moveeffecteffecttexts(where: { language_id: { _eq: ${ENGLISH_LANGUAGE_ID} } }) {
        short_effect
        effect
      }
    }
  }
}`;

interface RawMoveEffectText {
  readonly short_effect: string | null;
  readonly effect: string | null;
}

interface RawMoveFlavor {
  readonly flavor_text: string | null;
}

interface RawMoveEffect {
  readonly name: string;
  readonly move_effect_chance: number | null;
  readonly moveflavortexts: readonly RawMoveFlavor[];
  readonly moveeffect: { readonly moveeffecteffecttexts: readonly RawMoveEffectText[] } | null;
}

interface MoveEffectsResponse {
  readonly data?: { readonly move?: readonly RawMoveEffect[] };
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function moveDescription(move: RawMoveEffect): string {
  const flavor = move.moveflavortexts[0]?.flavor_text;
  if (flavor) {
    return normalizeWhitespace(flavor);
  }
  const technical = move.moveeffect?.moveeffecteffecttexts?.[0];
  const raw = technical?.short_effect ?? technical?.effect ?? '';
  const chance = move.move_effect_chance != null ? String(move.move_effect_chance) : '';
  return normalizeWhitespace(raw.replace(/\$effect_chance/g, chance));
}

export function parseMoveEffects(value: unknown): ReadonlyMap<string, string> {
  const moves = (value as MoveEffectsResponse).data?.move ?? [];
  const descriptions = new Map<string, string>();
  moves.forEach(move => {
    const description = moveDescription(move);
    if (description) {
      descriptions.set(move.name, description);
    }
  });
  return descriptions;
}
