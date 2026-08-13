import { z } from 'zod';

export const plantSchema = z.object({
  id: z.string().uuid(),
  cropId: z.string().min(1),
  varietyId: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export type Plant = z.infer<typeof plantSchema>;

export const createPlantSchema = z.object({
  cropId: z.string().min(1),
  varietyId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

export type CreatePlantPayload = z.infer<typeof createPlantSchema>;

export const updatePlantSchema = createPlantSchema.partial();

export type UpdatePlantPayload = z.infer<typeof updatePlantSchema>;
