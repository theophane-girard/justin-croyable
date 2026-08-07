import { defineConfig } from 'drizzle-kit';

// `generate` fonctionne hors-ligne (diff du schéma → SQL) : une URL factice
// suffit. `migrate` / `push` échoueront à la connexion si DATABASE_URL n'est
// pas fourni, ce qui est le comportement attendu.
const connectionString = process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/potager';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: connectionString },
  verbose: true,
  strict: true,
});
