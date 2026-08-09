import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { type VarietyPrice } from '@justin-croyable/api-contract';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { cropFallbackVarietyId, isVarietyId, VARIETY_BY_ID, type VarietyId } from './potager.model';

type ResolvedPrice = {
  readonly effectiveFrom: number;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number;
  readonly source: string;
};

export type CurrentPrice = {
  readonly price: ResolvedPrice;
  readonly viaFallback: boolean;
};

type PriceIndex = ReadonlyMap<VarietyId, readonly ResolvedPrice[]>;

@Injectable({ providedIn: 'root' })
export class PriceStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #prices = signal<readonly VarietyPrice[]>([]);
  readonly #loading = signal(false);
  readonly #loaded = signal(false);

  readonly prices = this.#prices.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly loaded = this.#loaded.asReadonly();

  readonly #index = computed<PriceIndex>(() => this.#buildIndex(this.#prices()));

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
      }
    });
  }

  async reload(): Promise<void> {
    this.#loading.set(true);
    try {
      const response = await this.#api.listVarietyPrices();
      if (response.status === 200) {
        this.#prices.set(response.body);
        this.#loaded.set(true);
      }
    } finally {
      this.#loading.set(false);
    }
  }

  conventionalPriceFor(varietyId: VarietyId, atDate: Date): number {
    return this.#resolve(varietyId, atDate)?.conventionalPricePerKg ?? 0;
  }

  bioPriceFor(varietyId: VarietyId, atDate: Date): number {
    const resolved = this.#resolve(varietyId, atDate);
    return resolved?.bioPricePerKg ?? resolved?.conventionalPricePerKg ?? 0;
  }

  latestFor(varietyId: VarietyId): ResolvedPrice | null {
    return this.#index().get(varietyId)?.at(0) ?? null;
  }

  currentFor(varietyId: VarietyId): CurrentPrice | null {
    const direct = this.#index().get(varietyId)?.at(0);
    if (direct) {
      return { price: direct, viaFallback: false };
    }
    const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
    const fallback = this.#index().get(fallbackId)?.at(0);
    return fallback ? { price: fallback, viaFallback: true } : null;
  }

  #resolve(varietyId: VarietyId, atDate: Date): ResolvedPrice | null {
    const timestamp = atDate.getTime();
    const direct = this.#pickAt(this.#index().get(varietyId), timestamp);
    if (direct) {
      return direct;
    }
    const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
    return this.#pickAt(this.#index().get(fallbackId), timestamp);
  }

  #pickAt(records: readonly ResolvedPrice[] | undefined, timestamp: number): ResolvedPrice | null {
    if (!records) {
      return null;
    }
    return records.find(record => record.effectiveFrom <= timestamp) ?? records.at(-1) ?? null;
  }

  #buildIndex(prices: readonly VarietyPrice[]): PriceIndex {
    const grouped = prices.reduce<Map<VarietyId, ResolvedPrice[]>>((accumulator, price) => {
      if (!isVarietyId(price.varietyId)) {
        return accumulator;
      }
      const existing = accumulator.get(price.varietyId) ?? [];
      existing.push({
        effectiveFrom: new Date(price.effectiveFrom).getTime(),
        conventionalPricePerKg: price.conventionalPricePerKg,
        bioPricePerKg: price.bioPricePerKg ?? price.conventionalPricePerKg,
        source: price.source,
      });
      accumulator.set(price.varietyId, existing);
      return accumulator;
    }, new Map());

    grouped.forEach(records => records.sort((a, b) => b.effectiveFrom - a.effectiveFrom));
    return grouped;
  }
}
