import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function updateOrgMetadata() {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecretKey) {
    console.error('❌ CLERK_SECRET_KEY not found');
    process.exit(1);
  }

  const orgId = 'org_36aoD8FWjt0wB6C5eirginv1a34';

  try {
    console.log('🔄 Updating Clerk organization metadata...');
    console.log('   Org ID:', orgId);
    console.log('');

    const response = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          subscriptionTier: 'professional',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Clerk API error:', error);
      process.exit(1);
    }

    const org = await response.json();
    console.log('✅ Organization metadata updated successfully');
    console.log('   Organization:', org.name);
    console.log('   Subscription Tier:', org.public_metadata?.subscriptionTier || 'not set');
    console.log('');
    console.log('🎉 Done! Hard refresh the browser to see changes.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateOrgMetadata();
