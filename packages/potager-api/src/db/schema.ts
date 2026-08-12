import { USER_ROLE, type UserRole } from '@justin-croyable/api-contract';
import {
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

export const plants = pgTable('plants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: ownerId(),
  cropId: text('crop_id').notNull(),
  varietyId: text('variety_id'),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: ownerId(),
  varietyId: text('variety_id').notNull(),
  weightKg: doublePrecision('weight_kg').notNull(),
  harvestedOn: timestamp('harvested_on', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const varietyPrices = pgTable('variety_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  varietyId: text('variety_id').notNull(),
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
