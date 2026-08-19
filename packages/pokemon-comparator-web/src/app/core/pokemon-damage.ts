import { type Stat, STAT } from './pokemon.model';
import { applyEnhancedStats, type EnhanceConfig } from './pokemon-stats';
import { typeMultiplier } from './pokemon-type';

const SIMULATED_LEVEL = 100;
const STAB_MULTIPLIER = 1.5;
const MIN_RANDOM_FACTOR = 0.85;

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
}

function level100Stats(combatant: Combatant): Readonly<Record<Stat, number>> {
  return applyEnhancedStats(combatant.baseStats, { ...combatant.config, level100: true });
}

function effectiveStat(combatant: Combatant, stat: Stat): number {
  const value = level100Stats(combatant)[stat];
  return Math.max(1, Math.floor(value * stageMultiplier(combatant.stages[stat] ?? 0)));
}

export function computeDamage(
  attacker: Combatant,
  defender: Combatant,
  move: DamageMove,
): DamageResult | null {
  if (move.power == null || move.power <= 0 || move.damageClass === 'status') {
    return null;
  }
  const physical = move.damageClass === 'physical';
  const attack = effectiveStat(attacker, physical ? STAT.attack : STAT.specialAttack);
  const defense = effectiveStat(defender, physical ? STAT.defense : STAT.specialDefense);
  const effectiveness = typeMultiplier(move.type, defender.types);
  const stab = attacker.types.includes(move.type);
  const modifier = (stab ? STAB_MULTIPLIER : 1) * effectiveness;

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
  };
}
