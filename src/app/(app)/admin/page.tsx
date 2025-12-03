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
  Eye,
  BookmarkPlus,
  Mail,
  Activity
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

  const statCards = [
    {
      title: 'Launchpad Posts',
      value: stats.posts.total,
      description: `${stats.posts.published} published, ${stats.posts.drafts} drafts`,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Platform Feedback',
      value: stats.feedback.total,
      description: `${stats.feedback.new} new this week`,
      icon: MessageSquareWarning,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      badge: stats.feedback.new > 0 ? `${stats.feedback.new} new` : undefined,
    },
    {
      title: 'Total Users',
      value: stats.users.total,
      description: `${stats.users.recent} joined this month`,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Newsletter Subscribers',
      value: stats.subscribers,
      description: 'Active subscribers',
      icon: Mail,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Activity className="h-3 w-3 mr-1" />
          System Healthy
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
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
