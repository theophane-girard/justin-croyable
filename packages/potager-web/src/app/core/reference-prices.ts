import { CROPS, type CropId, type PricePerKgByCrop } from './potager.model';

export const REFERENCE_PRICES: Readonly<Record<CropId, number>> = CROPS.reduce(
  (accumulator, crop) => ({ ...accumulator, [crop.id]: crop.referencePricePerKg }),
  {} as Record<CropId, number>,
);

export const RNM_LABEL_MATCHERS: readonly { readonly keyword: string; readonly cropId: CropId }[] = [
  { keyword: 'tomate', cropId: 'tomate' },
  { keyword: 'courgette', cropId: 'courgette' },
  { keyword: 'carotte', cropId: 'carotte' },
  { keyword: 'pomme de terre', cropId: 'pomme-de-terre' },
  { keyword: 'salade', cropId: 'salade' },
  { keyword: 'laitue', cropId: 'salade' },
  { keyword: 'haricot vert', cropId: 'haricot-vert' },
  { keyword: 'poivron', cropId: 'poivron' },
  { keyword: 'aubergine', cropId: 'aubergine' },
  { keyword: 'concombre', cropId: 'concombre' },
  { keyword: 'radis', cropId: 'radis' },
  { keyword: 'oignon', cropId: 'oignon' },
  { keyword: 'poireau', cropId: 'poireau' },
  { keyword: 'epinard', cropId: 'epinard' },
  { keyword: 'courge', cropId: 'courge' },
  { keyword: 'fraise', cropId: 'fraise' },
  { keyword: 'framboise', cropId: 'framboise' },
  { keyword: 'pomme', cropId: 'pomme' },
  { keyword: 'poire', cropId: 'poire' },
  { keyword: 'prune', cropId: 'prune' },
  { keyword: 'cerise', cropId: 'cerise' },
  { keyword: 'abricot', cropId: 'abricot' },
  { keyword: 'peche', cropId: 'peche' },
  { keyword: 'raisin', cropId: 'raisin' },
  { keyword: 'rhubarbe', cropId: 'rhubarbe' },
];

export function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchCropId(rawLabel: string): CropId | null {
  const normalized = normalizeLabel(rawLabel);
  const matcher = RNM_LABEL_MATCHERS.find(candidate => normalized.includes(candidate.keyword));
  return matcher?.cropId ?? null;
}

export function mergePrices(live: PricePerKgByCrop | null): Record<CropId, number> {
  if (!live) {
    return { ...REFERENCE_PRICES };
  }
  return { ...REFERENCE_PRICES, ...live };
}
