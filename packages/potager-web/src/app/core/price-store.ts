import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  type CreateVarietyPricePayload,
  type UpdateVarietyPricePayload,
  type VarietyPrice,
} from '@justin-croyable/api-contract';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { type VarietyId } from './potager.model';
import { CatalogStore } from './catalog-store';

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
  readonly #catalog = inject(CatalogStore);

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

  async createPrice(payload: CreateVarietyPricePayload): Promise<boolean> {
    const response = await this.#api.createVarietyPrice(payload);
    if (response.status === 201) {
      await this.reload();
      return true;
    }
    return false;
  }

  async updatePrice(id: string, payload: UpdateVarietyPricePayload): Promise<boolean> {
    const response = await this.#api.updateVarietyPrice(id, payload);
    if (response.status === 200) {
      await this.reload();
      return true;
    }
    return false;
  }

  async removePrice(id: string): Promise<boolean> {
    const response = await this.#api.removeVarietyPrice(id);
    if (response.status === 200) {
      await this.reload();
      return true;
    }
    return false;
  }

  async refreshFromRnm(): Promise<boolean> {
    const response = await this.#api.refreshVarietyPricesFromRnm();
    if (response.ok) {
      await this.reload();
      return true;
    }
    return false;
  }

  conventionalPriceFor(varietyId: VarietyId, atDate: Date): number {
    return this.#resolve(varietyId, atDate)?.conventionalPricePerKg ?? 0;
  }

  bioPriceFor(varietyId: VarietyId, atDate: Date): number {
    const resolved = this.#resolve(varietyId, atDate);
    return resolved?.bioPricePerKg ?? resolved?.conventionalPricePerKg ?? 0;
  }

  latestFor(varietyId: VarietyId): ResolvedPrice | null {
    const pricingId = this.#catalog.pricingVarietyIdFor(varietyId) ?? varietyId;
    return this.#index().get(pricingId)?.at(0) ?? null;
  }

  currentFor(varietyId: VarietyId): CurrentPrice | null {
    const pricingId = this.#catalog.pricingVarietyIdFor(varietyId) ?? varietyId;
    const direct = this.#index().get(pricingId)?.at(0);
    if (direct) {
      return { price: direct, viaFallback: false };
    }
    const fallbackId = this.#fallbackId(varietyId);
    const fallback = fallbackId ? this.#index().get(fallbackId)?.at(0) : undefined;
    return fallback ? { price: fallback, viaFallback: true } : null;
  }

  #resolve(varietyId: VarietyId, atDate: Date): ResolvedPrice | null {
    const timestamp = atDate.getTime();
    const pricingId = this.#catalog.pricingVarietyIdFor(varietyId) ?? varietyId;
    const direct = this.#pickAt(this.#index().get(pricingId), timestamp);
    if (direct) {
      return direct;
    }
    const fallbackId = this.#fallbackId(varietyId);
    return fallbackId ? this.#pickAt(this.#index().get(fallbackId), timestamp) : null;
  }

  #fallbackId(varietyId: VarietyId): VarietyId | null {
    const cropId = this.#catalog.byId().get(varietyId)?.cropId;
    return cropId ? this.#catalog.cropFallbackVarietyId(cropId) : null;
  }

  #pickAt(records: readonly ResolvedPrice[] | undefined, timestamp: number): ResolvedPrice | null {
    if (!records) {
      return null;
    }
    return records.find(record => record.effectiveFrom <= timestamp) ?? records.at(-1) ?? null;
  }

  #buildIndex(prices: readonly VarietyPrice[]): PriceIndex {
    const grouped = prices.reduce<Map<VarietyId, ResolvedPrice[]>>((accumulator, price) => {
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
