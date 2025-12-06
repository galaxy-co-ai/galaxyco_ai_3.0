import { Metadata } from 'next';
import { db } from '@/lib/db';
import { platformFeedback, users } from '@/db/schema';
import { desc, eq, count, and, gte } from 'drizzle-orm';
import { 
  MessageSquareWarning, 
  Bug, 
  Lightbulb, 
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feedback Hub | Mission Control',
  description: 'Platform feedback and user suggestions',
};

// Get feedback stats
async function getFeedbackStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalCount,
      newCount,
      bugCount,
      suggestionCount,
      positiveCount,
      negativeCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(platformFeedback).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'new')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.type, 'bug')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.type, 'suggestion')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(
        and(
          eq(platformFeedback.sentiment, 'positive'),
          gte(platformFeedback.createdAt, sevenDaysAgo)
        )
      ).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(
        and(
          eq(platformFeedback.sentiment, 'negative'),
          gte(platformFeedback.createdAt, sevenDaysAgo)
        )
      ).then(r => r[0]?.count ?? 0),
    ]);

    return {
      total: totalCount,
      new: newCount,
      bugs: bugCount,
      suggestions: suggestionCount,
      positiveThisWeek: positiveCount,
      negativeThisWeek: negativeCount,
    };
  } catch {
    return {
      total: 0,
      new: 0,
      bugs: 0,
      suggestions: 0,
      positiveThisWeek: 0,
      negativeThisWeek: 0,
    };
  }
}

// Get recent feedback
async function getRecentFeedback() {
  try {
    return await db
      .select({
        id: platformFeedback.id,
        type: platformFeedback.type,
        sentiment: platformFeedback.sentiment,
        title: platformFeedback.title,
        content: platformFeedback.content,
        pageUrl: platformFeedback.pageUrl,
        featureArea: platformFeedback.featureArea,
        status: platformFeedback.status,
        createdAt: platformFeedback.createdAt,
        userEmail: platformFeedback.userEmail,
      })
      .from(platformFeedback)
      .orderBy(desc(platformFeedback.createdAt))
      .limit(20);
  } catch {
    return [];
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'bug':
      return <Bug className="h-4 w-4 text-red-500" />;
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-amber-500" />;
    case 'feature_request':
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    default:
      return <MessageCircle className="h-4 w-4 text-zinc-500" />;
  }
}

function getSentimentIcon(sentiment: string | null) {
  switch (sentiment) {
    case 'very_positive':
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'negative':
    case 'very_negative':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-zinc-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'new':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
    case 'in_review':
      return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">In Review</Badge>;
    case 'planned':
      return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Planned</Badge>;
    case 'in_progress':
      return <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">In Progress</Badge>;
    case 'done':
      return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Done</Badge>;
    case 'closed':
      return <Badge variant="secondary" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function FeedbackHubPage() {
  const [stats, feedback] = await Promise.all([
    getFeedbackStats(),
    getRecentFeedback(),
  ]);

  const sentimentScore = stats.positiveThisWeek - stats.negativeThisWeek;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback Hub</h1>
        <p className="text-muted-foreground">
          Monitor user feedback and platform suggestions
        </p>
      </div>

      {/* Stats Bar - Centered badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <MessageSquareWarning className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{stats.total}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Total</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span className="font-semibold">{stats.new}</span>
          <span className="ml-1 text-amber-600/70 font-normal">New</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
          <Bug className="h-3.5 w-3.5 mr-1.5 text-red-600" />
          <span className="font-semibold">{stats.bugs}</span>
          <span className="ml-1 text-red-600/70 font-normal">Bugs</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{stats.suggestions}</span>
          <span className="ml-1 text-purple-600/70 font-normal">Suggestions</span>
        </Badge>
        <Badge className={`px-3 py-1.5 border transition-colors ${
          sentimentScore > 0 
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
            : sentimentScore < 0 
            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
        }`}>
          {sentimentScore > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          ) : sentimentScore < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 mr-1.5 text-red-600" />
          ) : (
            <Minus className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
          )}
          <span className="font-semibold">{sentimentScore > 0 ? '+' : ''}{sentimentScore}</span>
          <span className={`ml-1 font-normal ${
            sentimentScore > 0 ? 'text-green-600/70' : sentimentScore < 0 ? 'text-red-600/70' : 'text-zinc-600/70'
          }`}>Sentiment</span>
        </Badge>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            {feedback.length > 0 
              ? `Showing ${feedback.length} most recent items` 
              : 'No feedback yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length > 0 ? (
            <div className="divide-y">
              {feedback.map((item) => (
                <div key={item.id} className="py-4 flex items-start gap-4">
                  <div className="mt-1">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} feedback`}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {item.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment?.replace('_', ' ') || 'No sentiment'}
                      </span>
                      <span>📍 {item.featureArea || 'General'}</span>
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      {item.userEmail && (
                        <span className="truncate max-w-32">{item.userEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No feedback yet</h3>
              <p className="text-muted-foreground">
                Feedback will appear here when users submit it via the floating button.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
