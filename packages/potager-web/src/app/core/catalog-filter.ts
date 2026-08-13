import { CROPS, isCropId, type Variety } from './potager.model';

export const CULTURE_FILTER_ALL = 'all';
export const VARIETY_FILTER_ALL = 'all';

export type CatalogFilterOption = { readonly value: string; readonly label: string };

export const CULTURE_FILTER_OPTIONS: readonly CatalogFilterOption[] = [
  { value: CULTURE_FILTER_ALL, label: 'Toutes les cultures' },
  ...CROPS.map(crop => ({ value: crop.id, label: crop.label })),
];

export function varietyFilterOptions(
  culture: string,
  varieties: readonly Variety[],
): readonly CatalogFilterOption[] {
  const filtered = isCropId(culture)
    ? varieties.filter(variety => variety.cropId === culture)
    : varieties;
  const options = [...filtered]
    .sort((first, second) => first.label.localeCompare(second.label, 'fr'))
    .map(variety => ({ value: variety.id, label: variety.label }));
  return [{ value: VARIETY_FILTER_ALL, label: 'Toutes les variétés' }, ...options];
}
