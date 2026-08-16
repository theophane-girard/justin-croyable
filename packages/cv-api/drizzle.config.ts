import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

// Charge packages/cv-api/.env (via dotenv, cwd fixé par la target Nx) :
// `nx db-migrate cv-api` marche sans préfixer DATABASE_URL, sur tout OS.
// `generate` fonctionne hors-ligne (diff du schéma → SQL) : une URL factice
// suffit. `migrate` / `push` échoueront à la connexion si DATABASE_URL n'est
// pas fourni, ce qui est le comportement attendu.
const connectionString = process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/cv';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: connectionString },
  verbose: true,
  strict: true,
});
