/**
 * Database Cleanup Script: Duplicate Users
 * 
 * This script identifies and removes duplicate user entries in the database.
 * It keeps the earliest created user (by createdAt) for each clerkUserId and removes duplicates.
 * 
 * Run with: npx tsx src/scripts/cleanup-duplicate-users.ts
 * 
 * IMPORTANT: Run this script once to clean up existing duplicates.
 * After this, the upsert patterns in auth.ts and webhooks will prevent new duplicates.
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { users, workspaceMembers } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

interface DuplicateGroup {
  clerkUserId: string;
  count: number;
  userIds: string[];
}

async function findDuplicateUsers(): Promise<DuplicateGroup[]> {
  // Find users with duplicate clerkUserIds (shouldn't happen due to unique constraint, but check anyway)
  const duplicatesByClerkId = await db
    .select({
      clerkUserId: users.clerkUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .groupBy(users.clerkUserId)
    .having(sql`count(*) > 1`);

  // Find users with duplicate emails (more likely scenario)
  const duplicatesByEmail = await db
    .select({
      email: users.email,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .groupBy(users.email)
    .having(sql`count(*) > 1`);

  console.log('\n📊 Duplicate Analysis:');
  console.log(`  - Duplicate clerkUserIds: ${duplicatesByClerkId.length}`);
  console.log(`  - Duplicate emails: ${duplicatesByEmail.length}`);

  const result: DuplicateGroup[] = [];

  // Get full details for clerkUserId duplicates
  for (const dup of duplicatesByClerkId) {
    const usersWithSameClerkId = await db
      .select({ id: users.id, clerkUserId: users.clerkUserId, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.clerkUserId, dup.clerkUserId))
      .orderBy(users.createdAt);

    result.push({
      clerkUserId: dup.clerkUserId,
      count: dup.count,
      userIds: usersWithSameClerkId.map(u => u.id),
    });

    console.log(`\n  ClerkUserId: ${dup.clerkUserId}`);
    for (const u of usersWithSameClerkId) {
      console.log(`    - ${u.id} | ${u.email} | Created: ${u.createdAt}`);
    }
  }

  // Log email duplicates (these may be legitimate - different Clerk accounts with same email)
  if (duplicatesByEmail.length > 0) {
    console.log('\n⚠️  Email Duplicates (may be legitimate different Clerk accounts):');
    for (const dup of duplicatesByEmail) {
      const usersWithSameEmail = await db
        .select({ id: users.id, clerkUserId: users.clerkUserId, email: users.email, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.email, dup.email))
        .orderBy(users.createdAt);

      console.log(`\n  Email: ${dup.email}`);
      for (const u of usersWithSameEmail) {
        console.log(`    - ${u.id} | ClerkID: ${u.clerkUserId} | Created: ${u.createdAt}`);
      }
    }
  }

  return result;
}

async function cleanupDuplicates(duplicates: DuplicateGroup[], dryRun = true): Promise<void> {
  if (duplicates.length === 0) {
    console.log('\n✅ No clerkUserId duplicates found. Database is clean!');
    return;
  }

  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  CLEANUP'}: Processing ${duplicates.length} duplicate groups...`);

  for (const group of duplicates) {
    // Keep the first user (oldest by createdAt), remove the rest
    const [keepUserId, ...removeUserIds] = group.userIds;

    console.log(`\n  Keeping user: ${keepUserId}`);
    console.log(`  Removing users: ${removeUserIds.join(', ')}`);

    if (!dryRun) {
      for (const removeId of removeUserIds) {
        // First, reassign workspace memberships to the kept user
        const memberships = await db
          .select()
          .from(workspaceMembers)
          .where(eq(workspaceMembers.userId, removeId));

        for (const membership of memberships) {
          // Check if kept user already has membership in this workspace
          const existingMembership = await db.query.workspaceMembers.findFirst({
            where: sql`${workspaceMembers.userId} = ${keepUserId} AND ${workspaceMembers.workspaceId} = ${membership.workspaceId}`,
          });

          if (existingMembership) {
            // Delete the duplicate membership
            await db
              .delete(workspaceMembers)
              .where(eq(workspaceMembers.id, membership.id));
            console.log(`    Deleted duplicate membership: ${membership.id}`);
          } else {
            // Reassign to kept user
            await db
              .update(workspaceMembers)
              .set({ userId: keepUserId })
              .where(eq(workspaceMembers.id, membership.id));
            console.log(`    Reassigned membership: ${membership.id} -> ${keepUserId}`);
          }
        }

        // Now delete the duplicate user
        await db
          .delete(users)
          .where(eq(users.id, removeId));
        console.log(`    Deleted user: ${removeId}`);
      }
    }
  }

  console.log(`\n${dryRun ? '🔍 DRY RUN COMPLETE' : '✅ CLEANUP COMPLETE'}`);
}

async function main() {
  console.log('🔍 GalaxyCo.ai - User Duplicate Cleanup Script');
  console.log('================================================\n');

  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  if (dryRun) {
    console.log('ℹ️  Running in DRY RUN mode. No changes will be made.');
    console.log('   To execute cleanup, run with: --execute\n');
  } else {
    console.log('⚠️  EXECUTING CLEANUP - Changes will be permanent!\n');
  }

  try {
    const duplicates = await findDuplicateUsers();
    await cleanupDuplicates(duplicates, dryRun);

    // Summary
    const totalUsers = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    console.log(`\n📊 Final Summary:`);
    console.log(`   Total users in database: ${totalUsers[0]?.count ?? 0}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

