import { type Stat, STAT } from './pokemon.model';
import { applyEnhancedStats, type EnhanceConfig } from './pokemon-stats';
import { typeMultiplier } from './pokemon-type';

const SIMULATED_LEVEL = 100;
const STAB_MULTIPLIER = 1.5;
const MIN_RANDOM_FACTOR = 0.85;
const CRITICAL_MULTIPLIER = 1.5;
const BURN_MULTIPLIER = 0.5;
const WEATHER_BOOST = 1.5;
const WEATHER_REDUCTION = 0.5;

const WATER_TYPE = 'water';
const FIRE_TYPE = 'fire';
const PHYSICAL_CLASS = 'physical';

export const WEATHER = { none: 'none', rain: 'rain', sun: 'sun' } as const;
export type Weather = (typeof WEATHER)[keyof typeof WEATHER];

export const WEATHER_OPTIONS: readonly { readonly value: Weather; readonly label: string }[] = [
  { value: WEATHER.none, label: 'Aucune' },
  { value: WEATHER.rain, label: 'Pluie' },
  { value: WEATHER.sun, label: 'Soleil' },
];

function isWeather(value: string): value is Weather {
  return value === WEATHER.none || value === WEATHER.rain || value === WEATHER.sun;
}

export function toWeather(value: string): Weather {
  return isWeather(value) ? value : WEATHER.none;
}

function weatherMultiplier(weather: Weather, moveType: string): number {
  if (weather === WEATHER.rain) {
    if (moveType === WATER_TYPE) {
      return WEATHER_BOOST;
    }
    if (moveType === FIRE_TYPE) {
      return WEATHER_REDUCTION;
    }
  }
  if (weather === WEATHER.sun) {
    if (moveType === FIRE_TYPE) {
      return WEATHER_BOOST;
    }
    if (moveType === WATER_TYPE) {
      return WEATHER_REDUCTION;
    }
  }
  return 1;
}

export const STAT_STAGES: readonly number[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

export const DAMAGE_STAGE_STATS: readonly Stat[] = [
  STAT.attack,
  STAT.defense,
  STAT.specialAttack,
  STAT.specialDefense,
];

export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

export function stageLabel(stage: number): string {
  return `×${Number(stageMultiplier(stage).toFixed(2))}`;
}

export interface Combatant {
  readonly types: readonly string[];
  readonly baseStats: Readonly<Record<Stat, number>>;
  readonly config: EnhanceConfig;
  readonly stages: Readonly<Record<Stat, number>>;
  readonly critical: boolean;
  readonly burned: boolean;
  readonly weather: Weather;
}

export interface DamageMove {
  readonly power: number | null;
  readonly type: string;
  readonly damageClass: string;
}

export interface DamageResult {
  readonly minDamage: number;
  readonly maxDamage: number;
  readonly minPercent: number;
  readonly maxPercent: number;
  readonly effectiveness: number;
  readonly stab: boolean;
  readonly critical: boolean;
  readonly weatherBoosted: boolean;
  readonly weatherReduced: boolean;
  readonly burnReduced: boolean;
}

function level100Stats(combatant: Combatant): Readonly<Record<Stat, number>> {
  return applyEnhancedStats(combatant.baseStats, { ...combatant.config, level100: true });
}

function effectiveStat(
  combatant: Combatant,
  stat: Stat,
  ignoreNegativeStage: boolean,
  ignorePositiveStage: boolean,
): number {
  const value = level100Stats(combatant)[stat];
  const rawStage = combatant.stages[stat] ?? 0;
  const ignored =
    (ignoreNegativeStage && rawStage < 0) || (ignorePositiveStage && rawStage > 0);
  const stage = ignored ? 0 : rawStage;
  return Math.max(1, Math.floor(value * stageMultiplier(stage)));
}

export function computeDamage(
  attacker: Combatant,
  defender: Combatant,
  move: DamageMove,
): DamageResult | null {
  if (move.power == null || move.power <= 0 || move.damageClass === 'status') {
    return null;
  }
  const physical = move.damageClass === PHYSICAL_CLASS;
  const critical = attacker.critical;
  const attack = effectiveStat(
    attacker,
    physical ? STAT.attack : STAT.specialAttack,
    critical,
    false,
  );
  const defense = effectiveStat(
    defender,
    physical ? STAT.defense : STAT.specialDefense,
    false,
    critical,
  );
  const effectiveness = typeMultiplier(move.type, defender.types);
  const stab = attacker.types.includes(move.type);
  const weather = weatherMultiplier(attacker.weather, move.type);
  const burnReduced = attacker.burned && physical;

  const modifier =
    (stab ? STAB_MULTIPLIER : 1) *
    effectiveness *
    weather *
    (critical ? CRITICAL_MULTIPLIER : 1) *
    (burnReduced ? BURN_MULTIPLIER : 1);

  const base =
    Math.floor((((2 * SIMULATED_LEVEL) / 5 + 2) * move.power * (attack / defense)) / 50) + 2;
  const maxDamage = Math.floor(base * modifier);
  const minDamage = Math.floor(base * modifier * MIN_RANDOM_FACTOR);

  const hp = level100Stats(defender)[STAT.hp];
  const toPercent = (damage: number): number => (hp > 0 ? Math.round((damage / hp) * 100) : 0);

  return {
    minDamage,
    maxDamage,
    minPercent: toPercent(minDamage),
    maxPercent: toPercent(maxDamage),
    effectiveness,
    stab,
    critical,
    weatherBoosted: weather > 1,
    weatherReduced: weather < 1,
    burnReduced,
  };
}
