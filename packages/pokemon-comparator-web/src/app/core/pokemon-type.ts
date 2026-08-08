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

const TYPE_TILE_DEFAULT = 'bg-muted text-foreground';

export function typeLabel(type: string): string {
  return TYPE_LABEL.get(type) ?? type;
}

export function typeTileClass(type: string | undefined): string {
  return (type && TYPE_TILE.get(type)) || TYPE_TILE_DEFAULT;
}

export function typeLabels(types: readonly string[]): string[] {
  return types.map(typeLabel);
}
