import { redirect } from 'next/navigation';
import { isSystemAdmin, getAdminContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts, platformFeedback, users, newsletterSubscribers } from '@/db/schema';
import { eq, count, and, gte } from 'drizzle-orm';
import AdminHeader from '@/components/admin/AdminHeader';

/**
 * Admin Layout - Mission Control
 * 
 * This layout wraps all /admin routes and provides:
 * - Server-side admin verification (double-check after middleware)
 * - Tab-based navigation (similar to Conversations page)
 * - Consistent styling for Mission Control
 */

// Get counts for tab badges
async function getAdminCounts() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    const [
      draftPosts,
      newFeedback,
    ] = await Promise.all([
      // Draft posts count
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'draft')).then(r => r[0]?.count ?? 0),
      // New feedback count (last 7 days)
      db.select({ count: count() }).from(platformFeedback).where(
        and(
          eq(platformFeedback.status, 'new'),
          gte(platformFeedback.createdAt, sevenDaysAgo)
        )
      ).then(r => r[0]?.count ?? 0),
    ]);
    
    return {
      content: draftPosts,
      feedback: newFeedback,
    };
  } catch {
    return {
      content: 0,
      feedback: 0,
    };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify admin access - this is the authoritative check
  // Middleware only ensures authentication, this layout verifies authorization
  const isAdmin = await isSystemAdmin();
  
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const { user } = await getAdminContext();
  const counts = await getAdminCounts();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Admin Header with Tabs */}
      <AdminHeader 
        userName={user?.firstName || 'Admin'} 
        counts={counts}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
