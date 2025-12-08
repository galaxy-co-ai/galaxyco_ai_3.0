import { Metadata } from 'next';
import { db } from '@/lib/db';
import { platformFeedback } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import FeedbackList from '@/components/admin/FeedbackList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feedback Hub | Mission Control',
  description: 'Platform feedback and user suggestions',
};

// Get all status counts
async function getStatusCounts() {
  try {
    const [
      allCount,
      newCount,
      inReviewCount,
      plannedCount,
      inProgressCount,
      doneCount,
      closedCount,
      wontFixCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(platformFeedback).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'new')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'in_review')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'planned')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'in_progress')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'done')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'closed')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(platformFeedback).where(eq(platformFeedback.status, 'wont_fix')).then(r => r[0]?.count ?? 0),
    ]);

    return {
      all: allCount,
      new: newCount,
      in_review: inReviewCount,
      planned: plannedCount,
      in_progress: inProgressCount,
      done: doneCount,
      closed: closedCount,
      wont_fix: wontFixCount,
    };
  } catch {
    return {
      all: 0,
      new: 0,
      in_review: 0,
      planned: 0,
      in_progress: 0,
      done: 0,
      closed: 0,
      wont_fix: 0,
    };
  }
}

// Get all feedback
async function getAllFeedback() {
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
      .limit(100);
  } catch {
    return [];
  }
}

export default async function FeedbackHubPage() {
  const [counts, feedback] = await Promise.all([
    getStatusCounts(),
    getAllFeedback(),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback Hub</h1>
        <p className="text-muted-foreground">
          Monitor user feedback and platform suggestions
        </p>
      </div>

      {/* Feedback List with Filters */}
      <FeedbackList 
        initialFeedback={feedback} 
        initialCounts={counts} 
      />
    </div>
  );
}
