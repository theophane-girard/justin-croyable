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

export function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

type VarietyMatcher = { readonly keyword: string; readonly varietyId: VarietyId };

const VARIETY_MATCHERS: readonly VarietyMatcher[] = VARIETIES.flatMap(variety =>
  variety.rnmKeywords.map(keyword => ({
    keyword: normalizeLabel(keyword),
    varietyId: variety.id as VarietyId,
  })),
).sort((a, b) => b.keyword.length - a.keyword.length);

export function matchVarietyId(rawLabel: string): VarietyId | null {
  const normalized = normalizeLabel(rawLabel);
  const matcher = VARIETY_MATCHERS.find(candidate => normalized.includes(candidate.keyword));
  return matcher?.varietyId ?? null;
}

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

export function resolveBioPrice(varietyId: VarietyId): number {
  const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
  return REFERENCE_VARIETY_BIO_PRICES[varietyId] ?? REFERENCE_VARIETY_BIO_PRICES[fallbackId];
}

export function conventionalPriceOrigin(
  varietyId: VarietyId,
  live: PricePerKgByVariety | null,
): PriceOrigin {
  if (live?.[varietyId] != null) {
    return PRICE_ORIGIN.rnm;
  }
  const fallbackId = cropFallbackVarietyId(VARIETY_BY_ID[varietyId].cropId);
  if (live?.[fallbackId] != null) {
    return PRICE_ORIGIN.fallback;
  }
  return PRICE_ORIGIN.reference;
}
