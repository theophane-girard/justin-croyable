import { z } from 'zod';

export const sessionSchema = z.object({
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoUrl: z.string().nullable(),
  isAdmin: z.boolean(),
});

export type Session = z.infer<typeof sessionSchema>;
