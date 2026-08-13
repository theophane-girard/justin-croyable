export const CATEGORY_META = {
  legume: { id: 'legume', label: 'Légume', badgeType: 'secondary', icon: 'phosphorLeaf' },
  fruit: { id: 'fruit', label: 'Fruit', badgeType: 'default', icon: 'phosphorTree' },
} as const;

export type CategoryId = keyof typeof CATEGORY_META;

export const PRICE_MODE = {
  conventional: 'conventional',
  bio: 'bio',
} as const;

export type PriceMode = (typeof PRICE_MODE)[keyof typeof PRICE_MODE];

export const HARVEST_UNIT = {
  kilogram: 'kg',
  piece: 'piece',
} as const;

export type HarvestUnit = (typeof HARVEST_UNIT)[keyof typeof HARVEST_UNIT];

type HarvestUnitMeta = {
  readonly quantityLabel: string;
  readonly quantityHint: string;
  readonly quantitySuffix: string;
  readonly priceSuffix: string;
  readonly inputMode: 'decimal' | 'numeric';
  readonly step: string;
  readonly integerOnly: boolean;
};

export const HARVEST_UNIT_META = {
  kg: {
    quantityLabel: 'Poids récolté',
    quantityHint: 'En kilogrammes.',
    quantitySuffix: 'kg',
    priceSuffix: '€/kg',
    inputMode: 'decimal',
    step: '0.1',
    integerOnly: false,
  },
  piece: {
    quantityLabel: 'Quantité récoltée',
    quantityHint: 'En nombre de pièces.',
    quantitySuffix: 'u.',
    priceSuffix: '€/pièce',
    inputMode: 'numeric',
    step: '1',
    integerOnly: true,
  },
} as const satisfies Record<HarvestUnit, HarvestUnitMeta>;

const QUANTITY_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

const HARVEST_UNITS: readonly HarvestUnit[] = [HARVEST_UNIT.kilogram, HARVEST_UNIT.piece];

export function formatQuantity(value: number, unit: HarvestUnit): string {
  return `${QUANTITY_FORMATTER.format(value)} ${HARVEST_UNIT_META[unit].quantitySuffix}`;
}

export function formatQuantityByUnit(byUnit: Record<HarvestUnit, number>): string {
  const parts = HARVEST_UNITS.filter(unit => byUnit[unit] > 0).map(unit =>
    formatQuantity(byUnit[unit], unit),
  );
  return parts.length > 0 ? parts.join(' · ') : formatQuantity(0, HARVEST_UNIT.kilogram);
}

export const SEASON = {
  summer: 'summer',
  winter: 'winter',
} as const;

export type Season = (typeof SEASON)[keyof typeof SEASON];

export const SEASON_META = {
  summer: { id: 'summer', label: 'Été', icon: 'phosphorSun' },
  winter: { id: 'winter', label: 'Hiver', icon: 'phosphorSnowflake' },
} as const;

export const SEASON_FILTER_ALL = 'all';

export type SeasonFilter = Season | typeof SEASON_FILTER_ALL;

const SUMMER_MONTHS: ReadonlySet<number> = new Set([3, 4, 5, 6, 7, 8]);

export function seasonForMonth(month: number): Season {
  return SUMMER_MONTHS.has(month) ? SEASON.summer : SEASON.winter;
}

export function seasonForDate(date: Date): Season {
  return seasonForMonth(date.getMonth());
}

export function matchesSeason(season: Season, filter: SeasonFilter): boolean {
  return filter === SEASON_FILTER_ALL || filter === season;
}

export function isSeasonFilter(value: string): value is SeasonFilter {
  return value === SEASON_FILTER_ALL || value === SEASON.summer || value === SEASON.winter;
}

export const YEAR_ALL = 'all';

export type YearFilter = number | typeof YEAR_ALL;

export function matchesYear(year: number, filter: YearFilter): boolean {
  return filter === YEAR_ALL || year === filter;
}

export const EXPENSE_CATEGORY_META = {
  semences: { id: 'semences', label: 'Semences', icon: 'phosphorPackage' },
  plants: { id: 'plants', label: 'Plants', icon: 'phosphorPottedPlant' },
  substrat: { id: 'substrat', label: 'Terreau & substrat', icon: 'phosphorStack' },
  engrais: { id: 'engrais', label: 'Engrais', icon: 'phosphorDrop' },
  arrosage: { id: 'arrosage', label: 'Arrosage', icon: 'phosphorSprayBottle' },
  outillage: { id: 'outillage', label: 'Outillage', icon: 'phosphorToolbox' },
  autre: { id: 'autre', label: 'Autre', icon: 'phosphorTag' },
} as const;

export type ExpenseCategoryId = keyof typeof EXPENSE_CATEGORY_META;

export const EXPENSE_CATEGORIES = Object.values(EXPENSE_CATEGORY_META);

export type Crop = {
  readonly id: string;
  readonly label: string;
  readonly category: CategoryId;
  readonly icon: string;
  readonly referencePricePerKg: number;
  readonly referenceBioPricePerKg: number;
  readonly fallbackVarietyId?: string;
};

