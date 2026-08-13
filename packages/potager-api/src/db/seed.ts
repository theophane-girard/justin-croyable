import 'dotenv/config';

import { eq, isNull } from 'drizzle-orm';

import { createDatabase, type Database } from './drizzle';
import { varieties, varietyPrices } from './schema';

const EFFECTIVE_FROM = new Date('2020-01-01T00:00:00.000Z');
const SOURCE = 'reference';

type SeedPrice = {
  readonly varietyId: string;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number;
};

type SeedVariety = {
  readonly slug: string;
  readonly cropId: string;
  readonly label: string;
};

const REFERENCE_VARIETIES: readonly SeedVariety[] = [
  { slug: 'tomate-grappe', cropId: 'tomate', label: 'Tomate grappe' },
  { slug: 'tomate-ronde', cropId: 'tomate', label: 'Tomate ronde' },
  { slug: 'tomate-coeur-de-boeuf', cropId: 'tomate', label: 'Tomate cœur de bœuf' },
  { slug: 'tomate-cerise', cropId: 'tomate', label: 'Tomate cerise' },
  { slug: 'tomate-allongee', cropId: 'tomate', label: 'Tomate allongée (Roma)' },
  { slug: 'tomate-noire-de-crimee', cropId: 'tomate', label: 'Tomate noire de Crimée' },
  { slug: 'tomate-ananas', cropId: 'tomate', label: 'Tomate ananas' },
  { slug: 'tomate-green-zebra', cropId: 'tomate', label: 'Tomate Green Zebra' },
  { slug: 'courgette', cropId: 'courgette', label: 'Courgette' },
  { slug: 'carotte', cropId: 'carotte', label: 'Carotte' },
  { slug: 'pomme-de-terre', cropId: 'pomme-de-terre', label: 'Pomme de terre' },
  { slug: 'salade', cropId: 'salade', label: 'Salade' },
  { slug: 'haricot-vert', cropId: 'haricot-vert', label: 'Haricot vert' },
  { slug: 'poivron', cropId: 'poivron', label: 'Poivron' },
  { slug: 'aubergine', cropId: 'aubergine', label: 'Aubergine' },
  { slug: 'concombre', cropId: 'concombre', label: 'Concombre' },
  { slug: 'radis', cropId: 'radis', label: 'Radis' },
  { slug: 'oignon', cropId: 'oignon', label: 'Oignon' },
  { slug: 'poireau', cropId: 'poireau', label: 'Poireau' },
  { slug: 'epinard', cropId: 'epinard', label: 'Épinard' },
  { slug: 'courge', cropId: 'courge', label: 'Courge' },
  { slug: 'fraise', cropId: 'fraise', label: 'Fraise' },
  { slug: 'framboise', cropId: 'framboise', label: 'Framboise' },
  { slug: 'pomme', cropId: 'pomme', label: 'Pomme' },
  { slug: 'poire', cropId: 'poire', label: 'Poire' },
  { slug: 'prune', cropId: 'prune', label: 'Prune' },
  { slug: 'cerise', cropId: 'cerise', label: 'Cerise' },
  { slug: 'abricot', cropId: 'abricot', label: 'Abricot' },
  { slug: 'peche', cropId: 'peche', label: 'Pêche' },
  { slug: 'raisin', cropId: 'raisin', label: 'Raisin' },
  { slug: 'rhubarbe', cropId: 'rhubarbe', label: 'Rhubarbe' },
];

