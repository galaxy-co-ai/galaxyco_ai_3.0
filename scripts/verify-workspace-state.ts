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
  const numbers = await db.query.workspacePhoneNumbers.findMany({
    where: eq(schema.workspacePhoneNumbers.workspaceId, workspace.id),
  });

  console.log('\n📊 Current State:\n');
  console.log('User:', user.email);
  console.log('Workspace ID:', workspace.id);
  console.log('Workspace Name:', workspace.name);
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
