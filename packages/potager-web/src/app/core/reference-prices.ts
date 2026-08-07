import {
  cropFallbackVarietyId,
  PRICE_ORIGIN,
  type PriceOrigin,
  type PricePerKgByVariety,
  VARIETIES,
  VARIETY_BY_ID,
  type VarietyId,
} from './potager.model';

export const REFERENCE_VARIETY_PRICES: Readonly<Record<VarietyId, number>> = VARIETIES.reduce(
  (accumulator, variety) => ({ ...accumulator, [variety.id]: variety.referencePricePerKg }),
  {} as Record<VarietyId, number>,
);

export const REFERENCE_VARIETY_BIO_PRICES: Readonly<Record<VarietyId, number>> = VARIETIES.reduce(
  (accumulator, variety) => ({ ...accumulator, [variety.id]: variety.referenceBioPricePerKg }),
  {} as Record<VarietyId, number>,
);

export function resolveConventionalPrice(
  varietyId: VarietyId,
  live: PricePerKgByVariety | null,
): number {
  const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
  return (
    live?.[varietyId] ??
    live?.[fallbackId] ??
    REFERENCE_VARIETY_PRICES[varietyId] ??
    REFERENCE_VARIETY_PRICES[fallbackId]
  );
}

export function resolveBioPrice(varietyId: VarietyId, live: PricePerKgByVariety | null): number {
  const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
  return (
    live?.[varietyId] ??
    live?.[fallbackId] ??
    REFERENCE_VARIETY_BIO_PRICES[varietyId] ??
    REFERENCE_VARIETY_BIO_PRICES[fallbackId]
  );
}

export function priceOrigin(varietyId: VarietyId, live: PricePerKgByVariety | null): PriceOrigin {
  if (live?.[varietyId] != null) {
    return PRICE_ORIGIN.rnm;
  }
  const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
  if (live?.[fallbackId] != null) {
    return PRICE_ORIGIN.fallback;
  }
  return PRICE_ORIGIN.reference;
}
