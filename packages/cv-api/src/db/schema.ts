import { EXPERIENCE_TYPE, type ExperienceType } from '@justin-croyable/cv-contract';
import { relations } from 'drizzle-orm';
import {
  date,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const EXPERIENCE_TITLE_MAX_LENGTH = 255;

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  img: text('img'),
  icon: text('icon'),
  type: text('type').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const experiences = pgTable(
  'experiences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').$type<ExperienceType>().notNull().default(EXPERIENCE_TYPE.job),
    title: varchar('title', { length: EXPERIENCE_TITLE_MAX_LENGTH }).notNull(),
    description: text('description').notNull().default(''),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  table => [index('experiences_start_date_idx').on(table.startDate)],
);

export const experienceTags = pgTable(
  'experience_tags',
  {
    experienceId: uuid('experience_id')
      .notNull()
      .references(() => experiences.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.experienceId, table.tagId] }),
    index('experience_tags_tag_id_idx').on(table.tagId),
  ],
);

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    label: text('label').notNull(),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  table => [index('skills_tag_id_idx').on(table.tagId)],
);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  dateOfBirth: date('date_of_birth'),
  description: text('description'),
  phoneNumber: text('phone_number'),
  driverLicence: text('driver_licence'),
  email: text('email'),
  website: text('website'),
  linkedin: text('linkedin'),
  streetName: text('street_name'),
  city: text('city'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  experienceTags: many(experienceTags),
  skills: many(skills),
}));

export const experiencesRelations = relations(experiences, ({ many }) => ({
  experienceTags: many(experienceTags),
}));

export const experienceTagsRelations = relations(experienceTags, ({ one }) => ({
  experience: one(experiences, {
    fields: [experienceTags.experienceId],
    references: [experiences.id],
  }),
  tag: one(tags, { fields: [experienceTags.tagId], references: [tags.id] }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  tag: one(tags, { fields: [skills.tagId], references: [tags.id] }),
}));

export type TagRecord = typeof tags.$inferSelect;
export type ExperienceRecord = typeof experiences.$inferSelect;
export type ExperienceTagRecord = typeof experienceTags.$inferSelect;
export type SkillRecord = typeof skills.$inferSelect;
export type ProfileRecord = typeof profiles.$inferSelect;
