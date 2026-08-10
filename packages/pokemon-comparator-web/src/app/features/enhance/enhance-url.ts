import { computed, type Signal } from '@angular/core';

import {
  booleanFilter,
  enumFilter,
  injectQueryFilters,
  numberFilter,
} from '@justin-croyable/design-system';

import { STAT } from '../../core/pokemon.model';
import { type EnhanceConfig, NATURE_IDS, NEUTRAL_NATURE_ID } from '../../core/pokemon-stats';

export interface EnhanceUrl {
  readonly config: Signal<EnhanceConfig>;
  patch(config: EnhanceConfig): void;
}

export function injectEnhanceUrl(): EnhanceUrl {
  const url = injectQueryFilters({
    sim: booleanFilter(false),
    nature: enumFilter(NATURE_IDS, NEUTRAL_NATURE_ID),
    evHp: numberFilter(0),
    evAtk: numberFilter(0),
    evDef: numberFilter(0),
    evSpa: numberFilter(0),
    evSpd: numberFilter(0),
    evSpe: numberFilter(0),
  });

  const config = computed<EnhanceConfig>(() => ({
    level100: url.sim(),
    nature: url.nature(),
    evs: {
      [STAT.hp]: url.evHp(),
      [STAT.attack]: url.evAtk(),
      [STAT.defense]: url.evDef(),
      [STAT.specialAttack]: url.evSpa(),
      [STAT.specialDefense]: url.evSpd(),
      [STAT.speed]: url.evSpe(),
    },
  }));

  const patch = (value: EnhanceConfig): void =>
    url.patch({
      sim: value.level100,
      nature: value.nature,
      evHp: value.evs[STAT.hp],
      evAtk: value.evs[STAT.attack],
      evDef: value.evs[STAT.defense],
      evSpa: value.evs[STAT.specialAttack],
      evSpd: value.evs[STAT.specialDefense],
      evSpe: value.evs[STAT.speed],
    });

  return { config, patch };
}
