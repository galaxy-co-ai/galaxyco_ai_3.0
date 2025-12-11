import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function updateClerkMetadata() {
  console.log('🔄 Updating Clerk metadata for dalton@galaxyco.ai...\n');

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found');
    process.exit(1);
  }

  try {
    // Find user by email
    const searchResponse = await fetch(
      `https://api.clerk.com/v1/users?email_address=dalton@galaxyco.ai`,
      {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const users = await searchResponse.json();
    if (!users || users.length === 0) {
      console.error('❌ User not found in Clerk');
      console.log('Response:', users);
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.email_addresses[0].email_address}`);
    console.log(`   User ID: ${user.id}\n`);

    // Update public metadata
    const updateResponse = await fetch(
      `https://api.clerk.com/v1/users/${user.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            ...user.public_metadata,
            subscriptionTier: 'professional',
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update: ${error}`);
    }

    const updatedUser = await updateResponse.json();
    console.log('✅ Updated Clerk metadata');
    console.log('   subscriptionTier: professional\n');
    console.log('📊 Current Metadata:');
    console.log(JSON.stringify(updatedUser.public_metadata, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updateClerkMetadata()
  .then(() => {
    console.log('✅ Complete! Refresh your browser to see changes.\n');
    process.exit(0);
  })
  .catch(() => process.exit(1));
