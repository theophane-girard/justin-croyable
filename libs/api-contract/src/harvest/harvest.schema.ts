import { z } from 'zod';

export const harvestSchema = z.object({
  id: z.string().uuid(),
  varietyId: z.string().min(1),
  weightKg: z.number().positive(),
  harvestedOn: z.string().datetime(),
  conventionalPricePerKg: z.number().nonnegative().nullable(),
  bioPricePerKg: z.number().nonnegative().nullable(),
  createdAt: z.string().datetime(),
});

export type Harvest = z.infer<typeof harvestSchema>;

export const createHarvestSchema = z.object({
  varietyId: z.string().min(1),
  weightKg: z.number().positive(),
  harvestedOn: z.string().datetime(),
  conventionalPricePerKg: z.number().nonnegative().nullable().optional(),
  bioPricePerKg: z.number().nonnegative().nullable().optional(),
});

export type CreateHarvestPayload = z.infer<typeof createHarvestSchema>;

export const updateHarvestSchema = createHarvestSchema.partial();

export type UpdateHarvestPayload = z.infer<typeof updateHarvestSchema>;
