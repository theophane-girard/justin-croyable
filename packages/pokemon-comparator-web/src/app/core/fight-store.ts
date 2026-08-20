import { computed, Injectable, signal } from '@angular/core';

export const FIGHT_SLOT = { a: 'a', b: 'b' } as const;

export type FightSlot = (typeof FIGHT_SLOT)[keyof typeof FIGHT_SLOT];

type FightSlots = Readonly<Record<FightSlot, number | null>>;

const EMPTY_SLOTS: FightSlots = { [FIGHT_SLOT.a]: null, [FIGHT_SLOT.b]: null };

@Injectable({ providedIn: 'root' })
export class FightStore {
  readonly #slots = signal<FightSlots>(EMPTY_SLOTS);

  readonly slotA = computed(() => this.#slots()[FIGHT_SLOT.a]);
  readonly slotB = computed(() => this.#slots()[FIGHT_SLOT.b]);

  slotValue(slot: FightSlot): number | null {
    return this.#slots()[slot];
  }

  setSlot(slot: FightSlot, id: number | null): void {
    this.#slots.update(slots => ({ ...slots, [slot]: id }));
  }

  addPokemon(id: number): void {
    const slots = this.#slots();
    const target = slots[FIGHT_SLOT.a] === null ? FIGHT_SLOT.a : FIGHT_SLOT.b;
    this.setSlot(target, id);
  }
}
