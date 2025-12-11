/**
 * Standalone script to upgrade dalton@galaxyco.ai
 * Connects directly to database without importing app modules
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env first
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function upgrade() {
  console.log('🚀 Starting account upgrade for dalton@galaxyco.ai...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  // Create database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  try {
    // Step 1: Find user
    console.log('Step 1: Finding user dalton@galaxyco.ai...');
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, 'dalton@galaxyco.ai'),
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }
    console.log(`✅ User found: ${user.email} (${user.id})\n`);

    // Step 2: Find workspace
    console.log('Step 2: Finding workspace...');
    const membership = await db.query.workspaceMembers.findFirst({
      where: eq(schema.workspaceMembers.userId, user.id),
      with: { workspace: true },
    });

    if (!membership?.workspace) {
      console.error('❌ No workspace found');
      process.exit(1);
    }

    const workspace = membership.workspace;
    console.log(`✅ Workspace: ${workspace.name}`);
    console.log(`   Current tier: ${workspace.subscriptionTier}\n`);

    // Step 3: Upgrade to Pro
    if (workspace.subscriptionTier === 'professional' || workspace.subscriptionTier === 'enterprise') {
      console.log('ℹ️  Already Professional/Enterprise\n');
    } else {
      console.log('Step 3: Upgrading to Professional...');
      await db
        .update(schema.workspaces)
        .set({
          subscriptionTier: 'professional',
          updatedAt: new Date(),
        })
        .where(eq(schema.workspaces.id, workspace.id));
      console.log('✅ Upgraded to Professional\n');
    }

    // Step 4: Check existing phone numbers
    console.log('Step 4: Checking phone numbers...');
    const existing = await db.query.workspacePhoneNumbers.findMany({
      where: eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
    });

    if (existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing number(s):`);
      existing.forEach((n) => console.log(`   - ${n.phoneNumber} (${n.numberType})`));
      console.log('\n');
    } else {
      // Step 5: Add phone number
      console.log('Step 5: Adding phone number (405) 694-0235...');
      
      await db.insert(schema.workspacePhoneNumbers).values({
        workspaceId: workspace.id,
        phoneNumber: '+14056940235',
        phoneNumberSid: 'PN_MANUAL_ASSIGNMENT',
        friendlyName: 'Main Office',
        numberType: 'primary',
        status: 'active',
        capabilities: { voice: true, sms: true, mms: true },
        monthlyCostCents: 500,
        voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/voice`,
        smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/sms`,
        statusCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/status`,
      });

      console.log('✅ Phone number added\n');
    }

    // Step 6: Verify
    console.log('Step 6: Verifying...');
    const updated = await db.query.workspaces.findFirst({
      where: eq(schema.workspaces.id, workspace.id),
    });
    const numbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
    });

    console.log('\n✅ ===== COMPLETE ===== ✅\n');
    console.log(`Workspace: ${updated?.name}`);
    console.log(`Tier: ${updated?.subscriptionTier}`);
    console.log(`Phone Numbers: ${numbers.length}`);
    numbers.forEach((n) => console.log(`  - ${n.phoneNumber} (${n.friendlyName})`));

    console.log('\n📱 Available at:');
    console.log('  - https://galaxyco.ai/conversations');
    console.log('  - https://galaxyco.ai/settings/phone-numbers\n');
    
    console.log('⚠️  Configure SignalWire webhooks for (405) 694-0235:');
    console.log('  - SMS: https://galaxyco.ai/api/webhooks/signalwire/sms');
    console.log('  - Voice: https://galaxyco.ai/api/webhooks/signalwire/voice');
    console.log('  - Status: https://galaxyco.ai/api/webhooks/signalwire/status\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

upgrade()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
