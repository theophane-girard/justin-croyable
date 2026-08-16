import { z } from 'zod';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');

const optionalText = z.string().min(1).nullable().default(null);

export const profileSchema = z.object({
  id: z.string().uuid(),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  dateOfBirth: isoDateSchema.nullable(),
  description: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  driverLicence: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  linkedin: z.string().nullable(),
  streetName: z.string().nullable(),
  city: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

export const upsertProfileSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  dateOfBirth: isoDateSchema.nullable().default(null),
  description: z.string().nullable().default(null),
  phoneNumber: optionalText,
  driverLicence: optionalText,
  email: z.string().email().nullable().default(null),
  website: z.string().url().nullable().default(null),
  linkedin: z.string().url().nullable().default(null),
  streetName: optionalText,
  city: optionalText,
});

export type UpsertProfilePayload = z.infer<typeof upsertProfileSchema>;
