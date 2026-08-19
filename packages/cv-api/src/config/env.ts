import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:4200,http://localhost:4400'),
  CORS_ORIGIN_REGEX: z.string().optional(),
  RESUME_ADMIN_EMAIL: z.string().email(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration d'environnement invalide:\n${details}`);
  }
  return parsed.data;
}