export const CROPS = [
  { id: 'tomate', label: 'Tomate', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.8, referenceBioPricePerKg: 5.2, fallbackVarietyId: 'tomate-ronde' },
  { id: 'courgette', label: 'Courgette', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.7, referenceBioPricePerKg: 4.8 },
  { id: 'carotte', label: 'Carotte', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.7, referenceBioPricePerKg: 2.8 },
  { id: 'pomme-de-terre', label: 'Pomme de terre', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.7, referenceBioPricePerKg: 3 },
  { id: 'salade', label: 'Salade', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.2, referenceBioPricePerKg: 1.8 },
  { id: 'haricot-vert', label: 'Haricot vert', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 8, referenceBioPricePerKg: 14.5 },
  { id: 'poivron', label: 'Poivron', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 4.8, referenceBioPricePerKg: 6.6 },
  { id: 'aubergine', label: 'Aubergine', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.6, referenceBioPricePerKg: 5.9 },
  { id: 'concombre', label: 'Concombre', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 0.9, referenceBioPricePerKg: 1.5 },
  { id: 'radis', label: 'Radis', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.5, referenceBioPricePerKg: 3.6 },
  { id: 'oignon', label: 'Oignon', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.4, referenceBioPricePerKg: 3.2 },
  { id: 'poireau', label: 'Poireau', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.2, referenceBioPricePerKg: 4.3 },
  { id: 'epinard', label: 'Épinard', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 4, referenceBioPricePerKg: 6.5 },
  { id: 'courge', label: 'Courge', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.3, referenceBioPricePerKg: 2.9 },
  { id: 'fraise', label: 'Fraise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 10.7, referenceBioPricePerKg: 20.7 },
  { id: 'framboise', label: 'Framboise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 21.5, referenceBioPricePerKg: 35.5 },
  { id: 'pomme', label: 'Pomme', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 2.5, referenceBioPricePerKg: 3.1 },
  { id: 'poire', label: 'Poire', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 3.6, referenceBioPricePerKg: 5.1 },
  { id: 'prune', label: 'Prune', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4.5, referenceBioPricePerKg: 7.2 },
  { id: 'cerise', label: 'Cerise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 9.7, referenceBioPricePerKg: 15.5 },
  { id: 'abricot', label: 'Abricot', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4, referenceBioPricePerKg: 9 },
  { id: 'peche', label: 'Pêche', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4, referenceBioPricePerKg: 8.1 },
  { id: 'raisin', label: 'Raisin', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4.5, referenceBioPricePerKg: 6.8 },
  { id: 'rhubarbe', label: 'Rhubarbe', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.5, referenceBioPricePerKg: 5.5 },
] as const satisfies readonly Crop[];

export type CropId = (typeof CROPS)[number]['id'];

export const CROP_BY_ID: Readonly<Record<CropId, Crop>> = CROPS.reduce(
  (accumulator, crop) => ({ ...accumulator, [crop.id]: crop }),
  {} as Record<CropId, Crop>,
);

const PIECE_CROP_IDS: ReadonlySet<CropId> = new Set<CropId>(['salade', 'concombre']);

export function cropUnit(cropId: CropId): HarvestUnit {
  return PIECE_CROP_IDS.has(cropId) ? HARVEST_UNIT.piece : HARVEST_UNIT.kilogram;
}

export type VarietyId = string;

export type Variety = {
  readonly id: VarietyId;
  readonly cropId: CropId;
  readonly label: string;
  readonly slug: string | null;
  readonly gardenId: string | null;
  readonly referenceVarietyId: VarietyId | null;
  readonly isCustom: boolean;
  readonly pricingVarietyId: VarietyId;
};

export const PRICE_ORIGIN = {
  rnm: 'rnm',
  fallback: 'fallback',
  reference: 'reference',
} as const;

export type PriceOrigin = (typeof PRICE_ORIGIN)[keyof typeof PRICE_ORIGIN];

export type PriceRow = {
  readonly varietyId: VarietyId;
  readonly varietyLabel: string;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly categoryLabel: string;
  readonly conventionalPricePerKg: number;
  readonly conventionalOrigin: PriceOrigin;
  readonly conventionalSourceLabel: string;
  readonly bioPricePerKg: number;
  readonly bioOrigin: PriceOrigin;
  readonly bioSourceLabel: string;
  readonly bioPremiumPct: number;
  readonly priceDate: Date | null;
};

export type HarvestDraft = {
  readonly varietyId: VarietyId;
  readonly weightKg: number;
  readonly harvestedOn: Date;
};

export type HarvestRow = {
  readonly id: string;
  readonly varietyId: VarietyId;
  readonly varietyLabel: string;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly categoryLabel: string;
  readonly harvestedOn: Date;
  readonly season: Season;
  readonly weightKg: number;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number;
  readonly pricePerKg: number;
  readonly savingsEur: number;
};

export type ExpenseDraft = {
  readonly label: string;
  readonly category: ExpenseCategoryId;
  readonly amountEur: number;
  readonly spentOn: Date;
  readonly plantIds: readonly string[];
};

export type ExpenseRow = {
  readonly id: string;
  readonly label: string;
  readonly categoryId: ExpenseCategoryId;
  readonly categoryLabel: string;
  readonly categoryIcon: string;
  readonly spentOn: Date;
  readonly season: Season;
  readonly amountEur: number;
  readonly plantIds: readonly string[];
};

export type PlantDraft = {
  readonly cropId: CropId;
  readonly varietyId: VarietyId;
  readonly quantity: number;
};

export type PlantRow = {
  readonly id: string;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly cropIcon: string;
  readonly varietyId: VarietyId | null;
  readonly label: string;
  readonly categoryLabel: string;
  readonly quantity: number;
  readonly harvestedKg: number;
  readonly yieldPerPlantKg: number;
  readonly harvestValueEur: number;
  readonly expenseEur: number;
  readonly netSavingsEur: number;
};

export function isCropId(value: string): value is CropId {
  return value in CROP_BY_ID;
}

export function isExpenseCategoryId(value: string): value is ExpenseCategoryId {
  return value in EXPENSE_CATEGORY_META;
}
