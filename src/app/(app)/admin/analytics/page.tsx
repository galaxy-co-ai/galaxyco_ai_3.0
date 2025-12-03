import { Metadata } from 'next';
import { db } from '@/lib/db';
import { 
  analyticsEvents, 
  blogPosts, 
  blogCategories,
  blogReadingProgress,
  blogBookmarks,
  users 
} from '@/db/schema';
import { desc, eq, count, sql, and, gte, lt } from 'drizzle-orm';
import { 
  BarChart3, 
  Eye, 
  Users, 
  Clock,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  FileText,
  BookmarkPlus,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const metadata: Metadata = {
  title: 'Analytics | Mission Control',
  description: 'Platform analytics and engagement metrics',
};

// Get date ranges
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return { now, today, yesterday, sevenDaysAgo, thirtyDaysAgo };
}

// Get page view stats
async function getPageViewStats() {
  const { today, yesterday, sevenDaysAgo, thirtyDaysAgo } = getDateRanges();

  try {
    const [todayViews, yesterdayViews, weekViews, monthViews] = await Promise.all([
      db.select({ count: count() }).from(analyticsEvents)
        .where(and(eq(analyticsEvents.eventType, 'page_view'), gte(analyticsEvents.createdAt, today)))
        .then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.eventType, 'page_view'),
          gte(analyticsEvents.createdAt, yesterday),
          lt(analyticsEvents.createdAt, today)
        ))
        .then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(analyticsEvents)
        .where(and(eq(analyticsEvents.eventType, 'page_view'), gte(analyticsEvents.createdAt, sevenDaysAgo)))
        .then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(analyticsEvents)
        .where(and(eq(analyticsEvents.eventType, 'page_view'), gte(analyticsEvents.createdAt, thirtyDaysAgo)))
        .then(r => r[0]?.count ?? 0),
    ]);

    const changePercent = yesterdayViews > 0 
      ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100)
      : 0;

    return { today: todayViews, yesterday: yesterdayViews, week: weekViews, month: monthViews, changePercent };
  } catch {
    return { today: 0, yesterday: 0, week: 0, month: 0, changePercent: 0 };
  }
}

// Get user stats
async function getUserStats() {
  const { today, sevenDaysAgo, thirtyDaysAgo } = getDateRanges();

  try {
    const [totalUsers, newUsersWeek, newUsersMonth, activeToday] = await Promise.all([
      db.select({ count: count() }).from(users).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .then(r => r[0]?.count ?? 0),
      // Active users = users with any event today
      db.selectDistinct({ userId: analyticsEvents.userId })
        .from(analyticsEvents)
        .where(and(gte(analyticsEvents.createdAt, today), sql`${analyticsEvents.userId} IS NOT NULL`))
        .then(r => r.length),
    ]);

    return { total: totalUsers, newWeek: newUsersWeek, newMonth: newUsersMonth, activeToday };
  } catch {
    return { total: 0, newWeek: 0, newMonth: 0, activeToday: 0 };
  }
}

// Get device breakdown
async function getDeviceBreakdown() {
  const { thirtyDaysAgo } = getDateRanges();

  try {
    const devices = await db
      .select({
        deviceType: analyticsEvents.deviceType,
        count: count(),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, thirtyDaysAgo))
      .groupBy(analyticsEvents.deviceType);

    const total = devices.reduce((sum, d) => sum + d.count, 0);
    
    return devices.map(d => ({
      type: d.deviceType || 'unknown',
      count: d.count,
      percent: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));
  } catch {
    return [];
  }
}

// Get top pages
async function getTopPages() {
  const { thirtyDaysAgo } = getDateRanges();

  try {
    const pages = await db
      .select({
        pageUrl: analyticsEvents.pageUrl,
        count: count(),
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'page_view'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      ))
      .groupBy(analyticsEvents.pageUrl)
      .orderBy(desc(count()))
      .limit(10);

    return pages;
  } catch {
    return [];
  }
}

// Get popular posts
async function getPopularPosts() {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        viewCount: blogPosts.viewCount,
        categoryName: blogCategories.name,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.viewCount))
      .limit(5);

    return posts;
  } catch {
    return [];
  }
}

// Get engagement stats
async function getEngagementStats() {
  try {
    const [totalReads, completedReads, totalBookmarks] = await Promise.all([
      db.select({ count: count() }).from(blogReadingProgress).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(blogReadingProgress)
        .where(eq(blogReadingProgress.completed, true))
        .then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(blogBookmarks).then(r => r[0]?.count ?? 0),
    ]);

    const completionRate = totalReads > 0 
      ? Math.round((completedReads / totalReads) * 100) 
      : 0;

    return { totalReads, completedReads, totalBookmarks, completionRate };
  } catch {
    return { totalReads: 0, completedReads: 0, totalBookmarks: 0, completionRate: 0 };
  }
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

export default async function AnalyticsPage() {
  const [pageViews, userStats, devices, topPages, popularPosts, engagement] = await Promise.all([
    getPageViewStats(),
    getUserStats(),
    getDeviceBreakdown(),
    getTopPages(),
    getPopularPosts(),
    getEngagementStats(),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Platform engagement and content performance
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page Views Today</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{pageViews.today}</p>
                  {pageViews.changePercent !== 0 && (
                    <Badge 
                      variant={pageViews.changePercent > 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {pageViews.changePercent > 0 ? '+' : ''}{pageViews.changePercent}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{userStats.activeToday}</p>
                <p className="text-xs text-muted-foreground">today</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{engagement.completionRate}%</p>
                <p className="text-xs text-muted-foreground">articles finished</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
                <p className="text-2xl font-bold">{engagement.totalBookmarks}</p>
                <p className="text-xs text-muted-foreground">saved articles</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <BookmarkPlus className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <span className="capitalize">{device.type}</span>
                      </div>
                      <span className="text-muted-foreground">{device.percent}%</span>
                    </div>
                    <Progress value={device.percent} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No device data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Popular Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Posts</CardTitle>
            <CardDescription>By view count</CardDescription>
          </CardHeader>
          <CardContent>
            {popularPosts.length > 0 ? (
              <div className="space-y-3">
                {popularPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50 w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {post.viewCount} views
                        {post.categoryName && (
                          <>
                            <span>•</span>
                            <span>{post.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No posts yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {topPages.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {topPages.map((page, index) => (
                <div 
                  key={page.pageUrl} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-lg font-bold text-muted-foreground/50 w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{page.pageUrl}</p>
                    <p className="text-xs text-muted-foreground">{page.count} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No page view data yet. Analytics events will appear here once users visit pages.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{pageViews.week}</p>
              <p className="text-sm text-muted-foreground">Views this week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{pageViews.month}</p>
              <p className="text-sm text-muted-foreground">Views this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{userStats.newMonth}</p>
              <p className="text-sm text-muted-foreground">New users this month</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
