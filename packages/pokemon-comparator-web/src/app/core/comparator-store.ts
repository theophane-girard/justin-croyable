import { computed, Injectable, signal } from '@angular/core';

import { POKEMONS } from './pokemon.data';
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
  readonly #pokemonById = new Map<number, Pokemon>(POKEMONS.map(pokemon => [pokemon.id, pokemon]));

  readonly #selectedIds = signal<readonly number[]>(DEFAULT_SELECTION);
  readonly #displayMode = signal<DisplayMode>(DISPLAY_MODE.bars);

  readonly maxSelection = MAX_SELECTION;

  readonly selected = computed<readonly Pokemon[]>(() =>
    this.#selectedIds()
      .map(id => this.#pokemonById.get(id))
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
}
