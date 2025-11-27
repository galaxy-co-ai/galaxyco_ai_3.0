import { task } from "@trigger.dev/sdk/v3";
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
 * Schedules a campaign to be sent at a specific time
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

    // Schedule the send task
    const sendTime = new Date(scheduledFor);
    const delayMs = Math.max(0, sendTime.getTime() - Date.now());

    if (delayMs > 0) {
      // Use Trigger.dev's delay capability
      await sendCampaignTask.trigger(
        { campaignId, workspaceId },
        { delay: `${Math.floor(delayMs / 1000)}s` }
      );
    } else {
      // Send immediately if scheduled time has passed
      await sendCampaignTask.trigger({ campaignId, workspaceId });
    }

    logger.info("Campaign scheduled", {
      campaignId,
      scheduledFor,
      workspaceId,
    });

    return { success: true, campaignId, scheduledFor };
  },
});

