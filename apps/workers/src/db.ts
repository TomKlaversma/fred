import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@fred/db";

let pool: Pool | null = null;

export function createDbPool(connectionString: string) {
  pool = new Pool({ connectionString });
  return pool;
}

export function createDb(connectionString: string) {
  const dbPool = createDbPool(connectionString);
  const db = drizzle(dbPool, { schema });
  return { db, pool: dbPool };
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error("Database pool not initialized. Call createDb first.");
  }
  return pool;
}

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;
