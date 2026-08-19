import { z } from 'zod';

export const errorSchema = z.object({ message: z.string() });
export const idParamSchema = z.object({ id: z.string().uuid() });
export const deletedSchema = z.object({ id: z.string().uuid() });
