import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const workspace = await db.query.workspaces.findFirst({
    where: eq(schema.workspaces.clerkOrganizationId, 'org_36aoD8FWjt0wB6C5eirginv1a34'),
  });

  if (!workspace) {
    console.error('❌ Galaxy Co workspace not found');
    process.exit(1);
  }

  const numbers = await db.query.workspacePhoneNumbers.findMany({
    where: eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
  });

  console.log('\n📊 Galaxy Co Workspace State:\n');
  console.log('Workspace ID:', workspace.id);
  console.log('Workspace Name:', workspace.name);
  console.log('Clerk Org ID:', workspace.clerkOrganizationId);
  console.log('Subscription Tier:', workspace.subscriptionTier);
  console.log('\nPhone Numbers:', numbers.length);
  numbers.forEach((n) => {
    console.log(`  - ${n.phoneNumber} (${n.friendlyName}) [${n.status}]`);
  });
  console.log('');
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
