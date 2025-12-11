import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  try {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, "dalton@galaxyco.ai"),
    });

    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log("✅ User found:", user.email);
    console.log("");

    // Check if Galaxy Co workspace already exists
    let workspace = await db.query.workspaces.findFirst({
      where: eq(schema.workspaces.clerkOrganizationId, "org_36aoD8FWjt0wB6C5eirginv1a34"),
    });

    if (workspace) {
      console.log("✅ Galaxy Co workspace already exists");
      console.log("   Workspace ID:", workspace.id);
    } else {
      // Create Galaxy Co workspace
      const [newWorkspace] = await db.insert(schema.workspaces).values({
        name: "Galaxy Co",
        slug: "galaxy-co",
        clerkOrganizationId: "org_36aoD8FWjt0wB6C5eirginv1a34",
        subscriptionTier: "professional",
        subscriptionStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      workspace = newWorkspace;
      console.log("✅ Created Galaxy Co workspace");
      console.log("   Workspace ID:", workspace.id);

      // Add user as owner
      await db.insert(schema.workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
        joinedAt: new Date(),
      });
      console.log("✅ Added user as owner");
    }

    console.log("");

    // Reassign phone number to Galaxy Co workspace
    const phoneNumber = await db.query.workspacePhoneNumbers.findFirst({
      where: eq(schema.workspacePhoneNumbers.phoneNumber, "+14057052345"),
    });

    if (!phoneNumber) {
      console.log("❌ Phone number not found");
      process.exit(1);
    }

    await db
      .update(schema.workspacePhoneNumbers)
      .set({ workspaceId: workspace.id })
      .where(eq(schema.workspacePhoneNumbers.id, phoneNumber.id));

    console.log("✅ Reassigned phone number to Galaxy Co workspace");
    console.log("");
    console.log("📊 Final State:");
    console.log("   Workspace: Galaxy Co");
    console.log("   Workspace ID:", workspace.id);
    console.log("   Clerk Org ID: org_36aoD8FWjt0wB6C5eirginv1a34");
    console.log("   Phone Number: +14057052345");
    console.log("   Subscription: professional");
    console.log("");
    console.log("🎉 Setup complete! Refresh the browser to see changes.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setup();
