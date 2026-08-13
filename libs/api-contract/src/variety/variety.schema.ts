import { z } from 'zod';

export const varietySchema = z.object({
  id: z.string().uuid(),
  gardenId: z.string().uuid().nullable(),
  slug: z.string().min(1).nullable(),
  cropId: z.string().min(1),
  label: z.string().min(1),
  referenceVarietyId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type Variety = z.infer<typeof varietySchema>;

export const createVarietySchema = z.object({
  label: z.string().min(1),
  referenceVarietyId: z.string().uuid(),
});

export type CreateVarietyPayload = z.infer<typeof createVarietySchema>;
