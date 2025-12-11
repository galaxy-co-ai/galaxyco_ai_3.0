/**
 * Upgrade dalton@galaxyco.ai to Professional tier
 * and assign existing SignalWire number (405) 694-0235
 */

// Load environment variables first
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db';
import { workspaces, workspaceMembers, users, workspacePhoneNumbers } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function upgradeAccount() {
  console.log('🚀 Starting account upgrade for dalton@galaxyco.ai...\n');

  try {
    // Step 1: Find user by email
    console.log('Step 1: Finding user...');
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'dalton@galaxyco.ai'),
    });

    if (!user) {
      console.error('❌ User not found: dalton@galaxyco.ai');
      process.exit(1);
    }
    console.log(`✅ User found: ${user.email} (ID: ${user.id})\n`);

    // Step 2: Find workspace membership
    console.log('Step 2: Finding workspace...');
    const membership = await db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, user.id),
      with: {
        workspace: true,
      },
    });

    if (!membership || !membership.workspace) {
      console.error('❌ No workspace found for user');
      process.exit(1);
    }

    const workspace = membership.workspace;
    console.log(`✅ Workspace found: ${workspace.name} (ID: ${workspace.id})`);
    console.log(`   Current tier: ${workspace.subscriptionTier}\n`);

    // Step 3: Check if already Pro
    if (workspace.subscriptionTier === 'professional' || workspace.subscriptionTier === 'enterprise') {
      console.log('ℹ️  Workspace already on Professional/Enterprise tier\n');
    } else {
      // Upgrade to Professional
      console.log('Step 3: Upgrading to Professional tier...');
      await db
        .update(workspaces)
        .set({
          subscriptionTier: 'professional',
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspace.id));
      console.log('✅ Upgraded to Professional tier\n');
    }

    // Step 4: Check for existing phone numbers
    console.log('Step 4: Checking for existing phone numbers...');
    const existingNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(workspacePhoneNumbers.workspaceId, workspace.id),
    });

    if (existingNumbers.length > 0) {
      console.log(`⚠️  Found ${existingNumbers.length} existing phone number(s):`);
      existingNumbers.forEach((num) => {
        console.log(`   - ${num.phoneNumber} (${num.numberType}) - ${num.status}`);
      });
      console.log('   Skipping phone number creation.\n');
    } else {
      // Step 5: Assign SignalWire number
      console.log('Step 5: Assigning SignalWire number (405) 694-0235...');
      
      const phoneNumber = '+14056940235'; // E.164 format
      const phoneNumberSid = 'PN_EXISTING'; // Placeholder - will be updated with actual SID
      
      await db.insert(workspacePhoneNumbers).values({
        workspaceId: workspace.id,
        phoneNumber: phoneNumber,
        phoneNumberSid: phoneNumberSid,
        friendlyName: 'Main Office',
        numberType: 'primary',
        status: 'active',
        capabilities: {
          voice: true,
          sms: true,
          mms: true,
        },
        monthlyCostCents: 500, // $5.00
        voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/voice`,
        smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/sms`,
        statusCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/status`,
      });

      console.log('✅ Phone number assigned successfully!\n');
      console.log(`   Number: (405) 694-0235`);
      console.log(`   Format: ${phoneNumber}`);
      console.log(`   Type: Primary`);
      console.log(`   Status: Active\n`);
    }

    // Step 6: Verify final state
    console.log('Step 6: Verifying final state...');
    const updatedWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspace.id),
    });

    const phoneNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(workspacePhoneNumbers.workspaceId, workspace.id),
    });

    console.log('\n✅ ===== UPGRADE COMPLETE ===== ✅\n');
    console.log('Final State:');
    console.log(`  Workspace: ${updatedWorkspace?.name}`);
    console.log(`  Tier: ${updatedWorkspace?.subscriptionTier}`);
    console.log(`  Phone Numbers: ${phoneNumbers.length}`);
    if (phoneNumbers.length > 0) {
      phoneNumbers.forEach((num) => {
        console.log(`    - ${num.phoneNumber} (${num.friendlyName || 'No name'})`);
      });
    }
    console.log('\n📱 Your phone number will now appear in:');
    console.log('  - https://galaxyco.ai/conversations (header badge)');
    console.log('  - https://galaxyco.ai/settings/phone-numbers (management page)\n');

    console.log('⚠️  IMPORTANT: Update SignalWire webhook configuration:');
    console.log(`  1. Go to SignalWire dashboard for (405) 694-0235`);
    console.log(`  2. Set SMS webhook: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/sms`);
    console.log(`  3. Set Voice webhook: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/voice`);
    console.log(`  4. Set Status webhook: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/status\n`);

  } catch (error) {
    console.error('\n❌ Error during upgrade:', error);
    throw error;
  }
}

// Run the upgrade
upgradeAccount()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
