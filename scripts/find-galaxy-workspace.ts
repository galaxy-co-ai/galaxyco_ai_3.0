import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function findWorkspaces() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  try {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, "dalton@galaxyco.ai"),
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", user.email);
    console.log("   User ID:", user.id);
    console.log("");

    // Find all workspaces for this user
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, user.id),
      with: {
        workspace: true,
      },
    });

    console.log(`📊 Found ${memberships.length} workspace(s):\n`);

    for (const membership of memberships) {
      const workspace = membership.workspace;
      console.log(`🏢 ${workspace.name}`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Type: ${workspace.type}`);
      console.log(`   Subscription: ${workspace.subscriptionTier}`);
      console.log(`   Role: ${membership.role}`);
      console.log("");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

findWorkspaces();
