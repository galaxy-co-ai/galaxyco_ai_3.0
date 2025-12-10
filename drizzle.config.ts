import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'fs';

// Prefer .env.local for local development; fall back to .env if needed.
const envFile = existsSync('.env.local') ? '.env.local' : '.env';

config({ path: envFile });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});



























































