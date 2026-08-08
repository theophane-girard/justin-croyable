export const STAT = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  specialAttack: 'specialAttack',
  specialDefense: 'specialDefense',
  speed: 'speed',
} as const;

export type Stat = (typeof STAT)[keyof typeof STAT];

export const STAT_ORDER: readonly Stat[] = [
  STAT.hp,
  STAT.attack,
  STAT.defense,
  STAT.specialAttack,
  STAT.specialDefense,
  STAT.speed,
];

export const STAT_META: Readonly<Record<Stat, { readonly label: string; readonly short: string }>> = {
  [STAT.hp]: { label: 'PV', short: 'PV' },
  [STAT.attack]: { label: 'Attaque', short: 'Atq' },
  [STAT.defense]: { label: 'Défense', short: 'Déf' },
  [STAT.specialAttack]: { label: 'Attaque Spéciale', short: 'Atq. Spé' },
  [STAT.specialDefense]: { label: 'Défense Spéciale', short: 'Déf. Spé' },
  [STAT.speed]: { label: 'Vitesse', short: 'Vit' },
};

export const LANG = {
  fr: 'fr',
  en: 'en',
  de: 'de',
  ja: 'ja',
} as const;

export type Lang = (typeof LANG)[keyof typeof LANG];

export const LANG_LABEL: Readonly<Record<Lang, string>> = {
  [LANG.fr]: 'FR',
  [LANG.en]: 'EN',
  [LANG.de]: 'DE',
  [LANG.ja]: 'JA',
};

export interface PokemonName {
  readonly lang: Lang;
  readonly value: string;
}

export const EVOLUTION_STAGE = {
  base: 0,
  middle: 1,
  final: 2,
} as const;

export type EvolutionStage = (typeof EVOLUTION_STAGE)[keyof typeof EVOLUTION_STAGE];

export const EVOLUTION_STAGE_LABEL: Readonly<Record<EvolutionStage, string>> = {
  [EVOLUTION_STAGE.base]: 'Base',
  [EVOLUTION_STAGE.middle]: 'Évolution',
  [EVOLUTION_STAGE.final]: 'Évolution finale',
};

export interface Pokemon {
  readonly id: number;
  readonly names: readonly PokemonName[];
  readonly types: readonly string[];
  readonly stats: Readonly<Record<Stat, number>>;
  readonly stage: EvolutionStage;
  readonly legendary: boolean;
}

export const MAX_BASE_STAT = 255;

const POKEMON_ARTWORK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export function pokemonImageUrl(id: number): string {
  return `${POKEMON_ARTWORK_BASE}/${id}.png`;
}

export function pokemonName(pokemon: Pokemon, lang: Lang): string {
  const match = pokemon.names.find(name => name.lang === lang);
  return match?.value ?? pokemon.names[0]?.value ?? '';
}

export function pokemonTotal(pokemon: Pokemon): number {
  return STAT_ORDER.reduce((total, stat) => total + pokemon.stats[stat], 0);
}
