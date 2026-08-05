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
};

export const CROPS = [
  { id: 'tomate', label: 'Tomate', category: 'legume', icon: 'phosphorLeaf', referencePricePerKg: 3.2, referenceBioPricePerKg: 5.2 },
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

export type HarvestEntry = {
  readonly id: string;
  readonly cropId: CropId;
  readonly weightKg: number;
  readonly harvestedOn: string;
};

export type HarvestDraft = {
  readonly cropId: CropId;
  readonly weightKg: number;
  readonly harvestedOn: Date;
};

export type HarvestRow = {
  readonly id: string;
  readonly cropLabel: string;
  readonly categoryLabel: string;
  readonly harvestedOn: Date;
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
};

export type ExpenseDraft = {
  readonly label: string;
  readonly category: ExpenseCategoryId;
  readonly amountEur: number;
  readonly spentOn: Date;
};

export type ExpenseRow = {
  readonly id: string;
  readonly label: string;
  readonly categoryId: ExpenseCategoryId;
  readonly categoryLabel: string;
  readonly categoryIcon: string;
  readonly spentOn: Date;
  readonly amountEur: number;
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
};

export function isCropId(value: string): value is CropId {
  return value in CROP_BY_ID;
}

export function isExpenseCategoryId(value: string): value is ExpenseCategoryId {
  return value in EXPENSE_CATEGORY_META;
}
