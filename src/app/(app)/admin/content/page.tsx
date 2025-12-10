import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { blogPosts, topicIdeas, alertBadges } from "@/db/schema";
import { eq, count, sql, and, isNotNull } from "drizzle-orm";
import { Sparkles, ListOrdered } from "lucide-react"; // Used in Quick Actions section
import { ToolCard, StatsBar } from "@/components/admin/ContentCockpit";
import { AlertBadgePopover } from "@/components/admin/AlertBadges";
import { getCurrentWorkspace } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content Cockpit | Mission Control",
  description: "Central hub for content management tools",
};

// Get workspace-scoped stats
async function getContentStats(workspaceId: string) {
  try {
    // Run queries individually to handle missing tables gracefully
    let publishedCount = 0;
    let queueCount = 0;
    let viewsTotal = 0;
    let alertsCount = 0;

    try {
      const result = await db
        .select({ count: count() })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"));
      publishedCount = result[0]?.count ?? 0;
    } catch {
      // Table may not exist
    }

    try {
      const result = await db
        .select({ count: count() })
        .from(topicIdeas)
        .where(
          and(
            eq(topicIdeas.workspaceId, workspaceId),
            eq(topicIdeas.status, "saved")
          )
        );
      queueCount = result[0]?.count ?? 0;
    } catch {
      // Table may not exist
    }

    try {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${blogPosts.viewCount}), 0)` })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"));
      viewsTotal = Number(result[0]?.total ?? 0);
    } catch {
      // Table may not exist
    }

    try {
      const result = await db
        .select({ count: count() })
        .from(alertBadges)
        .where(
          and(
            eq(alertBadges.workspaceId, workspaceId),
            eq(alertBadges.status, "unread")
          )
        );
      alertsCount = result[0]?.count ?? 0;
    } catch {
      // alertBadges table may not exist in production yet
    }

    return {
      publishedCount,
      queueCount,
      viewsThisMonth: viewsTotal,
      alertsCount,
    };
  } catch {
    return {
      publishedCount: 0,
      queueCount: 0,
      viewsThisMonth: 0,
      alertsCount: 0,
    };
  }
}

// Get tool badge counts
async function getToolCounts(workspaceId: string) {
  let postsCount = 0;
  let hitListCount = 0;
  const sourcesCount = 0; // Sources count will be added in Phase C - placeholder for now

  try {
    const result = await db
      .select({ count: count() })
      .from(blogPosts);
    postsCount = result[0]?.count ?? 0;
  } catch {
    // Table may not exist
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, workspaceId),
          isNotNull(topicIdeas.hitListPosition)
        )
      );
    hitListCount = result[0]?.count ?? 0;
  } catch {
    // Table may not exist
  }

  return { postsCount, hitListCount, sourcesCount };
}

export default async function ContentCockpitPage() {
  // Get current workspace
  const { workspaceId } = await getCurrentWorkspace();

  // Fetch stats and counts in parallel
  const [stats, counts] = await Promise.all([
    getContentStats(workspaceId),
    getToolCounts(workspaceId),
  ]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Content Cockpit
          </h1>
          <p className="text-muted-foreground">
            Your central hub for content creation and management
          </p>
        </div>
        <AlertBadgePopover />
      </div>

      {/* Stats Bar */}
      <StatsBar
        publishedCount={stats.publishedCount}
        queueCount={stats.queueCount}
        viewsThisMonth={stats.viewsThisMonth}
        alertsCount={stats.alertsCount}
      />

      {/* Tools Grid */}
      <section aria-label="Content tools">
        <h2 className="sr-only">Content Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Article Studio */}
          <ToolCard
            iconName="sparkles"
            title="Article Studio"
            description="Create AI-assisted articles with topic generation, outlines, and smart writing tools"
            href="/admin/content/article-studio"
            iconGradient="sparkles"
          />

          {/* Article Hit List */}
          <ToolCard
            iconName="listOrdered"
            title="Article Hit List"
            description="Prioritized queue of topics with AI-calculated priority scores"
            badgeCount={counts.hitListCount}
            badgeColor="indigo"
            href="/admin/content/hit-list"
            iconGradient="listOrdered"
          />

          {/* Sources Hub */}
          <ToolCard
            iconName="bookOpen"
            title="Sources Hub"
            description="Bookmarked research sites and AI-suggested sources"
            badgeCount={counts.sourcesCount > 0 ? counts.sourcesCount : undefined}
            badgeColor="green"
            href="/admin/content/sources"
            iconGradient="bookOpen"
          />

          {/* Use Case Studio */}
          <ToolCard
            iconName="route"
            title="Use Case Studio"
            description="Create tailored roadmaps and onboarding flows for different user personas"
            href="/admin/content/use-cases"
            iconGradient="route"
          />

          {/* Article Analytics */}
          <ToolCard
            iconName="barChart"
            title="Article Analytics"
            description="Performance insights, engagement metrics, and AI recommendations"
            href="/admin/content/analytics"
            iconGradient="barChart"
          />

          {/* All Posts */}
          <ToolCard
            iconName="fileText"
            title="All Posts"
            description="Browse and manage all published and draft articles"
            badgeCount={counts.postsCount}
            badgeColor="blue"
            href="/admin/content/posts"
            iconGradient="fileText"
          />
        </div>
      </section>

      {/* Quick Actions / Getting Started */}
      <section
        className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6"
        aria-label="Quick start guide"
      >
        <div className="text-center max-w-lg mx-auto">
          <h3 className="font-semibold text-gray-900 mb-2">
            Ready to create content?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Start with the Article Studio to brainstorm topics, or check your
            Hit List for AI-prioritized article ideas.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/admin/content/article-studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium text-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Open Article Studio
            </Link>
            <Link
              href="/admin/content/hit-list"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 font-medium text-sm border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <ListOrdered className="h-4 w-4" aria-hidden="true" />
              View Hit List
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
