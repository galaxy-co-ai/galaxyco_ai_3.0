import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'fs';

// Prefer .env.local for local development; fall back to .env if needed.
const envFile = existsSync('.env.local') ? '.env.local' : '.env';

config({ path: envFile });

export default defineConfig({
  schema: ['./src/db/schema.ts', './src/db/workflow-schema.ts'],
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Migration settings
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
  // Enable verbose logging for migration generation
  verbose: true,
  // Enforce strict mode for migrations
  strict: true,
});






























































