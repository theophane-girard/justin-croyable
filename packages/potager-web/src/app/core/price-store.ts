import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  type CreateVarietyPricePayload,
  type UpdateVarietyPricePayload,
  type VarietyPrice,
} from '@justin-croyable/api-contract';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { PRICE_ORIGIN, type PriceOrigin, type VarietyId } from './potager.model';
import { CatalogStore } from './catalog-store';

type ResolvedPrice = {
  readonly effectiveFrom: number;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number;
  readonly source: string;
};

export type CurrentPrice = {
  readonly price: ResolvedPrice;
  readonly kind: PriceOrigin;
  readonly parentVarietyId: VarietyId | null;
  readonly factor: number | null;
};

type PriceIndex = ReadonlyMap<VarietyId, readonly ResolvedPrice[]>;

type PriceSelector = (records: readonly ResolvedPrice[] | undefined) => ResolvedPrice | null;

function originForSource(source: string): PriceOrigin {
  if (source === PRICE_ORIGIN.rnm) {
    return PRICE_ORIGIN.rnm;
  }
  if (source === PRICE_ORIGIN.manuel) {
    return PRICE_ORIGIN.manuel;
  }
  return PRICE_ORIGIN.reference;
}

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

  currentFor(varietyId: VarietyId): CurrentPrice | null {
    return this.#chase(varietyId, records => records?.at(0) ?? null, new Set());
  }

  #resolve(varietyId: VarietyId, atDate: Date): ResolvedPrice | null {
    const timestamp = atDate.getTime();
    return this.#chase(varietyId, records => this.#pickAt(records, timestamp), new Set())?.price ?? null;
  }

  #chase(varietyId: VarietyId, pick: PriceSelector, seen: Set<VarietyId>): CurrentPrice | null {
    if (seen.has(varietyId)) {
      return null;
    }
    seen.add(varietyId);
    const variety = this.#catalog.byId().get(varietyId);
    const parentVarietyId = variety?.referenceVarietyId ?? null;
    const factor = variety?.pricingFactor ?? null;
    if (parentVarietyId) {
      const parent = this.#chase(parentVarietyId, pick, seen);
      if (!parent) {
        return null;
      }
      return {
        price: factor !== null ? this.#scale(parent.price, factor) : parent.price,
        kind: factor !== null ? PRICE_ORIGIN.estimation : PRICE_ORIGIN.fallback,
        parentVarietyId,
        factor,
      };
    }
    const direct = pick(this.#index().get(varietyId));
    if (direct) {
      return {
        price: direct,
        kind: originForSource(direct.source),
        parentVarietyId: null,
        factor: null,
      };
    }
    const cropFallbackId = this.#fallbackId(varietyId);
    const cropFallback = cropFallbackId ? pick(this.#index().get(cropFallbackId)) : null;
    return cropFallback
      ? { price: cropFallback, kind: PRICE_ORIGIN.fallback, parentVarietyId: cropFallbackId, factor: null }
      : null;
  }

  #scale(price: ResolvedPrice, factor: number): ResolvedPrice {
    return {
      ...price,
      conventionalPricePerKg: this.#round(price.conventionalPricePerKg * factor),
      bioPricePerKg: this.#round(price.bioPricePerKg * factor),
    };
  }

  #round(value: number): number {
    return Math.round(value * 1000) / 1000;
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
