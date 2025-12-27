import { Metadata } from 'next';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaigns, marketingChannels } from "@/db/schema";
import { eq, desc, and, count, sum } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketing | GalaxyCo.ai',
  description: 'AI-powered marketing automation and campaign management',
};

export default async function MarketingPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get campaigns from database
    const campaignsList = await db.query.campaigns.findMany({
      where: eq(campaigns.workspaceId, workspaceId),
      orderBy: [desc(campaigns.createdAt)],
      limit: 100,
    });

    // Calculate stats
    const [activeCampaignsCount, totalBudgetStats, totalSpentStats] = await Promise.all([
      db
        .select({ count: count() })
        .from(campaigns)
        .where(and(
          eq(campaigns.workspaceId, workspaceId),
          eq(campaigns.status, 'active')
        )),
      db
        .select({ total: sum(campaigns.budget) })
        .from(campaigns)
        .where(eq(campaigns.workspaceId, workspaceId)),
      db
        .select({ total: sum(campaigns.spent) })
        .from(campaigns)
        .where(eq(campaigns.workspaceId, workspaceId)),
    ]);

    // Fetch marketing channels
    const channelsList = await db.query.marketingChannels.findMany({
      where: eq(marketingChannels.workspaceId, workspaceId),
      orderBy: [desc(marketingChannels.createdAt)],
    });

    // Map campaigns to component format
    const mappedCampaigns = campaignsList.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget || 0,
      spent: campaign.spent || 0,
      impressions: campaign.sentCount || 0, // Using sentCount as impressions proxy
      clicks: campaign.clickCount || 0,
      conversions: campaign.conversionCount || 0,
      roi: campaign.budget && campaign.spent && campaign.conversionCount
        ? Math.round((campaign.conversionCount * 100) / (campaign.spent / campaign.budget))
        : 0,
      startDate: campaign.startDate || campaign.createdAt,
      endDate: campaign.endDate,
      channels: campaign.type ? [campaign.type] : [],
    }));

    // Map channels to component format
    const mappedChannels = channelsList.map((channel) => {
      const clicks = channel.clicks || 0;
      const impressions = channel.impressions || 0;
      // Calculate performance as click-through rate (CTR) percentage
      const performance = impressions > 0 ? Math.round((clicks / impressions) * 100) : 0;

      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        status: channel.status,
        budget: channel.budget || 0,
        performance,
        reach: impressions, // Using impressions as reach
      };
    });

    // Content - placeholder for future content management feature
    const content: {
      id: string;
      title: string;
      type: string;
      status: string;
      views: number;
      engagement: number;
      publishedAt: Date | null;
      author: string;
    }[] = [];

    const stats = {
      activeCampaigns: activeCampaignsCount[0]?.count || 0,
      totalBudget: Number(totalBudgetStats[0]?.total) || 0,
      totalImpressions: campaignsList.reduce((sum, c) => sum + (c.sentCount || 0), 0),
      avgROI: mappedCampaigns.length > 0
        ? Math.round(mappedCampaigns.reduce((sum, c) => sum + c.roi, 0) / mappedCampaigns.length)
        : 0,
    };

    return (
      <ErrorBoundary>
        <MarketingDashboard
          initialCampaigns={mappedCampaigns}
          initialContent={content}
          initialChannels={mappedChannels}
          stats={stats}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error('Marketing page error', error);
    return (
      <ErrorBoundary>
        <MarketingDashboard
          initialCampaigns={[]}
          initialContent={[]}
          initialChannels={[]}
          stats={{ activeCampaigns: 0, totalBudget: 0, totalImpressions: 0, avgROI: 0 }}
        />
      </ErrorBoundary>
    );
  }
}
