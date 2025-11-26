import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts, customers, prospects } from "@/db/schema";
import { eq, desc, sql, count, and, gte, sum } from "drizzle-orm";
import CRMDashboard from "@/components/crm/CRMDashboard";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default async function CRMPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const [leads, organizations, contactsList] = await Promise.all([
      db.query.prospects.findMany({
        where: eq(prospects.workspaceId, workspaceId),
        orderBy: [desc(prospects.createdAt)],
        limit: 100,
      }),
      db.query.customers.findMany({
        where: eq(customers.workspaceId, workspaceId),
        orderBy: [desc(customers.createdAt)],
        limit: 100,
      }),
      db.query.contacts.findMany({
        where: eq(contacts.workspaceId, workspaceId),
        orderBy: [desc(contacts.createdAt)],
        limit: 100,
      }),
    ]);

    // Get deals from prospects (same as leads but for deals tab)
    const deals = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
      orderBy: [desc(prospects.createdAt)],
      limit: 100,
    });

    // Get stats
    const [leadStats, orgStats, valueStats, hotLeadStats] = await Promise.all([
      db
        .select({ count: count() })
        .from(prospects)
        .where(eq(prospects.workspaceId, workspaceId)),
      db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.workspaceId, workspaceId)),
      db
        .select({ total: sum(prospects.estimatedValue) })
        .from(prospects)
        .where(eq(prospects.workspaceId, workspaceId)),
      db
        .select({ count: count() })
        .from(prospects)
        .where(and(eq(prospects.workspaceId, workspaceId), gte(prospects.score, 70))),
    ]);

    const stats = {
      totalLeads: leadStats[0]?.count || 0,
      hotLeads: hotLeadStats[0]?.count || 0,
      totalOrgs: orgStats[0]?.count || 0,
      totalValue: Number(valueStats[0]?.total) || 0,
    };

    return (
      <ErrorBoundary>
        <CRMDashboard
          initialLeads={leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email || "",
          company: lead.company || "",
          title: lead.title || "",
          phone: lead.phone || "",
          stage: lead.stage,
          score: lead.score || 0,
          estimatedValue: lead.estimatedValue || 0,
          lastContactedAt: lead.lastContactedAt,
          nextFollowUpAt: lead.nextFollowUpAt,
          interactionCount: lead.interactionCount || 0,
          source: lead.source || "",
          tags: lead.tags || [],
          notes: lead.notes || "",
        }))}
        initialOrganizations={organizations.map((org) => ({
          id: org.id,
          name: org.name,
          email: org.email || "",
          company: org.company || "",
          phone: org.phone || "",
          website: org.website || "",
          status: org.status,
          industry: org.industry || "",
          size: org.size || "",
          revenue: org.revenue || 0,
          tags: org.tags || [],
          notes: org.notes || "",
          lastContactedAt: org.lastContactedAt,
        }))}
        initialContacts={contactsList.map((contact) => ({
          id: contact.id,
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.email,
          company: contact.company || "",
          title: contact.title || "",
          phone: contact.phone || "",
          tags: contact.tags || [],
        }))}
        initialDeals={deals.map((deal) => ({
          id: deal.id,
          title: deal.name,
          company: deal.company || "",
          value: deal.estimatedValue || 0,
          stage: deal.stage === 'won' ? 'closed' : deal.stage === 'lost' ? 'lost' : deal.stage,
          probability: deal.score || 0,
          closeDate: deal.nextFollowUpAt,
          source: deal.source || "",
          tags: deal.tags || [],
          notes: deal.notes || "",
        }))}
        stats={{
          totalLeads: stats.totalLeads,
          hotLeads: stats.hotLeads,
          totalOrgs: stats.totalOrgs,
          totalValue: stats.totalValue,
        }}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error("CRM page error", error);
    return (
      <ErrorBoundary>
        <CRMDashboard
          initialLeads={[]}
          initialOrganizations={[]}
          initialContacts={[]}
          initialDeals={[]}
          stats={{ totalLeads: 0, hotLeads: 0, totalOrgs: 0, totalValue: 0 }}
        />
      </ErrorBoundary>
    );
  }
}
