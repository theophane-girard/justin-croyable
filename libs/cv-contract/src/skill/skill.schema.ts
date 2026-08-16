import { z } from 'zod';

import { tagSchema } from '../tag/tag.schema';

export const skillSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  tagId: z.string().uuid(),
  tag: tagSchema,
  createdAt: z.string().datetime(),
});

export type Skill = z.infer<typeof skillSchema>;

export const createSkillSchema = z.object({
  label: z.string().min(1),
  tagId: z.string().uuid(),
});

export type CreateSkillPayload = z.infer<typeof createSkillSchema>;

export const updateSkillSchema = createSkillSchema.partial();

export type UpdateSkillPayload = z.infer<typeof updateSkillSchema>;

export const skillQuerySchema = z.object({
  tagId: z.string().uuid().optional(),
});

export type SkillQuery = z.infer<typeof skillQuerySchema>;
