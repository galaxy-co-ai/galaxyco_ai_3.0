import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkOrgs() {
  if (!process.env.DATABASE_URL || !process.env.CLERK_SECRET_KEY) {
    console.error('❌ Required env vars not found');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  // Get user from DB
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, "dalton@galaxyco.ai"),
  });

  if (!user) {
    console.log("❌ User not found");
    process.exit(1);
  }

  console.log("✅ User found in DB:");
  console.log("   Email:", user.email);
  console.log("   Clerk ID:", user.clerkUserId);
  console.log("");

  // Check Clerk organizations
  const clerkResponse = await fetch(
    `https://api.clerk.com/v1/users/${user.clerkUserId}/organization_memberships`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!clerkResponse.ok) {
    const error = await clerkResponse.json();
    console.error("❌ Clerk API error:", error);
    process.exit(1);
  }

  const orgs = await clerkResponse.json();
  console.log("📊 Clerk Organizations:");
  console.log(JSON.stringify(orgs, null, 2));

  process.exit(0);
}

checkOrgs();
