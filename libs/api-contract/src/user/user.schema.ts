import { z } from 'zod';

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
