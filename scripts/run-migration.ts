/**
 * Script to manually run migration for workspacePhoneNumbers table
 * 
 * Run with: tsx scripts/run-migration.ts
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running migration: Add workspace_phone_numbers table');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Read migration SQL
    const migrationPath = path.join(
      __dirname,
      '../drizzle/migrations/0001_add_workspace_phone_numbers.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Executing SQL migration...');
    
    // Split into statements (properly handling multi-line statements)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await sql.unsafe(statement);
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        if (errMessage.includes('already exists')) {
          console.log(`  ⚠️  Skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('1. Phase 2: Update workspace creation to auto-provision numbers');
    console.log('2. Phase 3: Update SMS sending to use workspace numbers');
    console.log('3. Phase 4: Update webhooks to route by phone number');
    console.log('\nRun: tsx scripts/test-phone-provisioning.ts to test');
    
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Migration failed:', errMessage);
    
    // Check if table already exists
    if (errMessage.includes('already exists')) {
      console.log('\n✅ Table already exists - migration skipped');
    } else {
      throw error;
    }
  }
}

runMigration();
