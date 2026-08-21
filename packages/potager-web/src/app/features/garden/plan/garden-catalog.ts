import { CROPS, type CropId, type VarietyId } from '../../../core/potager.model';

export type CatalogVariety = {
  readonly id: VarietyId;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly label: string;
};

const EXTRA_VARIETY_LABELS: Partial<Record<CropId, readonly string[]>> = {
  tomate: ['Cœur de bœuf', 'Cerise', 'Roma'],
  courgette: ['Ronde de Nice'],
  carotte: ['Nantaise', 'Chantenay'],
  'pomme-de-terre': ['Charlotte', 'Bintje'],
  salade: ['Batavia', 'Feuille de chêne'],
  radis: ['De 18 jours'],
  fraise: ['Gariguette', 'Mara des bois'],
  pomme: ['Reinette', 'Golden'],
  courge: ['Butternut', 'Potimarron'],
};

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Catalogue simulé : le POC ne parle à aucune interface de programmation. Chaque
 * culture apporte sa variété générique, complétée de quelques variétés nommées
 * pour les cultures les plus courantes.
 */
export const CATALOG_VARIETIES: readonly CatalogVariety[] = CROPS.flatMap(crop => {
  const generic: CatalogVariety = {
    id: crop.id,
    cropId: crop.id,
    cropLabel: crop.label,
    label: crop.label,
  };
  const extras = (EXTRA_VARIETY_LABELS[crop.id] ?? []).map(
    (label): CatalogVariety => ({
      id: `${crop.id}-${slug(label)}`,
      cropId: crop.id,
      cropLabel: crop.label,
      label: `${crop.label} ${label}`,
    }),
  );
  return [generic, ...extras];
});

export const VARIETY_BY_ID: ReadonlyMap<VarietyId, CatalogVariety> = new Map(
  CATALOG_VARIETIES.map(variety => [variety.id, variety] as const),
);

export function varietyLabel(varietyId: VarietyId): string {
  return VARIETY_BY_ID.get(varietyId)?.label ?? varietyId;
}
