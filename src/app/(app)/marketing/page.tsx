import { Metadata } from 'next';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaigns } from "@/db/schema";
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

    // Content and channels - TODO: Add schemas for these
    const content: any[] = [];
    const channels: any[] = [];

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
          initialChannels={channels}
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
