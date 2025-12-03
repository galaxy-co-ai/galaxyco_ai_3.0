import { Metadata } from 'next';
import { getAdminContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  blogPosts, 
  platformFeedback, 
  analyticsEvents,
  newsletterSubscribers,
  users 
} from '@/db/schema';
import { eq, count, sql, desc, and, gte } from 'drizzle-orm';
import { 
  FileText, 
  MessageSquareWarning, 
  Users, 
  TrendingUp,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  } catch (error) {
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
  const { user } = await getAdminContext();
  const stats = await getAdminStats();
  const recentFeedback = await getRecentFeedback();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Bar - Centered badges like Conversations page */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{stats.posts.total}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Posts</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <MessageSquareWarning className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span className="font-semibold">{stats.feedback.total}</span>
          <span className="ml-1 text-amber-600/70 font-normal">Feedback</span>
          {stats.feedback.new > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">{stats.feedback.new}</span>
          )}
        </Badge>
        <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <Users className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span className="font-semibold">{stats.users.total}</span>
          <span className="ml-1 text-green-600/70 font-normal">Users</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Mail className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{stats.subscribers}</span>
          <span className="ml-1 text-purple-600/70 font-normal">Subscribers</span>
        </Badge>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a 
              href="/admin/content/new" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Create New Post</p>
                <p className="text-sm text-muted-foreground">Write a new Launchpad article</p>
              </div>
            </a>
            <a 
              href="/admin/feedback" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="p-2 rounded-lg bg-amber-500/10">
                <MessageSquareWarning className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Review Feedback</p>
                <p className="text-sm text-muted-foreground">
                  {stats.feedback.new > 0 ? `${stats.feedback.new} items need attention` : 'All caught up!'}
                </p>
              </div>
            </a>
            <a 
              href="/admin/analytics" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium">View Analytics</p>
                <p className="text-sm text-muted-foreground">Check engagement metrics</p>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest user submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {recentFeedback.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg ${
                      item.type === 'bug' ? 'bg-red-500/10' :
                      item.type === 'suggestion' ? 'bg-blue-500/10' :
                      'bg-zinc-500/10'
                    }`}>
                      <MessageSquareWarning className={`h-3 w-3 ${
                        item.type === 'bug' ? 'text-red-500' :
                        item.type === 'suggestion' ? 'text-blue-500' :
                        'text-zinc-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.title || `${item.type} feedback`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.pageUrl}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquareWarning className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No feedback yet</p>
                <p className="text-xs">Feedback will appear here when users submit it</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
