import { z } from 'zod';

export const varietyPriceSchema = z.object({
  id: z.string().uuid(),
  varietyId: z.string().uuid(),
  conventionalPricePerKg: z.number().nonnegative(),
  bioPricePerKg: z.number().nonnegative().nullable(),
  effectiveFrom: z.string().datetime(),
  source: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type VarietyPrice = z.infer<typeof varietyPriceSchema>;

export const createVarietyPriceSchema = z.object({
  varietyId: z.string().uuid(),
  conventionalPricePerKg: z.number().nonnegative(),
  bioPricePerKg: z.number().nonnegative().nullable().optional(),
  effectiveFrom: z.string().datetime(),
  source: z.string().min(1).default('manuel'),
});

export type CreateVarietyPricePayload = z.infer<typeof createVarietyPriceSchema>;

export const updateVarietyPriceSchema = createVarietyPriceSchema.partial();

export type UpdateVarietyPricePayload = z.infer<typeof updateVarietyPriceSchema>;
