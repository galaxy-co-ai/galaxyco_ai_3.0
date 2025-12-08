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
import { desc, eq, count, sql, and, gte, lt, avg } from 'drizzle-orm';
import { format } from 'date-fns';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, Search as SearchIcon, MousePointerClick } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

// Get page view trend (7 days)
async function getPageViewTrend() {
  const { sevenDaysAgo } = getDateRanges();
  
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayViews = await db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.eventType, 'page_view'),
          gte(analyticsEvents.createdAt, dayStart),
          lt(analyticsEvents.createdAt, dayEnd)
        ))
        .then(r => r[0]?.count ?? 0);
      
      days.push({
        date: format(dayStart, 'MMM d'),
        views: dayViews,
      });
    }
    
    return days;
  } catch {
    return Array.from({ length: 7 }, (_, i) => ({
      date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'MMM d'),
      views: 0,
    }));
  }
}

// Get user activity trend (7 days)
async function getUserActivityTrend() {
  const { sevenDaysAgo } = getDateRanges();
  
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const activeUsers = await db
        .selectDistinct({ userId: analyticsEvents.userId })
        .from(analyticsEvents)
        .where(and(
          gte(analyticsEvents.createdAt, dayStart),
          lt(analyticsEvents.createdAt, dayEnd),
          sql`${analyticsEvents.userId} IS NOT NULL`
        ))
        .then(r => r.length);
      
      days.push({
        date: format(dayStart, 'MMM d'),
        users: activeUsers,
      });
    }
    
    return days;
  } catch {
    return Array.from({ length: 7 }, (_, i) => ({
      date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'MMM d'),
      users: 0,
    }));
  }
}

// Get average time on page
async function getAverageTimeOnPage() {
  const { sevenDaysAgo } = getDateRanges();
  
  try {
    const events = await db
      .select({
        duration: sql<number>`CAST(${analyticsEvents.metadata}->>'duration' AS INTEGER)`,
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'time_on_page'),
        gte(analyticsEvents.createdAt, sevenDaysAgo),
        sql`${analyticsEvents.metadata}->>'duration' IS NOT NULL`
      ));
    
    const durations = events
      .map(e => e.duration)
      .filter((d): d is number => typeof d === 'number' && d > 0);
    
    const avg = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;
    
    return avg;
  } catch {
    return 0;
  }
}

// Get recent events for timeline
async function getRecentEvents() {
  try {
    const events = await db
      .select({
        id: analyticsEvents.id,
        eventType: analyticsEvents.eventType,
        eventName: analyticsEvents.eventName,
        pageUrl: analyticsEvents.pageUrl,
        metadata: analyticsEvents.metadata,
        createdAt: analyticsEvents.createdAt,
        userId: analyticsEvents.userId,
      })
      .from(analyticsEvents)
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(20);
    
    return events.map(e => ({
      id: e.id,
      type: e.eventType,
      name: e.eventName || e.eventType,
      page: e.pageUrl,
      metadata: e.metadata || {},
      createdAt: e.createdAt,
      userId: e.userId,
    }));
  } catch {
    return [];
  }
}

// Get click stats
async function getClickStats() {
  const { thirtyDaysAgo } = getDateRanges();
  
  try {
    const clicks = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'click'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      ))
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(10);
    
    return clicks.map(c => ({
      element: c.eventName || 'unknown',
      count: c.count,
    }));
  } catch {
    return [];
  }
}

