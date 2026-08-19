const TYPE_TILE = new Map<string, string>([
  ['normal', 'bg-stone-400 text-white'],
  ['fire', 'bg-orange-500 text-white'],
  ['water', 'bg-sky-500 text-white'],
  ['electric', 'bg-amber-400 text-stone-900'],
  ['grass', 'bg-emerald-500 text-white'],
  ['ice', 'bg-cyan-400 text-stone-900'],
  ['fighting', 'bg-red-600 text-white'],
  ['poison', 'bg-fuchsia-600 text-white'],
  ['ground', 'bg-amber-600 text-white'],
  ['flying', 'bg-indigo-400 text-white'],
  ['psychic', 'bg-pink-500 text-white'],
  ['bug', 'bg-lime-500 text-stone-900'],
  ['rock', 'bg-yellow-700 text-white'],
  ['ghost', 'bg-violet-700 text-white'],
  ['dragon', 'bg-violet-600 text-white'],
  ['dark', 'bg-stone-700 text-white'],
  ['steel', 'bg-slate-500 text-white'],
  ['fairy', 'bg-pink-400 text-stone-900'],
]);

const TYPE_LABEL = new Map<string, string>([
  ['normal', 'Normal'],
  ['fire', 'Feu'],
  ['water', 'Eau'],
  ['electric', 'Électrik'],
  ['grass', 'Plante'],
  ['ice', 'Glace'],
  ['fighting', 'Combat'],
  ['poison', 'Poison'],
  ['ground', 'Sol'],
  ['flying', 'Vol'],
  ['psychic', 'Psy'],
  ['bug', 'Insecte'],
  ['rock', 'Roche'],
  ['ghost', 'Spectre'],
  ['dragon', 'Dragon'],
  ['dark', 'Ténèbres'],
  ['steel', 'Acier'],
  ['fairy', 'Fée'],
]);

const TYPE_BAR = new Map<string, string>([
  ['normal', '[&_[data-slot=progress-indicator]]:bg-stone-400'],
  ['fire', '[&_[data-slot=progress-indicator]]:bg-orange-500'],
  ['water', '[&_[data-slot=progress-indicator]]:bg-sky-500'],
  ['electric', '[&_[data-slot=progress-indicator]]:bg-amber-400'],
  ['grass', '[&_[data-slot=progress-indicator]]:bg-emerald-500'],
  ['ice', '[&_[data-slot=progress-indicator]]:bg-cyan-400'],
  ['fighting', '[&_[data-slot=progress-indicator]]:bg-red-600'],
  ['poison', '[&_[data-slot=progress-indicator]]:bg-fuchsia-600'],
  ['ground', '[&_[data-slot=progress-indicator]]:bg-amber-600'],
  ['flying', '[&_[data-slot=progress-indicator]]:bg-indigo-400'],
  ['psychic', '[&_[data-slot=progress-indicator]]:bg-pink-500'],
  ['bug', '[&_[data-slot=progress-indicator]]:bg-lime-500'],
  ['rock', '[&_[data-slot=progress-indicator]]:bg-yellow-700'],
  ['ghost', '[&_[data-slot=progress-indicator]]:bg-violet-700'],
  ['dragon', '[&_[data-slot=progress-indicator]]:bg-violet-600'],
  [
    'dark',
    '[&_[data-slot=progress-indicator]]:bg-stone-700 dark:[&_[data-slot=progress-indicator]]:bg-stone-400',
  ],
  ['steel', '[&_[data-slot=progress-indicator]]:bg-slate-500'],
  ['fairy', '[&_[data-slot=progress-indicator]]:bg-pink-400'],
]);

export const TYPE_SLUGS: readonly string[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

const TYPE_TILE_DEFAULT = 'bg-muted text-foreground';

export function typeLabel(type: string): string {
  return TYPE_LABEL.get(type) ?? type;
}

export function typeTileClass(type: string | undefined): string {
  return (type && TYPE_TILE.get(type)) || TYPE_TILE_DEFAULT;
}

export function typeBarClass(type: string | undefined): string {
  return (type && TYPE_BAR.get(type)) || '';
}

export function typeLabels(types: readonly string[]): string[] {
  return types.map(typeLabel);
}

interface TypeRelations {
  readonly double: readonly string[];
  readonly half: readonly string[];
  readonly zero: readonly string[];
}

const TYPE_EFFECTIVENESS: Readonly<Record<string, TypeRelations>> = {
  normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'], zero: [] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'], zero: [] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: {
    double: ['water', 'ground', 'rock'],
    half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    zero: [],
  },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'], zero: [] },
  fighting: {
    double: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    zero: ['ghost'],
  },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: {
    double: ['fire', 'electric', 'poison', 'rock', 'steel'],
    half: ['grass', 'bug'],
    zero: ['flying'],
  },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'], zero: [] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: {
    double: ['grass', 'psychic', 'dark'],
    half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    zero: [],
  },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'], zero: [] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'], zero: [] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'], zero: [] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'], zero: [] },
};

export interface TypeMatchup {
  readonly type: string;
  readonly label: string;
  readonly tileClass: string;
  readonly multiplier: number;
}

function multiplierAgainst(attacking: string, defenderTypes: readonly string[]): number {
  const relations = TYPE_EFFECTIVENESS[attacking];
  if (!relations) {
    return 1;
  }
  return defenderTypes.reduce((multiplier, defender) => {
    if (relations.zero.includes(defender)) {
      return 0;
    }
    if (relations.double.includes(defender)) {
      return multiplier * 2;
    }
    if (relations.half.includes(defender)) {
      return multiplier * 0.5;
    }
    return multiplier;
  }, 1);
}

function toMatchup(type: string, multiplier: number): TypeMatchup {
  return { type, label: typeLabel(type), tileClass: typeTileClass(type), multiplier };
}

export function defensiveMatchups(defenderTypes: readonly string[]): readonly TypeMatchup[] {
  return TYPE_SLUGS.map(type => toMatchup(type, multiplierAgainst(type, defenderTypes)));
}

export function offensiveMatchups(attackingType: string): readonly TypeMatchup[] {
  return TYPE_SLUGS.map(type => toMatchup(type, multiplierAgainst(attackingType, [type])));
}

export function typeMultiplier(attackingType: string, defenderTypes: readonly string[]): number {
  return multiplierAgainst(attackingType, defenderTypes);
}

export function typeWeaknesses(defenderTypes: readonly string[]): readonly TypeMatchup[] {
  return defensiveMatchups(defenderTypes)
    .filter(matchup => matchup.multiplier > 1)
    .sort(
      (a, b) => b.multiplier - a.multiplier || TYPE_SLUGS.indexOf(a.type) - TYPE_SLUGS.indexOf(b.type),
    );
}
