import { type Stat, STAT_ORDER } from '../../core/pokemon.model';
import { clampLevel, DEFAULT_LEVEL, type EnhanceConfig, natureById } from '../../core/pokemon-stats';

const FIELD_SEPARATOR = '.';
const ID_SEPARATOR = ',';

export const SELECTION_PARAM = 'sel';
export const CONFIG_PARAM_PREFIX = 'e';

export function encodeSelection(ids: readonly number[]): string {
  return ids.join(ID_SEPARATOR);
}

export function decodeSelection(raw: string): number[] {
  return raw
    .split(ID_SEPARATOR)
    .map(Number)
    .filter(id => Number.isInteger(id) && id > 0);
}

export function encodeEnhanceConfig(config: EnhanceConfig): string {
  return [config.level, config.nature, ...STAT_ORDER.map(stat => config.evs[stat])].join(
    FIELD_SEPARATOR,
  );
}

export function decodeEnhanceConfig(raw: string): EnhanceConfig | null {
  const parts = raw.split(FIELD_SEPARATOR);
  const hasLevel = parts.length === STAT_ORDER.length + 2;
  if (!hasLevel && parts.length !== STAT_ORDER.length + 1) {
    return null;
  }
  const offset = hasLevel ? 1 : 0;
  const level = hasLevel ? clampLevel(Number(parts[0])) : DEFAULT_LEVEL;
  const nature = natureById(parts[offset]).id;
  const evs = STAT_ORDER.reduce((accumulator, stat, index) => {
    const value = Number(parts[offset + 1 + index]);
    accumulator[stat] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    return accumulator;
  }, {} as Record<Stat, number>);
  return { level100: true, level, nature, evs };
}
