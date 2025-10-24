import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for better reliability
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection not established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool] Unexpected error on idle client', err);
});

// Log pool connection events for debugging
pool.on('connect', () => {
  console.log('[PostgreSQL Pool] New client connected');
});

pool.on('remove', () => {
  console.log('[PostgreSQL Pool] Client removed from pool');
});

export const db = drizzle({ client: pool, schema });
