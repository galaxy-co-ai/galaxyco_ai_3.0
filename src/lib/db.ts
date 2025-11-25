import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // During build time on Vercel, we need a placeholder to avoid build errors
    // The actual connection will be validated at runtime
    if (process.env.VERCEL) {
      // Use a dummy URL during build - will fail gracefully at runtime if not set
      return 'postgresql://build:build@localhost:5432/build';
    }
    throw new Error('DATABASE_URL is not defined');
  }
  return url;
}

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.VERCEL) {
      // During Vercel build without DATABASE_URL, create a mock db that will fail gracefully
      const sql = neon('postgresql://build:build@localhost:5432/build');
      _db = drizzle(sql, { schema });
    } else if (!url) {
      throw new Error('DATABASE_URL is not defined');
    } else {
      const sql = neon(url);
      _db = drizzle(sql, { schema });
    }
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
  },
});


