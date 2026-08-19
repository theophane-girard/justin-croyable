import { z } from 'zod';

import { tagSchema } from '../tag/tag.schema';

export const EXPERIENCE_TYPE = {
  job: 'job',
  extra: 'extra',
} as const;

export type ExperienceType = (typeof EXPERIENCE_TYPE)[keyof typeof EXPERIENCE_TYPE];

export const experienceTypeSchema = z.enum([EXPERIENCE_TYPE.job, EXPERIENCE_TYPE.extra]);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');

export const experienceSchema = z.object({
  id: z.string().uuid(),
  type: experienceTypeSchema,
  title: z.string().min(1),
  description: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable(),
  tags: z.array(tagSchema),
  createdAt: z.string().datetime(),
});

export type Experience = z.infer<typeof experienceSchema>;

export const createExperienceSchema = z
  .object({
    type: experienceTypeSchema,
    title: z.string().min(1).max(255),
    description: z.string().default(''),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable().default(null),
    tagIds: z.array(z.string().uuid()).default([]),
  })
  .refine(payload => payload.endDate === null || payload.endDate >= payload.startDate, {
    message: 'La date de fin doit être postérieure ou égale à la date de début.',
    path: ['endDate'],
  });

export type CreateExperiencePayload = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = z.object({
  type: experienceTypeSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type UpdateExperiencePayload = z.infer<typeof updateExperienceSchema>;

export const experienceQuerySchema = z.object({
  type: experienceTypeSchema.optional(),
});

export type ExperienceQuery = z.infer<typeof experienceQuerySchema>;
