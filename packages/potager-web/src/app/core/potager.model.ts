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
  { id: 'tomate', label: 'Tomate', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.2, referenceBioPricePerKg: 5.2, fallbackVarietyId: 'tomate-coeur-de-boeuf' },
  { id: 'courgette', label: 'Courgette', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.5, referenceBioPricePerKg: 4.2 },
  { id: 'carotte', label: 'Carotte', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.6, referenceBioPricePerKg: 2.8 },
  { id: 'pomme-de-terre', label: 'Pomme de terre', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.8, referenceBioPricePerKg: 2.9 },
  { id: 'salade', label: 'Salade', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.5, referenceBioPricePerKg: 5.5 },
  { id: 'haricot-vert', label: 'Haricot vert', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 5.5, referenceBioPricePerKg: 8.5 },
  { id: 'poivron', label: 'Poivron', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 4, referenceBioPricePerKg: 6.5 },
  { id: 'aubergine', label: 'Aubergine', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.2, referenceBioPricePerKg: 5.5 },
  { id: 'concombre', label: 'Concombre', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.2, referenceBioPricePerKg: 3.8 },
  { id: 'radis', label: 'Radis', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.5, referenceBioPricePerKg: 5.5 },
  { id: 'oignon', label: 'Oignon', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 1.8, referenceBioPricePerKg: 3.2 },
  { id: 'poireau', label: 'Poireau', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.6, referenceBioPricePerKg: 4.3 },
  { id: 'epinard', label: 'Épinard', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 4.5, referenceBioPricePerKg: 7 },
  { id: 'courge', label: 'Courge', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 2.2, referenceBioPricePerKg: 3.6 },
  { id: 'fraise', label: 'Fraise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 8, referenceBioPricePerKg: 13 },
  { id: 'framboise', label: 'Framboise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 20, referenceBioPricePerKg: 28 },
  { id: 'pomme', label: 'Pomme', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 2.6, referenceBioPricePerKg: 4.2 },
  { id: 'poire', label: 'Poire', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 2.9, referenceBioPricePerKg: 4.6 },
  { id: 'prune', label: 'Prune', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4.5, referenceBioPricePerKg: 7 },
  { id: 'cerise', label: 'Cerise', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 9, referenceBioPricePerKg: 13 },
  { id: 'abricot', label: 'Abricot', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4.5, referenceBioPricePerKg: 7 },
  { id: 'peche', label: 'Pêche', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 3.5, referenceBioPricePerKg: 5.8 },
  { id: 'raisin', label: 'Raisin', category: 'fruit', icon: 'phosphorTree', referencePricePerKg: 4, referenceBioPricePerKg: 6.5 },
  { id: 'rhubarbe', label: 'Rhubarbe', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.5, referenceBioPricePerKg: 5.5 },
] as const satisfies readonly Crop[];

export type CropId = (typeof CROPS)[number]['id'];

export const CROP_BY_ID: Readonly<Record<CropId, Crop>> = CROPS.reduce(
  (accumulator, crop) => ({ ...accumulator, [crop.id]: crop }),
  {} as Record<CropId, Crop>,
);

export type PricePerKgByCrop = Partial<Record<CropId, number>>;

export type PriceSource = 'live' | 'reference';

export type Variety = {
  readonly id: string;
  readonly cropId: CropId;
  readonly label: string;
  readonly referencePricePerKg: number;
  readonly referenceBioPricePerKg: number;
  readonly rnmKeywords: readonly string[];
};

const TOMATO_CROP_ID: CropId = 'tomate';

const TOMATO_VARIETIES = [
  { id: 'tomate-grappe', cropId: TOMATO_CROP_ID, label: 'Tomate grappe', referencePricePerKg: 3, referenceBioPricePerKg: 4.8, rnmKeywords: ['tomate grappe'] },
  { id: 'tomate-ronde', cropId: TOMATO_CROP_ID, label: 'Tomate ronde', referencePricePerKg: 2.8, referenceBioPricePerKg: 4.5, rnmKeywords: ['tomate ronde'] },
  { id: 'tomate-coeur-de-boeuf', cropId: TOMATO_CROP_ID, label: 'Tomate cœur de bœuf', referencePricePerKg: 5, referenceBioPricePerKg: 8, rnmKeywords: ['tomate coeur'] },
  { id: 'tomate-cerise', cropId: TOMATO_CROP_ID, label: 'Tomate cerise', referencePricePerKg: 6, referenceBioPricePerKg: 9.5, rnmKeywords: ['tomate cerise'] },
  { id: 'tomate-allongee', cropId: TOMATO_CROP_ID, label: 'Tomate allongée (Roma)', referencePricePerKg: 3.2, referenceBioPricePerKg: 5.2, rnmKeywords: ['tomate allongee', 'tomate roma'] },
  { id: 'tomate-noire-de-crimee', cropId: TOMATO_CROP_ID, label: 'Tomate noire de Crimée', referencePricePerKg: 6, referenceBioPricePerKg: 9.5, rnmKeywords: [] },
  { id: 'tomate-ananas', cropId: TOMATO_CROP_ID, label: 'Tomate ananas', referencePricePerKg: 6.5, referenceBioPricePerKg: 10.5, rnmKeywords: [] },
  { id: 'tomate-green-zebra', cropId: TOMATO_CROP_ID, label: 'Tomate Green Zebra', referencePricePerKg: 6, referenceBioPricePerKg: 9.5, rnmKeywords: [] },
] as const satisfies readonly Variety[];

type TomatoVarietyId = (typeof TOMATO_VARIETIES)[number]['id'];

const DEFAULT_VARIETY_KEYWORDS: Partial<Record<CropId, readonly string[]>> = {
  'pomme-de-terre': ['pomme de terre'],
  salade: ['salade', 'laitue'],
  'haricot-vert': ['haricot vert'],
};

function defaultVarietyKeywords(cropId: CropId): readonly string[] {
  return DEFAULT_VARIETY_KEYWORDS[cropId] ?? [cropId];
}

const DEFAULT_VARIETIES: readonly Variety[] = CROPS.filter(
  crop => crop.id !== TOMATO_CROP_ID,
).map(crop => ({
  id: crop.id,
  cropId: crop.id,
  label: crop.label,
  referencePricePerKg: crop.referencePricePerKg,
  referenceBioPricePerKg: crop.referenceBioPricePerKg,
  rnmKeywords: defaultVarietyKeywords(crop.id),
}));

export const VARIETIES: readonly Variety[] = [...TOMATO_VARIETIES, ...DEFAULT_VARIETIES];

export type VarietyId = Exclude<CropId, typeof TOMATO_CROP_ID> | TomatoVarietyId;

export const VARIETY_BY_ID: Readonly<Record<VarietyId, Variety>> = VARIETIES.reduce(
  (accumulator, variety) => ({ ...accumulator, [variety.id]: variety }),
  {} as Record<VarietyId, Variety>,
);

export const VARIETIES_BY_CROP: Readonly<Record<CropId, readonly Variety[]>> = VARIETIES.reduce(
  (accumulator, variety) => ({
    ...accumulator,
    [variety.cropId]: [...(accumulator[variety.cropId] ?? []), variety],
  }),
  {} as Record<CropId, readonly Variety[]>,
);

export function isVarietyId(value: string): value is VarietyId {
  return value in VARIETY_BY_ID;
}

export function cropFallbackVarietyId(cropId: CropId): VarietyId {
  const fallback = CROP_BY_ID[cropId].fallbackVarietyId;
  if (fallback !== undefined && isVarietyId(fallback)) {
    return fallback;
  }
  return cropId as VarietyId;
}

export type PricePerKgByVariety = Partial<Record<VarietyId, number>>;

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
  readonly bioPricePerKg: number;
  readonly bioPremiumPct: number;
  readonly origin: PriceOrigin;
  readonly sourceLabel: string;
  readonly priceDate: Date | null;
};

export type HarvestEntry = {
  readonly id: string;
  readonly varietyId: VarietyId;
  readonly weightKg: number;
  readonly harvestedOn: string;
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

export type ExpenseEntry = {
  readonly id: string;
  readonly label: string;
  readonly category: ExpenseCategoryId;
  readonly amountEur: number;
  readonly spentOn: string;
  readonly plantIds: readonly string[];
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

export type PlantEntry = {
  readonly id: string;
  readonly cropId: CropId;
  readonly quantity: number;
};

export type PlantDraft = {
  readonly cropId: CropId;
  readonly quantity: number;
};

export type PlantRow = {
  readonly id: string;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly cropIcon: string;
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
