import { CROPS, isCropId, type Variety, VARIETIES, VARIETIES_BY_CROP } from './potager.model';

export const CULTURE_FILTER_ALL = 'all';
export const VARIETY_FILTER_ALL = 'all';

export type CatalogFilterOption = { readonly value: string; readonly label: string };

export const CULTURE_FILTER_OPTIONS: readonly CatalogFilterOption[] = [
  { value: CULTURE_FILTER_ALL, label: 'Toutes les cultures' },
  ...CROPS.map(crop => ({ value: crop.id, label: crop.label })),
];

export function varietyFilterOptions(culture: string): readonly CatalogFilterOption[] {
  const varieties: readonly Variety[] = isCropId(culture) ? VARIETIES_BY_CROP[culture] : VARIETIES;
  return [
    { value: VARIETY_FILTER_ALL, label: 'Toutes les variétés' },
    ...varieties.map(variety => ({ value: variety.id, label: variety.label })),
  ];
}
