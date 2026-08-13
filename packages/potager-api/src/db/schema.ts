import { GARDEN_ROLE, type GardenRole, USER_ROLE, type UserRole } from '@justin-croyable/api-contract';
import {
  type AnyPgColumn,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').$type<UserRole>().notNull().default(USER_ROLE.user),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

const ownerId = () =>
  uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' });

const gardenRef = () => uuid('garden_id').references(() => gardens.id, { onDelete: 'cascade' });

export const gardens = pgTable('gardens', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gardenMembers = pgTable('garden_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  gardenId: uuid('garden_id')
    .notNull()
    .references(() => gardens.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').$type<GardenRole>().notNull().default(GARDEN_ROLE.viewer),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const varieties = pgTable('varieties', {
  id: uuid('id').primaryKey().defaultRandom(),
  gardenId: gardenRef(),
  slug: text('slug'),
  cropId: text('crop_id').notNull(),
  label: text('label').notNull(),
  referenceVarietyId: uuid('reference_variety_id').references((): AnyPgColumn => varieties.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const plants = pgTable('plants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: ownerId(),
  gardenId: gardenRef(),
  cropId: text('crop_id').notNull(),
  varietyId: uuid('variety_id').references(() => varieties.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: ownerId(),
  gardenId: gardenRef(),
  varietyId: uuid('variety_id')
    .notNull()
    .references(() => varieties.id),
  weightKg: doublePrecision('weight_kg').notNull(),
  harvestedOn: timestamp('harvested_on', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const varietyPrices = pgTable('variety_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  varietyId: uuid('variety_id')
    .notNull()
    .references(() => varieties.id, { onDelete: 'cascade' }),
  conventionalPricePerKg: doublePrecision('conventional_price_per_kg').notNull(),
  bioPricePerKg: doublePrecision('bio_price_per_kg'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  source: text('source').notNull().default('reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: ownerId(),
  gardenId: gardenRef(),
  label: text('label').notNull(),
  category: text('category').notNull(),
  amountEur: doublePrecision('amount_eur').notNull(),
  spentOn: timestamp('spent_on', { withTimezone: true }).notNull(),
  plantIds: uuid('plant_ids').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PlantRecord = typeof plants.$inferSelect;
export type HarvestRecord = typeof harvests.$inferSelect;
export type ExpenseRecord = typeof expenses.$inferSelect;
export type VarietyPriceRecord = typeof varietyPrices.$inferSelect;
export type GardenRecord = typeof gardens.$inferSelect;
export type GardenMemberRecord = typeof gardenMembers.$inferSelect;
export type VarietyRecord = typeof varieties.$inferSelect;
