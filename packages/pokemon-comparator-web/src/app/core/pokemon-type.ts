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
  ['dark', '[&_[data-slot=progress-indicator]]:bg-stone-700'],
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
