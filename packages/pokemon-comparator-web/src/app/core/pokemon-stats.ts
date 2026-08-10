import { MAX_BASE_STAT, type Stat, STAT, STAT_META, STAT_ORDER } from './pokemon.model';

export interface Nature {
  readonly id: string;
  readonly label: string;
  readonly increased: Stat | null;
  readonly decreased: Stat | null;
}

export const NEUTRAL_NATURE_ID = 'hardy';

export const NATURES: readonly Nature[] = [
  { id: NEUTRAL_NATURE_ID, label: 'Hardi', increased: null, decreased: null },
  { id: 'lonely', label: 'Solo', increased: STAT.attack, decreased: STAT.defense },
  { id: 'brave', label: 'Brave', increased: STAT.attack, decreased: STAT.speed },
  { id: 'adamant', label: 'Rigide', increased: STAT.attack, decreased: STAT.specialAttack },
  { id: 'naughty', label: 'Mauvais', increased: STAT.attack, decreased: STAT.specialDefense },
  { id: 'bold', label: 'Assuré', increased: STAT.defense, decreased: STAT.attack },
  { id: 'docile', label: 'Docile', increased: null, decreased: null },
  { id: 'relaxed', label: 'Relax', increased: STAT.defense, decreased: STAT.speed },
  { id: 'impish', label: 'Malin', increased: STAT.defense, decreased: STAT.specialAttack },
  { id: 'lax', label: 'Lâche', increased: STAT.defense, decreased: STAT.specialDefense },
  { id: 'timid', label: 'Timide', increased: STAT.speed, decreased: STAT.attack },
  { id: 'hasty', label: 'Pressé', increased: STAT.speed, decreased: STAT.defense },
  { id: 'serious', label: 'Sérieux', increased: null, decreased: null },
  { id: 'jolly', label: 'Jovial', increased: STAT.speed, decreased: STAT.specialAttack },
  { id: 'naive', label: 'Naïf', increased: STAT.speed, decreased: STAT.specialDefense },
  { id: 'modest', label: 'Modeste', increased: STAT.specialAttack, decreased: STAT.attack },
  { id: 'mild', label: 'Doux', increased: STAT.specialAttack, decreased: STAT.defense },
  { id: 'quiet', label: 'Discret', increased: STAT.specialAttack, decreased: STAT.speed },
  { id: 'bashful', label: 'Pudique', increased: null, decreased: null },
  { id: 'rash', label: 'Foufou', increased: STAT.specialAttack, decreased: STAT.specialDefense },
  { id: 'calm', label: 'Calme', increased: STAT.specialDefense, decreased: STAT.attack },
  { id: 'gentle', label: 'Gentil', increased: STAT.specialDefense, decreased: STAT.defense },
  { id: 'sassy', label: 'Malpoli', increased: STAT.specialDefense, decreased: STAT.speed },
  { id: 'careful', label: 'Prudent', increased: STAT.specialDefense, decreased: STAT.specialAttack },
  { id: 'quirky', label: 'Bizarre', increased: null, decreased: null },
];

export const NATURE_IDS: readonly string[] = NATURES.map(nature => nature.id);

const NATURE_BY_ID = new Map<string, Nature>(NATURES.map(nature => [nature.id, nature]));

export function natureById(id: string): Nature {
  return NATURE_BY_ID.get(id) ?? NATURES[0];
}

const NEUTRAL_NATURE_EFFECT_LABEL = 'Neutre';

export function natureEffectLabel(nature: Nature): string {
  if (!nature.increased || !nature.decreased) {
    return NEUTRAL_NATURE_EFFECT_LABEL;
  }
  return `+${STAT_META[nature.increased].short} / −${STAT_META[nature.decreased].short}`;
}

export interface EnhanceConfig {
  readonly level100: boolean;
  readonly nature: string;
  readonly evs: Readonly<Record<Stat, number>>;
}

export const MAX_EV_PER_STAT = 252;
export const MAX_EV_TOTAL = 510;
export const EV_STEP = 4;
export const USABLE_EV_TOTAL = Math.floor(MAX_EV_TOTAL / EV_STEP) * EV_STEP;

const ZERO_EVS: Readonly<Record<Stat, number>> = STAT_ORDER.reduce(
  (evs, stat) => ({ ...evs, [stat]: 0 }),
  {} as Record<Stat, number>,
);

export const DEFAULT_ENHANCE_CONFIG: EnhanceConfig = {
  level100: false,
  nature: NEUTRAL_NATURE_ID,
  evs: ZERO_EVS,
};

const SIMULATED_LEVEL = 100;
const PERFECT_IV = 31;
const INCREASED_NATURE_MULTIPLIER = 1.1;
const DECREASED_NATURE_MULTIPLIER = 0.9;
const NEUTRAL_NATURE_MULTIPLIER = 1;

export const MAX_STAT_AT_LEVEL_100 =
  Math.floor(((2 * MAX_BASE_STAT + PERFECT_IV + MAX_EV_PER_STAT / 4) * SIMULATED_LEVEL) / 100) +
  SIMULATED_LEVEL +
  10;

function natureMultiplier(nature: Nature, stat: Stat): number {
  if (nature.increased === stat) {
    return INCREASED_NATURE_MULTIPLIER;
  }
  if (nature.decreased === stat) {
    return DECREASED_NATURE_MULTIPLIER;
  }
  return NEUTRAL_NATURE_MULTIPLIER;
}

function commonStatBase(base: number, ev: number): number {
  return Math.floor(((2 * base + PERFECT_IV + Math.floor(ev / 4)) * SIMULATED_LEVEL) / 100);
}

function computeStatAtLevel100(stat: Stat, base: number, ev: number, nature: Nature): number {
  if (stat === STAT.hp) {
    return commonStatBase(base, ev) + SIMULATED_LEVEL + 10;
  }
  return Math.floor((commonStatBase(base, ev) + 5) * natureMultiplier(nature, stat));
}

export function applyEnhancedStats(
  base: Readonly<Record<Stat, number>>,
  config: EnhanceConfig,
): Readonly<Record<Stat, number>> {
  if (!config.level100) {
    return base;
  }
  const nature = natureById(config.nature);
  const entries = STAT_ORDER.map(
    stat => [stat, computeStatAtLevel100(stat, base[stat], config.evs[stat], nature)] as const,
  );
  return Object.fromEntries(entries) as Record<Stat, number>;
}

export function enhancedStatScaleMax(config: EnhanceConfig): number {
  return config.level100 ? MAX_STAT_AT_LEVEL_100 : MAX_BASE_STAT;
}

export function statsTotal(stats: Readonly<Record<Stat, number>>): number {
  return STAT_ORDER.reduce((total, stat) => total + stats[stat], 0);
}

export function evsTotal(evs: Readonly<Record<Stat, number>>): number {
  return STAT_ORDER.reduce((total, stat) => total + evs[stat], 0);
}

export function maxEvForStat(currentStatEv: number, totalEvs: number): number {
  const remaining = MAX_EV_TOTAL - (totalEvs - currentStatEv);
  return Math.floor(Math.min(MAX_EV_PER_STAT, remaining) / EV_STEP) * EV_STEP;
}
