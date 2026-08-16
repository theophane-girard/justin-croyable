import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

export type Database = PostgresJsDatabase<typeof schema>;

export function createDatabase(connectionString: string): Database {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}
