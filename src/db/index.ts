import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Configure connection pool to prevent exhausting database connections
const client = postgres(connectionString, { 
  prepare: false,
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // Maximum lifetime of a connection (30 minutes)
});

export const db = drizzle(client, { schema });

export * from './schema';
