import { z } from 'zod';

export const harvestSchema = z.object({
  id: z.string().uuid(),
  varietyId: z.string().uuid(),
  weightKg: z.number().positive(),
  harvestedOn: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Harvest = z.infer<typeof harvestSchema>;

export const createHarvestSchema = z.object({
  varietyId: z.string().uuid(),
  weightKg: z.number().positive(),
  harvestedOn: z.string().datetime(),
});

export type CreateHarvestPayload = z.infer<typeof createHarvestSchema>;

export const updateHarvestSchema = createHarvestSchema.partial();

export type UpdateHarvestPayload = z.infer<typeof updateHarvestSchema>;