// Get search stats
async function getSearchStats() {
  const { thirtyDaysAgo } = getDateRanges();
  
  try {
    const searches = await db
      .select({
        searchQuery: sql<string>`${analyticsEvents.metadata}->>'searchQuery'`,
        count: count(),
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, 'search'),
        gte(analyticsEvents.createdAt, thirtyDaysAgo),
        sql`${analyticsEvents.metadata}->>'searchQuery' IS NOT NULL`
      ))
      .groupBy(sql`${analyticsEvents.metadata}->>'searchQuery'`)
      .orderBy(desc(count()))
      .limit(10);
    
    return searches
      .filter(s => s.searchQuery)
      .map(s => ({
        query: s.searchQuery as string,
        count: s.count,
      }));
  } catch {
    return [];
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

function getEventTypeColor(type: string) {
  switch (type) {
    case 'page_view':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'click':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'search':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'scroll_depth':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'time_on_page':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default async function AnalyticsPage() {
  const [
    pageViews, 
    userStats, 
    devices, 
    topPages, 
    popularPosts, 
    engagement,
    pageViewTrend,
    userActivityTrend,
    avgTimeOnPage,
    recentEvents,
    clickStats,
    searchStats,
  ] = await Promise.all([
    getPageViewStats(),
    getUserStats(),
    getDeviceBreakdown(),
    getTopPages(),
    getPopularPosts(),
    getEngagementStats(),
    getPageViewTrend(),
    getUserActivityTrend(),
    getAverageTimeOnPage(),
    getRecentEvents(),
    getClickStats(),
    getSearchStats(),
  ]);
  
  // Calculate engagement rate (active users / total users)
  const engagementRate = userStats.total > 0
    ? Math.round((userStats.activeToday / userStats.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Stats Bar - Finance HQ Style */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{pageViews.today}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Views Today</span>
          {pageViews.changePercent !== 0 && (
            <span className={`ml-1.5 text-xs ${pageViews.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pageViews.changePercent > 0 ? '+' : ''}{pageViews.changePercent}%
            </span>
          )}
        </Badge>
        <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <Users className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span className="font-semibold">{userStats.activeToday}</span>
          <span className="ml-1 text-green-600/70 font-normal">Active Users</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{avgTimeOnPage}s</span>
          <span className="ml-1 text-purple-600/70 font-normal">Avg Time</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <Activity className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span className="font-semibold">{engagementRate}%</span>
          <span className="ml-1 text-amber-600/70 font-normal">Engagement</span>
        </Badge>
      </div>

      {/* Trend Charts Row - Finance HQ Style */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Page Views Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Page Views Trend</CardTitle>
            <CardDescription className="text-xs">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {pageViewTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={pageViewTrend}>
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No data yet</p>
            )}
            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>Updated just now</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* User Activity Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">User Activity</CardTitle>
            <CardDescription className="text-xs">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={userActivityTrend}>
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No data yet</p>
            )}
            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>Updated just now</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Engagement Rate</CardTitle>
            <CardDescription className="text-xs">Completion & Bookmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[120px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{engagement.completionRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">Completion Rate</div>
                <div className="text-xs text-muted-foreground mt-2">{engagement.totalBookmarks} Bookmarks</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>Updated just now</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Timeline - Finance HQ Style */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Timeline</CardTitle>
          <CardDescription>Recent user activity events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                {recentEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex-shrink-0 w-48 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1 truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground truncate mb-2">{event.page}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No events yet. Analytics events will appear here once users interact with the platform.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Table - Finance HQ Style */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest analytics events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Event Type</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Page/Element</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        {format(new Date(event.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <span className="truncate max-w-[200px] block">{event.page}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-muted-foreground">
                          {event.type === 'search' && (event.metadata as { searchQuery?: string })?.searchQuery
                            ? `"${(event.metadata as { searchQuery: string }).searchQuery}"`
                            : event.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No activity yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Insights Cards Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Clicked Elements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Clicked Elements</CardTitle>
            <CardDescription className="text-xs">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {clickStats.length > 0 ? (
              <div className="space-y-3">
                {clickStats.slice(0, 5).map((click, index) => (
                  <div key={click.element} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50 w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{click.element}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        {click.count} clicks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No clicks yet</p>
            )}
          </CardContent>
        </Card>

        {/* Popular Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Popular Searches</CardTitle>
            <CardDescription className="text-xs">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {searchStats.length > 0 ? (
              <div className="space-y-3">
                {searchStats.slice(0, 5).map((search, index) => (
                  <div key={search.query} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50 w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">"{search.query}"</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <SearchIcon className="h-3 w-3" />
                        {search.count} searches
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No searches yet</p>
            )}
          </CardContent>
        </Card>

        {/* Scroll Depth Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scroll Depth</CardTitle>
            <CardDescription className="text-xs">Article engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>100% (Complete)</span>
                <span className="text-muted-foreground">{engagement.completedReads}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>75%+</span>
                <span className="text-muted-foreground">{engagement.totalReads}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total Reads</span>
                <span className="text-muted-foreground">{engagement.totalReads}</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">Completion Rate</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{engagement.completionRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights - Device Breakdown & Top Pages */}
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

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.slice(0, 5).map((page, index) => (
                  <div 
                    key={page.pageUrl} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
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
                No page view data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
