import { z } from 'zod';

export const tagSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  img: z.string().nullable(),
  icon: z.string().nullable(),
  type: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type Tag = z.infer<typeof tagSchema>;

export const createTagSchema = z.object({
  label: z.string().min(1),
  img: z.string().min(1).nullable().default(null),
  icon: z.string().min(1).nullable().default(null),
  type: z.string().min(1),
});

export type CreateTagPayload = z.infer<typeof createTagSchema>;

export const updateTagSchema = createTagSchema.partial();

export type UpdateTagPayload = z.infer<typeof updateTagSchema>;

export const tagQuerySchema = z.object({
  type: z.string().min(1).optional(),
});

export type TagQuery = z.infer<typeof tagQuerySchema>;
