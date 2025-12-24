import { task, wait } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { campaigns, prospects, contacts } from "@/db/schema";
import { eq, and, or, ne } from "drizzle-orm";
import { 
  sendBulkEmails, 
  isEmailConfigured, 
  getCampaignEmailTemplate,
  type EmailOptions 
} from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Send Campaign Task
 * Sends an email campaign to its target audience
 */
export const sendCampaignTask = task({
  id: "send-campaign",
  retry: {
    maxAttempts: 2,
  },
  // Note: Idempotency is handled at trigger time with campaign-specific keys
  run: async (payload: { campaignId: string; workspaceId: string }) => {
    const { campaignId, workspaceId } = payload;

    if (!isEmailConfigured()) {
      return { success: false, error: "Email service not configured" };
    }

    // Get the campaign
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, workspaceId)
      ),
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    if (campaign.status === "completed") {
      return { success: false, error: "Campaign already sent" };
    }

    // Update status to active (sending)
    await db
      .update(campaigns)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    // Get campaign content
    const content = campaign.content as {
      subject?: string;
      body?: string;
    };

    if (!content.subject || !content.body) {
      await db
        .update(campaigns)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      return { success: false, error: "Campaign missing subject or body" };
    }

    // Get recipients based on target audience
    const recipients: Array<{ email: string; name: string }> = [];
    const targetAudience = campaign.tags?.[0] || "all_leads";

    if (
      targetAudience === "all_leads" ||
      targetAudience === "new_leads" ||
      targetAudience === "qualified_leads"
    ) {
      const prospectConditions = [
        eq(prospects.workspaceId, workspaceId),
        ne(prospects.email, ""),
      ];

      if (targetAudience === "new_leads") {
        prospectConditions.push(eq(prospects.stage, "new"));
      } else if (targetAudience === "qualified_leads") {
        prospectConditions.push(
          or(
            eq(prospects.stage, "qualified"),
            eq(prospects.stage, "proposal"),
            eq(prospects.stage, "negotiation")
          )!
        );
      }

      const prospectList = await db.query.prospects.findMany({
        where: and(...prospectConditions),
        columns: { email: true, name: true },
      });

      for (const p of prospectList) {
        if (p.email) {
          recipients.push({ email: p.email, name: p.name });
        }
      }
    } else if (targetAudience === "all_contacts") {
      const contactList = await db.query.contacts.findMany({
        where: eq(contacts.workspaceId, workspaceId),
        columns: { email: true, firstName: true, lastName: true },
      });

      for (const c of contactList) {
        if (c.email) {
          const name =
            [c.firstName, c.lastName].filter(Boolean).join(" ") || "there";
          recipients.push({ email: c.email, name });
        }
      }
    }

    if (recipients.length === 0) {
      await db
        .update(campaigns)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      return { success: false, error: "No recipients found" };
    }

    // Limit recipients for safety
    const maxRecipients = 1000;
    const limitedRecipients = recipients.slice(0, maxRecipients);

    // Build email template
    const template = getCampaignEmailTemplate(
      content.subject,
      content.subject,
      content.body
    );

    // Build email list
    const emails: EmailOptions[] = limitedRecipients.map((recipient) => ({
      to: recipient.email,
      subject: template.subject,
      html: template.html.replace(/Hi there/g, `Hi ${recipient.name}`),
      text: template.text?.replace(/Hi there/g, `Hi ${recipient.name}`),
      tags: [
        { name: "campaign_id", value: campaignId },
        { name: "campaign_name", value: campaign.name },
        { name: "workspace", value: workspaceId },
      ],
    }));

    logger.info("Starting campaign send via background job", {
      campaignId,
      recipientCount: emails.length,
      workspaceId,
    });

    // Send emails in bulk
    const result = await sendBulkEmails(emails, 10, 200);

    // Update campaign stats
    await db
      .update(campaigns)
      .set({
        status: "completed",
        sentCount: result.sent,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    logger.info("Campaign send completed via background job", {
      campaignId,
      sent: result.sent,
      failed: result.failed,
      workspaceId,
    });

    return {
      success: true,
      campaignId,
      sent: result.sent,
      failed: result.failed,
      total: emails.length,
    };
  },
});

/**
 * Schedule Campaign Task
 * Schedules a campaign to be sent at a specific time using wait.until()
 */
export const scheduleCampaignTask = task({
  id: "schedule-campaign",
  run: async (payload: {
    campaignId: string;
    workspaceId: string;
    scheduledFor: string;
  }) => {
    const { campaignId, workspaceId, scheduledFor } = payload;

    // Update campaign status to scheduled
    await db
      .update(campaigns)
      .set({
        status: "scheduled",
        scheduledFor: new Date(scheduledFor),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, workspaceId)
        )
      );

    const sendTime = new Date(scheduledFor);

    // If scheduled time is in the future, wait until then
    if (sendTime.getTime() > Date.now()) {
      logger.info("Waiting until scheduled time", {
        campaignId,
        scheduledFor,
        workspaceId,
      });

      // Use wait.until() to pause task execution until the scheduled time
      await wait.until({
        date: sendTime,
        throwIfInThePast: false, // Don't throw if time has passed, just continue
      });
    }

    // Re-fetch campaign to ensure it wasn't cancelled while waiting
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, workspaceId)
      ),
    });

    if (!campaign || campaign.status === "completed" || campaign.status === "paused") {
      logger.info("Campaign was cancelled or already sent", {
        campaignId,
        status: campaign?.status,
      });
      return { success: false, error: "Campaign was cancelled or already sent" };
    }

    // Now trigger the actual send with idempotency
    const handle = await sendCampaignTask.triggerAndWait(
      { campaignId, workspaceId },
      {
        idempotencyKey: `campaign-${campaignId}-send`,
        idempotencyKeyTTL: "24h",
        tags: [`workspace:${workspaceId}`, `campaign:${campaignId}`, "type:campaign-send"],
      }
    );

    logger.info("Campaign scheduled send completed", {
      campaignId,
      scheduledFor,
      workspaceId,
      result: handle.ok ? "success" : "failed",
    });

    return handle.ok
      ? { success: true, campaignId, scheduledFor, result: handle.output }
      : { success: false, error: handle.error };
  },
});

