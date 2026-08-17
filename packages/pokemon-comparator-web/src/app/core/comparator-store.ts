import { computed, inject, Injectable, type Signal, signal } from '@angular/core';

import { type Ability } from './pokemon-ability';
import { PokemonApiService } from './pokemon-api.service';
import { type Pokemon } from './pokemon.model';
import { DEFAULT_ENHANCE_CONFIG, type EnhanceConfig } from './pokemon-stats';

export const DISPLAY_MODE = {
  bars: 'bars',
  radar: 'radar',
} as const;

export type DisplayMode = (typeof DISPLAY_MODE)[keyof typeof DISPLAY_MODE];

const MAX_SELECTION = 6;
const DEFAULT_SELECTION: readonly number[] = [6, 9, 3];

@Injectable({ providedIn: 'root' })
export class ComparatorStore {
  readonly #api = inject(PokemonApiService);

  readonly #selectedIds = signal<readonly number[]>(DEFAULT_SELECTION);
  readonly #displayMode = signal<DisplayMode>(DISPLAY_MODE.bars);
  readonly #enhanceById = signal<ReadonlyMap<number, EnhanceConfig>>(new Map());
  readonly #enhanceAllConfig = signal<EnhanceConfig | null>(null);

  readonly #pokemonById = computed(
    () => new Map<number, Pokemon>(this.#api.pokemons().map(pokemon => [pokemon.id, pokemon])),
  );

  readonly maxSelection = MAX_SELECTION;

  readonly pokemons: Signal<readonly Pokemon[]> = this.#api.pokemons;
  readonly abilities: Signal<readonly Ability[]> = this.#api.abilities;
  readonly isLoading: Signal<boolean> = this.#api.isLoading;
  readonly hasError = this.#api.hasError;

  readonly selected = computed<readonly Pokemon[]>(() =>
    this.#selectedIds()
      .map(id => this.#pokemonById().get(id))
      .filter((pokemon): pokemon is Pokemon => pokemon !== undefined),
  );

  readonly selectedIdSet = computed<ReadonlySet<number>>(() => new Set(this.#selectedIds()));

  readonly selectedIds = this.#selectedIds.asReadonly();

  readonly displayMode = this.#displayMode.asReadonly();

  readonly isFull = computed(() => this.#selectedIds().length >= MAX_SELECTION);

  add(id: number): void {
    if (this.isFull()) {
      return;
    }
    const current = this.#selectedIds();
    if (current.includes(id)) {
      return;
    }
    this.#selectedIds.set([...current, id]);

    const sharedConfig = this.#enhanceAllConfig();
    if (sharedConfig) {
      this.setEnhanceConfigs(new Map([[id, sharedConfig]]));
    }
  }

  remove(id: number): void {
    this.#selectedIds.set(this.#selectedIds().filter(selectedId => selectedId !== id));
  }

  clear(): void {
    this.#selectedIds.set([]);
  }

  setSelection(ids: readonly number[]): void {
    this.#selectedIds.set(ids.slice(0, MAX_SELECTION));
  }

  setDisplayMode(mode: DisplayMode): void {
    this.#displayMode.set(mode);
  }

  enhanceFor(id: number): EnhanceConfig {
    return this.#enhanceById().get(id) ?? DEFAULT_ENHANCE_CONFIG;
  }

  setEnhanceConfigs(configs: ReadonlyMap<number, EnhanceConfig>): void {
    const next = new Map(this.#enhanceById());
    configs.forEach((config, id) => next.set(id, config));
    this.#enhanceById.set(next);
  }

  resetEnhanceConfigs(ids: readonly number[]): void {
    const next = new Map(this.#enhanceById());
    ids.forEach(id => next.delete(id));
    this.#enhanceById.set(next);
  }

  setEnhanceAllConfig(config: EnhanceConfig | null): void {
    this.#enhanceAllConfig.set(config);
  }

  reload(): void {
    this.#api.reload();
  }
}
