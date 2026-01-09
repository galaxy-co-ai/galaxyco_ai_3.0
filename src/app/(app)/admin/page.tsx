import { Metadata } from 'next';
import { getAdminContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  blogPosts, 
  platformFeedback,
  newsletterSubscribers,
  users 
} from '@/db/schema';
import { eq, count, desc, and, gte } from 'drizzle-orm';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mission Control | GalaxyCo.ai',
  description: 'Admin dashboard for GalaxyCo.ai platform management',
};

// Get stats for the dashboard
async function getAdminStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    // Run queries in parallel
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalFeedback,
      newFeedback,
      totalUsers,
      recentUsers,
      totalSubscribers,
    ] = await Promise.all([
      // Total blog posts
      db.select({ count: count() }).from(blogPosts).then(r => r[0]?.count ?? 0),
      // Published posts
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'published')).then(r => r[0]?.count ?? 0),
      // Draft posts
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'draft')).then(r => r[0]?.count ?? 0),
      // Total feedback
      db.select({ count: count() }).from(platformFeedback).then(r => r[0]?.count ?? 0),
      // New feedback (last 7 days)
      db.select({ count: count() }).from(platformFeedback).where(
        and(
          eq(platformFeedback.status, 'new'),
          gte(platformFeedback.createdAt, sevenDaysAgo)
        )
      ).then(r => r[0]?.count ?? 0),
      // Total users
      db.select({ count: count() }).from(users).then(r => r[0]?.count ?? 0),
      // Recent users (last 30 days)
      db.select({ count: count() }).from(users).where(
        gte(users.createdAt, thirtyDaysAgo)
      ).then(r => r[0]?.count ?? 0),
      // Newsletter subscribers
      db.select({ count: count() }).from(newsletterSubscribers).where(
        eq(newsletterSubscribers.isActive, true)
      ).then(r => r[0]?.count ?? 0),
    ]);
    
    return {
      posts: { total: totalPosts, published: publishedPosts, drafts: draftPosts },
      feedback: { total: totalFeedback, new: newFeedback },
      users: { total: totalUsers, recent: recentUsers },
      subscribers: totalSubscribers,
    };
  } catch {
    // Return zeros if tables don't exist yet
    return {
      posts: { total: 0, published: 0, drafts: 0 },
      feedback: { total: 0, new: 0 },
      users: { total: 0, recent: 0 },
      subscribers: 0,
    };
  }
}

// Get recent feedback items
async function getRecentFeedback() {
  try {
    return await db
      .select({
        id: platformFeedback.id,
        type: platformFeedback.type,
        title: platformFeedback.title,
        pageUrl: platformFeedback.pageUrl,
        sentiment: platformFeedback.sentiment,
        status: platformFeedback.status,
        createdAt: platformFeedback.createdAt,
      })
      .from(platformFeedback)
      .orderBy(desc(platformFeedback.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

export default async function AdminDashboard() {
  // Validates admin access - throws if not admin
  await getAdminContext();
  const stats = await getAdminStats();
  const recentFeedback = await getRecentFeedback();

  return <AdminDashboardClient stats={stats} recentFeedback={recentFeedback} />;
}
