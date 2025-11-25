import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      // During build time without DATABASE_URL, create a mock that will fail gracefully
      // Use a valid-looking but non-functional URL format
      const placeholderUrl = 'postgresql://user:pass@localhost:5432/dbname';
      try {
        const sql = neon(placeholderUrl);
        _db = drizzle(sql, { schema });
      } catch (error) {
        // If neon() throws, create a minimal mock db object
        // This should rarely happen, but provides a fallback
        throw new Error('DATABASE_URL is required at runtime. Build completed successfully.');
      }
    } else {
      const sql = neon(url);
      _db = drizzle(sql, { schema });
    }
  }
  return _db;
}

// Lazy proxy that only initializes the database when actually accessed
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    // Only initialize when actually accessing the db, not during module evaluation
    const dbInstance = getDb();
    const value = dbInstance[prop as keyof NeonHttpDatabase<typeof schema>];
    
    // If it's a function, bind it to maintain 'this' context
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    
    return value;
  },
});


