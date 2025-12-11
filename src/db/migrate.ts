/**
 * Database Migration Runner
 * 
 * Run migrations programmatically in Node.js environment.
 * Useful for CI/CD pipelines and automated deployments.
 * 
 * Usage:
 *   tsx src/db/migrate.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
const envFile = existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envFile });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔄 Running database migrations...');
  console.log(`📂 Using env file: ${envFile}`);
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Run migrations from the ./drizzle/migrations folder
  await migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle/migrations') });

  console.log('✅ Migrations completed successfully!');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
