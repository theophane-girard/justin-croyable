import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { type Variety as ApiVariety } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CROP_BY_ID, type CropId, isCropId, type Variety, type VarietyId } from './potager.model';

export type CatalogOption = { readonly id: VarietyId; readonly label: string };

function toOptions(varieties: readonly Variety[]): readonly CatalogOption[] {
  return varieties
    .map(variety => ({
      id: variety.id,
      label: `${CROP_BY_ID[variety.cropId].label} · ${variety.label}`,
    }))
    .sort((first, second) => first.label.localeCompare(second.label, 'fr'));
}

function toVariety(row: ApiVariety): Variety {
  return {
    id: row.id,
    cropId: row.cropId as CropId,
    label: row.label,
    slug: row.slug,
    gardenId: row.gardenId,
    referenceVarietyId: row.referenceVarietyId,
    pricingFactor: row.pricingFactor,
    isCustom: row.gardenId !== null,
    pricingVarietyId: row.referenceVarietyId ?? row.id,
  };
}

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #varieties = signal<readonly Variety[]>([]);
  readonly #loaded = signal(false);

  readonly varieties = this.#varieties.asReadonly();
  readonly loaded = this.#loaded.asReadonly();

  readonly byId = computed<ReadonlyMap<VarietyId, Variety>>(
    () => new Map(this.#varieties().map(variety => [variety.id, variety])),
  );

  readonly byCrop = computed<ReadonlyMap<CropId, readonly Variety[]>>(() => {
    const grouped = this.#varieties().reduce<Map<CropId, Variety[]>>((accumulator, variety) => {
      const list = accumulator.get(variety.cropId) ?? [];
      list.push(variety);
      accumulator.set(variety.cropId, list);
      return accumulator;
    }, new Map());
    grouped.forEach(list =>
      list.sort((first, second) => first.label.localeCompare(second.label, 'fr')),
    );
    return grouped;
  });

  readonly references = computed<readonly Variety[]>(() =>
    this.#varieties().filter(variety => !variety.isCustom),
  );

  readonly varietyOptions = computed<readonly CatalogOption[]>(() =>
    toOptions(this.#varieties()),
  );

  readonly referenceOptions = computed<readonly CatalogOption[]>(() =>
    toOptions(this.references()),
  );

  readonly #referenceIdBySlug = computed<ReadonlyMap<string, VarietyId>>(
    () =>
      new Map(
        this.references()
          .filter(variety => variety.slug !== null)
          .map(variety => [variety.slug as string, variety.id]),
      ),
  );

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#varieties.set([]);
      this.#loaded.set(false);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.listVarieties();
    if (response.status === 200) {
      this.#varieties.set(response.body.map(toVariety));
      this.#loaded.set(true);
    }
  }

  async createCustom(label: string, referenceVarietyId: VarietyId): Promise<Variety | null> {
    const response = await this.#api.createVariety({ label, referenceVarietyId });
    if (response.status !== 201) {
      return null;
    }
    await this.reload();
    return this.byId().get(response.body.id) ?? null;
  }

  async removeCustom(id: VarietyId): Promise<boolean> {
    const response = await this.#api.removeVariety(id);
    if (response.status !== 200) {
      return false;
    }
    await this.reload();
    return true;
  }

  async updatePricingRule(
    id: VarietyId,
    referenceVarietyId: VarietyId | null,
    pricingFactor: number | null,
  ): Promise<boolean> {
    const response = await this.#api.updateVarietyPricing(id, { referenceVarietyId, pricingFactor });
    if (response.status !== 200) {
      return false;
    }
    await this.reload();
    return true;
  }

  varietiesForCrop(cropId: string): readonly Variety[] {
    return isCropId(cropId) ? this.byCrop().get(cropId) ?? [] : [];
  }

  isKnown(id: string): boolean {
    return this.byId().has(id);
  }

  labelFor(id: VarietyId): string | null {
    return this.byId().get(id)?.label ?? null;
  }

  pricingVarietyIdFor(id: VarietyId): VarietyId | null {
    return this.byId().get(id)?.pricingVarietyId ?? null;
  }

  cropFallbackVarietyId(cropId: CropId): VarietyId | null {
    const slug = CROP_BY_ID[cropId].fallbackVarietyId;
    const bySlug = slug !== undefined ? this.#referenceIdBySlug().get(slug) : undefined;
    if (bySlug !== undefined) {
      return bySlug;
    }
    const references = this.references().filter(variety => variety.cropId === cropId);
    return references[0]?.id ?? null;
  }
}
