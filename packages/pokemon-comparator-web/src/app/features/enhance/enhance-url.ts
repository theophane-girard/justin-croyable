import { type Stat, STAT_ORDER } from '../../core/pokemon.model';
import { type EnhanceConfig, natureById } from '../../core/pokemon-stats';

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
  return [config.nature, ...STAT_ORDER.map(stat => config.evs[stat])].join(FIELD_SEPARATOR);
}

export function decodeEnhanceConfig(raw: string): EnhanceConfig | null {
  const parts = raw.split(FIELD_SEPARATOR);
  if (parts.length !== STAT_ORDER.length + 1) {
    return null;
  }
  const nature = natureById(parts[0]).id;
  const evs = STAT_ORDER.reduce((accumulator, stat, index) => {
    const value = Number(parts[index + 1]);
    accumulator[stat] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    return accumulator;
  }, {} as Record<Stat, number>);
  return { level100: true, nature, evs };
}
