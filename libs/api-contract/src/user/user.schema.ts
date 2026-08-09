import { z } from 'zod';

export const USER_ROLE = { admin: 'admin', user: 'user' } as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const userRoleSchema = z.enum(['admin', 'user']);

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
