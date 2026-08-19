import { normalizeText } from './pokemon-search';

export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

export interface MoveOption {
  readonly slug: string;
  readonly label: string;
  readonly searchText: string;
}

export const MOVES_QUERY = `
query PokemonComparatorMoves {
  move(order_by: { id: asc }) {
    name
    movenames(where: { language: { name: { _in: ["fr", "en", "de", "roomaji"] } } }) {
      name
      language {
        name
      }
    }
  }
}`;

interface RawMoveName {
  readonly name: string;
  readonly language: { readonly name: string };
}

interface RawMove {
  readonly name: string;
  readonly movenames: readonly RawMoveName[];
}

interface MovesResponse {
  readonly data?: { readonly move?: readonly RawMove[] };
}

function toMoveOption(raw: RawMove): MoveOption | undefined {
  const names = raw.movenames;
  if (names.length === 0) {
    return undefined;
  }
  const french = names.find(entry => entry.language.name === 'fr');
  const english = names.find(entry => entry.language.name === 'en');
  const label = french?.name ?? english?.name ?? raw.name;
  const searchText = [raw.name, ...names.map(entry => entry.name)].map(normalizeText).join(' ');
  return { slug: raw.name, label, searchText };
}

export function parseMoves(value: unknown): readonly MoveOption[] {
  const moves = (value as MovesResponse).data?.move;
  if (!moves) {
    return [];
  }
  return moves
    .map(toMoveOption)
    .filter((move): move is MoveOption => move !== undefined)
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export const MOVE_LEARNERS_QUERY = `
query PokemonComparatorMoveLearners($moves: [String!]!) {
  move(where: { name: { _in: $moves } }) {
    name
    pokemonmoves(distinct_on: pokemon_id, order_by: { pokemon_id: asc }) {
      pokemon_id
    }
  }
}`;

interface RawLearner {
  readonly pokemon_id: number;
}

interface RawMoveLearners {
  readonly name: string;
  readonly pokemonmoves: readonly RawLearner[];
}

interface MoveLearnersResponse {
  readonly data?: { readonly move?: readonly RawMoveLearners[] };
}

export function parseMoveLearners(value: unknown): ReadonlySet<number> {
  const moves = (value as MoveLearnersResponse).data?.move ?? [];
  if (moves.length === 0) {
    return new Set<number>();
  }
  const learnerSets = moves.map(move => new Set(move.pokemonmoves.map(entry => entry.pokemon_id)));
  return learnerSets.reduce((intersection, ids) => {
    const next = new Set<number>();
    intersection.forEach(id => {
      if (ids.has(id)) {
        next.add(id);
      }
    });
    return next;
  });
}
