import { computed, inject, Injectable, type Signal, signal } from '@angular/core';

import { PokemonApiService } from './pokemon-api.service';
import { type Pokemon } from './pokemon.model';

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

  readonly #pokemonById = computed(
    () => new Map<number, Pokemon>(this.#api.pokemons().map(pokemon => [pokemon.id, pokemon])),
  );

  readonly maxSelection = MAX_SELECTION;

  readonly pokemons: Signal<readonly Pokemon[]> = this.#api.pokemons;
  readonly isLoading: Signal<boolean> = this.#api.isLoading;
  readonly hasError = this.#api.hasError;

  readonly selected = computed<readonly Pokemon[]>(() =>
    this.#selectedIds()
      .map(id => this.#pokemonById().get(id))
      .filter((pokemon): pokemon is Pokemon => pokemon !== undefined),
  );

  readonly selectedIdSet = computed<ReadonlySet<number>>(() => new Set(this.#selectedIds()));

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
  }

  remove(id: number): void {
    this.#selectedIds.set(this.#selectedIds().filter(selectedId => selectedId !== id));
  }

  clear(): void {
    this.#selectedIds.set([]);
  }

  setDisplayMode(mode: DisplayMode): void {
    this.#displayMode.set(mode);
  }

  reload(): void {
    this.#api.reload();
  }
}