const REFERENCE_PRICES: readonly SeedPrice[] = [
  { varietyId: 'tomate-grappe', conventionalPricePerKg: 3, bioPricePerKg: 5.2 },
  { varietyId: 'tomate-ronde', conventionalPricePerKg: 2.8, bioPricePerKg: 5.2 },
  { varietyId: 'tomate-coeur-de-boeuf', conventionalPricePerKg: 5.4, bioPricePerKg: 6.2 },
  { varietyId: 'tomate-cerise', conventionalPricePerKg: 7.1, bioPricePerKg: 12.6 },
  { varietyId: 'tomate-allongee', conventionalPricePerKg: 2.8, bioPricePerKg: 4.2 },
  { varietyId: 'tomate-noire-de-crimee', conventionalPricePerKg: 5.4, bioPricePerKg: 6.2 },
  { varietyId: 'tomate-ananas', conventionalPricePerKg: 5.6, bioPricePerKg: 6.6 },
  { varietyId: 'tomate-green-zebra', conventionalPricePerKg: 5.4, bioPricePerKg: 6.2 },
  { varietyId: 'courgette', conventionalPricePerKg: 2.7, bioPricePerKg: 4.8 },
  { varietyId: 'carotte', conventionalPricePerKg: 1.7, bioPricePerKg: 2.8 },
  { varietyId: 'pomme-de-terre', conventionalPricePerKg: 1.7, bioPricePerKg: 3 },
  { varietyId: 'salade', conventionalPricePerKg: 3, bioPricePerKg: 4.5 },
  { varietyId: 'haricot-vert', conventionalPricePerKg: 8, bioPricePerKg: 14.5 },
  { varietyId: 'poivron', conventionalPricePerKg: 4.8, bioPricePerKg: 6.6 },
  { varietyId: 'aubergine', conventionalPricePerKg: 3.6, bioPricePerKg: 5.9 },
  { varietyId: 'concombre', conventionalPricePerKg: 2.2, bioPricePerKg: 3.8 },
  { varietyId: 'radis', conventionalPricePerKg: 2.5, bioPricePerKg: 3.6 },
  { varietyId: 'oignon', conventionalPricePerKg: 2.4, bioPricePerKg: 3.2 },
  { varietyId: 'poireau', conventionalPricePerKg: 2.2, bioPricePerKg: 4.3 },
  { varietyId: 'epinard', conventionalPricePerKg: 4, bioPricePerKg: 6.5 },
  { varietyId: 'courge', conventionalPricePerKg: 2.3, bioPricePerKg: 2.9 },
  { varietyId: 'fraise', conventionalPricePerKg: 10.7, bioPricePerKg: 20.7 },
  { varietyId: 'framboise', conventionalPricePerKg: 21.5, bioPricePerKg: 35.5 },
  { varietyId: 'pomme', conventionalPricePerKg: 2.5, bioPricePerKg: 3.1 },
  { varietyId: 'poire', conventionalPricePerKg: 3.6, bioPricePerKg: 5.1 },
  { varietyId: 'prune', conventionalPricePerKg: 4.5, bioPricePerKg: 7.2 },
  { varietyId: 'cerise', conventionalPricePerKg: 9.7, bioPricePerKg: 15.5 },
  { varietyId: 'abricot', conventionalPricePerKg: 4, bioPricePerKg: 9 },
  { varietyId: 'peche', conventionalPricePerKg: 4, bioPricePerKg: 8.1 },
  { varietyId: 'raisin', conventionalPricePerKg: 4.5, bioPricePerKg: 6.8 },
  { varietyId: 'rhubarbe', conventionalPricePerKg: 3.5, bioPricePerKg: 5.5 },
];

async function referenceIdBySlug(db: Database): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: varieties.id, slug: varieties.slug })
    .from(varieties)
    .where(isNull(varieties.gardenId));
  return new Map(
    rows.filter(row => row.slug !== null).map(row => [row.slug as string, row.id]),
  );
}

async function seedPrices(db: Database): Promise<void> {
  const idBySlug = await referenceIdBySlug(db);
  const existing = await db
    .select({ varietyId: varietyPrices.varietyId })
    .from(varietyPrices)
    .where(eq(varietyPrices.source, SOURCE));
  const existingIds = new Set(existing.map(row => row.varietyId));
  const toInsert = REFERENCE_PRICES.map(price => ({
    price,
    varietyId: idBySlug.get(price.varietyId),
  })).filter(
    (entry): entry is { price: SeedPrice; varietyId: string } =>
      entry.varietyId !== undefined && !existingIds.has(entry.varietyId),
  );
  if (toInsert.length === 0) {
    console.log('Seed variety_prices : rien à insérer (prix de référence déjà présents).');
    return;
  }
  await db.insert(varietyPrices).values(
    toInsert.map(entry => ({
      varietyId: entry.varietyId,
      conventionalPricePerKg: entry.price.conventionalPricePerKg,
      bioPricePerKg: entry.price.bioPricePerKg,
      effectiveFrom: EFFECTIVE_FROM,
      source: SOURCE,
    })),
  );
  console.log(`Seed variety_prices : ${toInsert.length} prix de référence insérés.`);
}

async function seedVarieties(db: Database): Promise<void> {
  const existing = await db
    .select({ slug: varieties.slug })
    .from(varieties)
    .where(isNull(varieties.gardenId));
  const existingSlugs = new Set(existing.map(row => row.slug));
  const toInsert = REFERENCE_VARIETIES.filter(variety => !existingSlugs.has(variety.slug));
  if (toInsert.length === 0) {
    console.log('Seed varieties : rien à insérer (variétés de référence déjà présentes).');
    return;
  }
  await db.insert(varieties).values(
    toInsert.map(variety => ({
      gardenId: null,
      slug: variety.slug,
      cropId: variety.cropId,
      label: variety.label,
      referenceVarietyId: null,
    })),
  );
  console.log(`Seed varieties : ${toInsert.length} variétés de référence insérées.`);
}

async function seed(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL requis pour le seed.');
  }
  const db = createDatabase(connectionString);
  await seedVarieties(db);
  await seedPrices(db);
}

seed()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Seed échoué :', error);
    process.exit(1);
  });
