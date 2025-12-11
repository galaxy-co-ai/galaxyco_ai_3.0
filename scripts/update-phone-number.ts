/**
 * Update workspace phone number to new SignalWire number
 * Old: +14056940235
 * New: +14057052345
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function updatePhoneNumber() {
  console.log('🔄 Updating phone number for dalton@galaxyco.ai...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  try {
    // Find user and workspace
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, 'dalton@galaxyco.ai'),
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    const membership = await db.query.workspaceMembers.findFirst({
      where: eq(schema.workspaceMembers.userId, user.id),
      with: { workspace: true },
    });

    if (!membership?.workspace) {
      console.error('❌ Workspace not found');
      process.exit(1);
    }

    const workspace = membership.workspace;
    console.log(`✅ Workspace: ${workspace.name}\n`);

    // Find existing phone number
    const existing = await db.query.workspacePhoneNumbers.findFirst({
      where: and(
        eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
        eq(schema.workspacePhoneNumbers.phoneNumber, '+14056940235')
      ),
    });

    if (existing) {
      console.log('Found old number: +14056940235');
      console.log('Updating to new number: +14057052345\n');

      // Update to new number
      await db
        .update(schema.workspacePhoneNumbers)
        .set({
          phoneNumber: '+14057052345',
          phoneNumberSid: 'e60eece5-25db-467c-bfa9-f16d1d7af166', // From your screenshot
          friendlyName: 'Main Office',
          updatedAt: new Date(),
        })
        .where(eq(schema.workspacePhoneNumbers.id, existing.id));

      console.log('✅ Phone number updated successfully!\n');
    } else {
      // No existing number, check if new number already exists
      const newExists = await db.query.workspacePhoneNumbers.findFirst({
        where: and(
          eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
          eq(schema.workspacePhoneNumbers.phoneNumber, '+14057052345')
        ),
      });

      if (newExists) {
        console.log('✅ New number already assigned\n');
      } else {
        console.log('No existing number found, creating new entry...');
        await db.insert(schema.workspacePhoneNumbers).values({
          workspaceId: workspace.id,
          phoneNumber: '+14057052345',
          phoneNumberSid: 'e60eece5-25db-467c-bfa9-f16d1d7af166',
          friendlyName: 'Main Office',
          numberType: 'primary',
          status: 'active',
          capabilities: { voice: true, sms: true, mms: true },
          monthlyCostCents: 500,
          voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/voice`,
          smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/sms`,
          statusCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/status`,
        });
        console.log('✅ New phone number created!\n');
      }
    }

    // Verify final state
    const numbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
    });

    console.log('✅ ===== COMPLETE ===== ✅\n');
    console.log(`Workspace: ${workspace.name}`);
    console.log(`Phone Numbers: ${numbers.length}`);
    numbers.forEach((n) => {
      console.log(`  - ${n.phoneNumber} (${n.friendlyName || 'No name'}) - ${n.status}`);
    });

    console.log('\n📱 Your new number will appear at:');
    console.log('  - https://galaxyco.ai/conversations');
    console.log('  - https://galaxyco.ai/settings/phone-numbers\n');

    console.log('✅ SignalWire webhooks are already configured (from screenshot)');
    console.log('   You can verify at SignalWire dashboard\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

updatePhoneNumber()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
