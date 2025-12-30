/**
 * Marketing Tool Implementations
 */
import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { prospects, campaigns, tasks } from '@/db/schema';
import { and, eq, desc, like, or, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const marketingToolImplementations: ToolImplementations = {
  async create_campaign(args, context) {
    try {
      const [campaign] = await db
        .insert(campaigns)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          type: (args.type as string) || 'email',
          status: 'draft',
          content: {
            subject: (args.subject as string) || undefined,
            body: (args.content as string) || undefined,
          },
          createdBy: context.userId,
        })
        .returning();

      logger.info('AI created campaign', { campaignId: campaign.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created campaign "${campaign.name}" successfully. It's saved as a draft.`,
        data: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
        },
        suggestedNextStep: {
          action: 'add_contacts_to_campaign',
          reason: 'Campaigns need an audience to be effective',
          prompt: 'Want to select contacts for this campaign?',
          autoSuggest: true,
        },
      };
    } catch (error) {
      logger.error('AI create_campaign failed', error);
      return {
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async update_campaign_roadmap(args, context) {
    try {
      const action = args.action as 'add' | 'complete' | 'replace';
      const items = args.items as Array<{ id: string; title: string; description?: string; value?: string }>;

      let message = '';
      if (action === 'replace') {
        message = `Built roadmap with ${items.length} item(s)`;
      } else if (action === 'add') {
        message = `Added ${items.length} item(s) to roadmap`;
      } else if (action === 'complete') {
        const completedItems = items.filter(item => item.title);
        message = `Completed: ${completedItems.map(item => item.title).join(', ')}`;
      }

      return {
        success: true,
        message,
        data: {
          action,
          items,
          // Flag for client-side to dispatch event
          dispatchEvent: 'campaign-roadmap-update',
        },
      };
    } catch (error) {
      logger.error('AI update_campaign_roadmap failed', error);
      return {
        success: false,
        message: 'Failed to update roadmap',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async launch_campaign(args, context) {
    try {
      // Create the campaign in the database
      const [campaign] = await db
        .insert(campaigns)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          type: (args.type as string) || 'email',
          status: 'draft',
          content: args.content as {
            subject?: string;
            body?: string;
            images?: string[];
            links?: Array<{ url: string; label: string }>;
          } || {},
          targetAudience: args.targetAudience as Record<string, unknown> || {},
          scheduledFor: args.scheduledFor ? new Date(args.scheduledFor as string) : null,
          budget: args.budget ? Math.round((args.budget as number) * 100) : null, // Convert to cents
          createdBy: context.userId,
        })
        .returning();

      logger.info('AI launched campaign', { campaignId: campaign.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Campaign "${campaign.name}" created successfully! It's now in your Campaigns tab.`,
        data: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          // Flag for client-side to dispatch event
          dispatchEvent: 'campaign-launch',
          campaignData: {
            name: campaign.name,
            type: campaign.type,
            content: campaign.content,
            targetAudience: campaign.targetAudience,
            scheduledFor: campaign.scheduledFor?.toISOString(),
            budget: campaign.budget ? campaign.budget / 100 : undefined,
          },
        },
      };
    } catch (error) {
      logger.error('AI launch_campaign failed', error);
      return {
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async update_dashboard_roadmap(args, context) {
    try {
      const action = args.action as 'add' | 'complete' | 'replace';
      const items = args.items as Array<{ id: string; title: string; description?: string; value?: string }>;

      let message = '';
      if (action === 'replace') {
        message = `Built roadmap with ${items.length} item(s)`;
      } else if (action === 'add') {
        message = `Added ${items.length} item(s) to roadmap`;
      } else if (action === 'complete') {
        const completedItems = items.filter(item => item.title);
        message = `Completed: ${completedItems.map(item => item.title).join(', ')}`;
      }

      logger.info('AI update_dashboard_roadmap', { action, itemCount: items.length, workspaceId: context.workspaceId });

      return {
        success: true,
        message,
        data: {
          action,
          items,
          // Flag for client-side to dispatch event
          dispatchEvent: 'dashboard-roadmap-update',
        },
        suggestedNextStep: {
          action: 'complete_next_milestone',
          reason: 'Progress is made by tackling the next milestone',
          prompt: 'Ready to work on the next item in your roadmap?',
          autoSuggest: true,
        },
      };
    } catch (error) {
      logger.error('AI update_dashboard_roadmap failed', error);
      return {
        success: false,
        message: 'Failed to update roadmap',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_campaign_stats(args, context) {
    try {
      const campaignId = args.campaignId as string | undefined;

      const conditions = [eq(campaigns.workspaceId, context.workspaceId)];
      if (campaignId) {
        conditions.push(eq(campaigns.id, campaignId));
      }

      const campaignList = await db.query.campaigns.findMany({
        where: and(...conditions),
        orderBy: [desc(campaigns.updatedAt)],
        limit: 10,
      });

      const stats = campaignList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        sent: c.sentCount || 0,
        opened: c.openCount || 0,
        clicked: c.clickCount || 0,
        openRate: c.sentCount ? ((c.openCount || 0) / c.sentCount * 100).toFixed(1) + '%' : '0%',
        clickRate: c.openCount ? ((c.clickCount || 0) / c.openCount * 100).toFixed(1) + '%' : '0%',
      }));

      return {
        success: true,
        message: `Retrieved stats for ${stats.length} campaign(s)`,
        data: { campaigns: stats },
      };
    } catch (error) {
      logger.error('AI get_campaign_stats failed', error);
      return {
        success: false,
        message: 'Failed to get campaign stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async send_email(args, context) {
    try {
      const { sendEmail, isEmailConfigured, textToHtml, isValidEmail } = await import('@/lib/email');

      const to = args.to as string;
      const subject = args.subject as string;
      const body = args.body as string;
      const leadId = args.leadId as string | undefined;

      // Validate email address
      if (!isValidEmail(to)) {
        return {
          success: false,
          message: `Invalid email address: ${to}`,
        };
      }

      // Check if email service is configured
      if (!isEmailConfigured()) {
        logger.warn('AI send_email - Resend not configured', {
          to,
          subject,
          workspaceId: context.workspaceId,
        });
        return {
          success: false,
          message: 'Email service is not configured. Please add RESEND_API_KEY to your environment.',
          data: {
            to,
            subject,
            status: 'not_configured',
          },
        };
      }

      // Send the email
      const result = await sendEmail({
        to,
        subject,
        html: textToHtml(body),
        text: body,
        replyTo: context.userEmail,
        tags: [
          { name: 'source', value: 'neptune_ai' },
          { name: 'workspace', value: context.workspaceId },
          ...(leadId ? [{ name: 'lead_id', value: leadId }] : []),
        ],
      });

      if (result.success) {
        logger.info('AI sent email successfully', {
          to,
          subject,
          messageId: result.messageId,
          workspaceId: context.workspaceId,
        });

        // Update lead's last contacted time if leadId provided
        if (leadId) {
          try {
            await db
              .update(prospects)
              .set({
                lastContactedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(and(
                eq(prospects.id, leadId),
                eq(prospects.workspaceId, context.workspaceId)
              ));
          } catch (updateError) {
            logger.warn('Failed to update lead lastContactedAt', {
              leadId,
              error: updateError,
            });
          }
        }

        return {
          success: true,
          message: `Email sent successfully to ${to}`,
          data: {
            to,
            subject,
            messageId: result.messageId,
            status: 'sent',
          },
        };
      } else {
        logger.error('AI send_email failed', {
          to,
          subject,
          error: result.error,
        });
        return {
          success: false,
          message: `Failed to send email: ${result.error}`,
          data: {
            to,
            subject,
            status: 'failed',
          },
        };
      }
    } catch (error) {
      logger.error('AI send_email failed', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async analyze_lead_for_campaign(args, context) {
    try {
      const leadId = args.leadId as string;

      // Get lead details
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Get available campaigns
      const availableCampaigns = await db.query.campaigns.findMany({
        where: and(
          eq(campaigns.workspaceId, context.workspaceId),
          eq(campaigns.status, 'active')
        ),
        limit: 10,
      });

      // Score compatibility (simplified - in production would use ML or more sophisticated matching)
      const recommendations = availableCampaigns.map((campaign) => {
        let score = 50; // Base score

        // Increase score based on lead stage matching campaign type
        if (lead.stage === 'qualified' && campaign.type === 'email') score += 20;
        if (lead.stage === 'proposal' && campaign.type === 'ads') score += 15;

        // Industry/company matching would go here
        if (lead.company) score += 10;

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignType: campaign.type,
          compatibilityScore: Math.min(100, score),
          reason: `Lead stage "${lead.stage}" matches ${campaign.type} campaign type`,
        };
      }).sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);

      return {
        success: true,
        message: `Analyzed lead "${lead.name}" for campaign matching. Found ${recommendations.length} recommended campaigns.`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          leadStage: lead.stage,
          recommendations,
        },
      };
    } catch (error) {
      logger.error('AI analyze_lead_for_campaign failed', error);
      return {
        success: false,
        message: 'Failed to analyze lead for campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async suggest_next_marketing_action(args, context) {
    try {
      const leadId = args.leadId as string;

      // Get lead details
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Determine next action based on lead stage
      let nextAction: string;
      let actionType: string;
      let urgency: string;

      switch (lead.stage) {
        case 'new':
          nextAction = 'Send welcome email with value proposition';
          actionType = 'email';
          urgency = 'high';
          break;
        case 'contacted':
          nextAction = 'Follow up with case study or demo offer';
          actionType = 'email';
          urgency = 'medium';
          break;
        case 'qualified':
          nextAction = 'Send proposal or pricing information';
          actionType = 'email';
          urgency = 'high';
          break;
        case 'proposal':
          nextAction = 'Schedule a call to address questions';
          actionType = 'calendar';
          urgency = 'high';
          break;
        case 'negotiation':
          nextAction = 'Send final offer or contract';
          actionType = 'email';
          urgency = 'urgent';
          break;
        default:
          nextAction = 'Re-engage with personalized content';
          actionType = 'email';
          urgency = 'medium';
      }

      return {
        success: true,
        message: `Next marketing action for "${lead.name}": ${nextAction}`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          leadStage: lead.stage,
          nextAction,
          actionType,
          urgency,
          suggestedTiming: urgency === 'urgent' ? 'Today' : urgency === 'high' ? 'This week' : 'Next week',
        },
      };
    } catch (error) {
      logger.error('AI suggest_next_marketing_action failed', error);
      return {
        success: false,
        message: 'Failed to suggest next marketing action',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async score_campaign_effectiveness(args, context) {
    try {
      const campaignId = args.campaignId as string;

      // Get campaign details
      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, context.workspaceId)
        ),
      });

      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found',
          error: 'Campaign ID does not exist',
        };
      }

      // Calculate metrics
      const sentCount = campaign.sentCount || 0;
      const openCount = campaign.openCount || 0;
      const clickCount = campaign.clickCount || 0;
      const conversionCount = campaign.conversionCount || 0;

      const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
      const clickRate = sentCount > 0 ? (clickCount / sentCount) * 100 : 0;
      const conversionRate = sentCount > 0 ? (conversionCount / sentCount) * 100 : 0;

      // Industry benchmarks (simplified - in production would use real benchmarks)
      const industryBenchmarks = {
        email: { openRate: 21, clickRate: 2.6 },
        social: { openRate: 5, clickRate: 1.5 },
        ads: { openRate: 2, clickRate: 0.5 },
      };

      const benchmark = industryBenchmarks[campaign.type as keyof typeof industryBenchmarks] || industryBenchmarks.email;

      // Compare to benchmarks
      const openRateVsBenchmark = openRate - benchmark.openRate;
      const clickRateVsBenchmark = clickRate - benchmark.clickRate;

      // Generate recommendations
      const recommendations: string[] = [];
      if (openRate < benchmark.openRate) {
        recommendations.push(`Open rate (${openRate.toFixed(1)}%) is below industry average (${benchmark.openRate}%). Test different subject lines.`);
      }
      if (clickRate < benchmark.clickRate) {
        recommendations.push(`Click rate (${clickRate.toFixed(1)}%) is below industry average (${benchmark.clickRate}%). Improve CTA clarity and placement.`);
      }
      if (sentCount < 100) {
        recommendations.push('Campaign has low send volume. Consider expanding audience or running longer.');
      }

      // A/B test suggestions
      const abTestSuggestions = [
        'Test subject line variations (personalization vs. urgency)',
        'Test CTA button text (e.g., "Get Started" vs. "Try Free")',
        'Test send times (morning vs. afternoon)',
        'Test content length (short vs. detailed)',
      ];

      return {
        success: true,
        message: `Campaign "${campaign.name}" analysis complete. ${openRate >= benchmark.openRate ? 'Open rate is good.' : 'Open rate needs improvement.'}`,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          metrics: {
            sentCount,
            openCount,
            clickCount,
            conversionCount,
            openRate: openRate.toFixed(1),
            clickRate: clickRate.toFixed(1),
            conversionRate: conversionRate.toFixed(1),
          },
          benchmarks: {
            openRate: benchmark.openRate,
            clickRate: benchmark.clickRate,
          },
          performance: {
            openRateVsBenchmark: openRateVsBenchmark.toFixed(1),
            clickRateVsBenchmark: clickRateVsBenchmark.toFixed(1),
            overallScore: openRate >= benchmark.openRate && clickRate >= benchmark.clickRate ? 'good' : 'needs_improvement',
          },
          recommendations,
          abTestSuggestions,
        },
      };
    } catch (error) {
      logger.error('AI score_campaign_effectiveness failed', error);
      return {
        success: false,
        message: 'Failed to score campaign effectiveness',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async auto_qualify_lead(args, context) {
    try {
      const leadId = args.leadId as string;
      const emailTemplate = (args.emailTemplate as string) || undefined;

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Create BANT qualification email template
      const bantTemplate = emailTemplate || `Hi ${lead.name || 'there'},

I'd love to learn more about your needs. Could you help me understand:

1. Budget: What budget range are you considering for this solution?
2. Authority: Who else is involved in the decision-making process?
3. Need: What's the primary challenge you're trying to solve?
4. Timeline: When are you looking to implement a solution?

Looking forward to your response!`;

      // Create draft task for follow-up
      await db.insert(tasks).values({
        workspaceId: context.workspaceId,
        createdBy: context.userId,
        title: `Follow up: ${lead.name} - Qualification`,
        description: 'Follow up on BANT qualification questions',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'todo',
        priority: 'medium',
        assignedTo: context.userId,
      });

      return {
        success: true,
        message: `Created qualification email draft for ${lead.name}. Follow-up task scheduled for 3 days.`,
        data: {
          leadId: lead.id,
          emailDraft: bantTemplate,
          followUpTaskCreated: true,
        },
      };
    } catch (error) {
      logger.error('AI auto_qualify_lead failed', error);
      return {
        success: false,
        message: 'Failed to create qualification sequence',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async create_follow_up_sequence(args, context) {
    try {
      const leadId = args.leadId as string;
      const sequenceType = (args.sequenceType as string) || 'nurture';
      const startDate = args.startDate ? new Date(args.startDate as string) : new Date();

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Define sequence spacing based on type
      const spacing = sequenceType === 'sales'
        ? [1, 3, 7, 14, 30] // More aggressive for sales
        : sequenceType === 'nurture'
        ? [2, 5, 10, 20, 45] // Gentler for nurture
        : [3, 7, 14, 30, 60]; // Default custom

      const taskValues = [];
      for (let i = 0; i < spacing.length; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + spacing[i]);

        taskValues.push({
          workspaceId: context.workspaceId,
          createdBy: context.userId,
          title: `Follow-up ${i + 1}: ${lead.name}`,
          description: `Follow-up task for ${lead.company || lead.name} - Day ${spacing[i]}`,
          dueDate,
          status: 'todo' as const,
          priority: i === 0 ? 'high' as const : 'medium' as const,
          assignedTo: context.userId,
        });
      }

      await db.insert(tasks).values(taskValues);

      return {
        success: true,
        message: `Created ${spacing.length}-step follow-up sequence for ${lead.name}. Tasks scheduled with smart spacing.`,
        data: {
          leadId: lead.id,
          sequenceType,
          tasksCreated: spacing.length,
          spacing,
        },
      };
    } catch (error) {
      logger.error('AI create_follow_up_sequence failed', error);
      return {
        success: false,
        message: 'Failed to create follow-up sequence',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async optimize_campaign(args, context) {
    try {
      const campaignId = args.campaignId as string;
      const testType = args.testType as string;
      const variations = (args.variations as string[]) || [];

      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, context.workspaceId)
        ),
      });

      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found',
          error: 'Campaign ID does not exist',
        };
      }

      // Generate test variations if not provided
      let testVariations = variations;
      const campaignSubject = campaign.content?.subject || campaign.name;
      const campaignBody = campaign.content?.body || '';

      if (testVariations.length === 0) {
        if (testType === 'subject') {
          testVariations = [
            `${campaignSubject} - Quick question`,
            `${campaignSubject} - Exclusive offer`,
            `Re: ${campaignSubject}`,
          ];
        } else if (testType === 'cta') {
          testVariations = ['Get Started', 'Learn More', 'Try Now'];
        } else if (testType === 'content') {
          // Generate content variations using AI
          const { getOpenAI } = await import('@/lib/ai-providers');
          const openai = getOpenAI();

          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Generate 3 variations of the following content. Return as JSON array of strings.',
              },
              {
                role: 'user',
                content: `Generate 3 variations of this email body:\n\n${campaignBody}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: 'json_object' },
          });

          try {
            const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
            testVariations = parsed.variations || ['Variation A', 'Variation B', 'Variation C'];
          } catch {
            testVariations = ['Variation A', 'Variation B', 'Variation C'];
          }
        } else {
          testVariations = ['Variation A', 'Variation B', 'Variation C'];
        }
      }

      // Store A/B test data in campaign content or tags
      // Since campaigns table doesn't have metadata field, we'll store in tags and update content
      const existingTags = campaign.tags || [];
      const abTestTag = `ab-test:${testType}`;
      const updatedTags = existingTags.includes(abTestTag)
        ? existingTags
        : [...existingTags, abTestTag];

      // Store variations in campaign content as JSON
      // Cast to extended type to allow abTests property
      const existingContent = (campaign.content || {}) as Record<string, unknown>;
      const abTests = (existingContent.abTests as Array<{
        testType: string;
        variations: string[];
        createdAt: string;
        status: string;
      }>) || [];

      abTests.push({
        testType,
        variations: testVariations,
        createdAt: new Date().toISOString(),
        status: 'draft',
      });

      // Update campaign with A/B test data
      await db
        .update(campaigns)
        .set({
          content: {
            ...existingContent,
            abTests,
          } as typeof campaign.content,
          tags: updatedTags,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));

      logger.info('AI optimize_campaign', {
        campaignId,
        testType,
        variationsCount: testVariations.length,
        workspaceId: context.workspaceId,
      });

      return {
        success: true,
        message: `Generated ${testVariations.length} ${testType} variations for A/B testing. Variations saved to campaign.`,
        data: {
          campaignId: campaign.id,
          testType,
          variations: testVariations,
          recommendation: 'Test all variations with equal distribution, then scale the winner.',
          savedToCampaign: true,
        },
      };
    } catch (error) {
      logger.error('AI optimize_campaign failed', error);
      return {
        success: false,
        message: 'Failed to optimize campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async segment_audience(args, context) {
    try {
      const criteria = args.criteria as Record<string, unknown>;
      const segmentName = args.segmentName as string;

      // Import segments schema
      const { segments, contacts, users } = await import('@/db/schema');

      // Query leads matching criteria
      const whereConditions = [eq(prospects.workspaceId, context.workspaceId)];

      if (criteria.behavior === 'high_engagement') {
        // High engagement = high estimated value or in advanced stages
        whereConditions.push(
          or(
            sql`${prospects.estimatedValue} > 10000`, // $100+ deals
            sql`${prospects.stage} IN ('qualified', 'proposal', 'negotiation')`
          )!
        );
      }
      if (criteria.industry) {
        whereConditions.push(like(prospects.company, `%${criteria.industry as string}%`));
      }
      if (criteria.stage) {
        // Cast to the prospect stage enum type
        const stageValue = criteria.stage as 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
        whereConditions.push(eq(prospects.stage, stageValue));
      }
      if (criteria.minValue) {
        whereConditions.push(sql`${prospects.estimatedValue} >= ${(criteria.minValue as number) * 100}`);
      }

      const matchingLeads = await db.query.prospects.findMany({
        where: and(...whereConditions),
        limit: 1000, // Reasonable limit
      });

      // Also check contacts if needed
      let matchingContacts: typeof contacts.$inferSelect[] = [];

      if (criteria.industry || criteria.behavior === 'high_engagement') {
        const contactConditions = [eq(contacts.workspaceId, context.workspaceId)];
        if (criteria.industry) {
          contactConditions.push(like(contacts.company, `%${criteria.industry as string}%`));
        }
        matchingContacts = await db.query.contacts.findMany({
          where: and(...contactConditions),
          limit: 500,
        });
      }

      // Get internal user ID from clerk user ID
      const userRecord = await db.query.users.findFirst({
        where: eq(users.clerkUserId, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User not found. Cannot create segment.',
        };
      }

      // Create segment in database
      const [newSegment] = await db
        .insert(segments)
        .values({
          workspaceId: context.workspaceId,
          name: segmentName,
          description: `Segment created by Neptune: ${JSON.stringify(criteria)}`,
          criteria: {
            rules: Object.entries(criteria).map(([field, value]) => ({
              field,
              operator: 'equals',
              value,
            })),
            logic: 'and',
          },
          memberCount: matchingLeads.length + matchingContacts.length,
          createdBy: userRecord.id,
        })
        .returning();

      logger.info('AI segment_audience', {
        segmentId: newSegment.id,
        segmentName,
        leadCount: matchingLeads.length,
        contactCount: matchingContacts.length,
        workspaceId: context.workspaceId,
      });

      return {
        success: true,
        message: `Created segment "${segmentName}" with ${matchingLeads.length + matchingContacts.length} matching members (${matchingLeads.length} leads, ${matchingContacts.length} contacts).`,
        data: {
          segmentId: newSegment.id,
          segmentName,
          criteria,
          leadCount: matchingLeads.length,
          contactCount: matchingContacts.length,
          totalMembers: matchingLeads.length + matchingContacts.length,
          leadIds: matchingLeads.slice(0, 50).map(l => l.id), // Limit for response size
          contactIds: matchingContacts.slice(0, 50).map(c => c.id),
        },
      };
    } catch (error) {
      logger.error('AI segment_audience failed', error);
      return {
        success: false,
        message: 'Failed to create audience segment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async schedule_social_posts(args, context) {
    try {
      const platforms = args.platforms as string[];
      const topic = args.topic as string;
      const count = (args.count as number) || 3;

      // Generate platform-specific content using GPT-4o
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      // Platform-specific guidelines
      const platformGuidelines = {
        twitter: 'Max 280 characters. Be concise, engaging, use hashtags.',
        linkedin: 'Max 3000 characters. Professional tone, focus on insights and value.',
        facebook: 'Max 63,206 characters. Conversational, engaging, can be longer form.',
      };

      const posts = [];

      for (let i = 0; i < count; i++) {
        for (const platform of platforms) {
          // Generate platform-optimized content
          const systemPrompt = `You are a social media expert. Create engaging, platform-optimized social media content. Follow best practices for ${platform}.`;
          const userPrompt = `Create post ${i + 1} about ${topic} for ${platform}.\n\nGuidelines: ${platformGuidelines[platform as keyof typeof platformGuidelines] || 'Keep it engaging and authentic.'}\n\nProvide ONLY the post content, no meta-commentary.`;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.8, // High creativity for social content
            max_tokens: platform === 'twitter' ? 100 : 500,
          });

          const generatedContent = completion.choices[0]?.message?.content || `Draft post ${i + 1} about ${topic} for ${platform}`;

          posts.push({
            platform,
            topic,
            content: generatedContent,
            status: 'draft',
            scheduledFor: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Space out by days
          });
        }
      }

      return {
        success: true,
        message: `Created ${posts.length} AI-generated draft posts across ${platforms.length} platforms. Ready for review and scheduling.`,
        data: {
          platforms,
          topic,
          posts,
          totalPosts: posts.length,
        },
      };
    } catch (error) {
      logger.error('AI schedule_social_posts failed', error);
      return {
        success: false,
        message: 'Failed to create social media posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async analyze_competitor(args, context) {
    try {
      const competitorName = args.competitorName as string;
      const focusAreas = (args.focusAreas as string[]) || ['pricing', 'features', 'marketing'];

      // Try to find competitor website
      let competitorUrl = competitorName;

      // If it's not a URL, try to construct one
      if (!competitorUrl.includes('http') && !competitorUrl.includes('.com') && !competitorUrl.includes('.ai') && !competitorUrl.includes('.io')) {
        // Try common domain patterns
        const cleanName = competitorName.toLowerCase().replace(/\s+/g, '');
        competitorUrl = `https://${cleanName}.com`;
      } else if (!competitorUrl.startsWith('http')) {
        competitorUrl = 'https://' + competitorUrl;
      }

      // Use website analyzer to get real data
      const { analyzeWebsiteQuick } = await import('@/lib/ai/website-analyzer');
      const websiteAnalysis = await analyzeWebsiteQuick(competitorUrl);

      // Use GPT-4o to analyze competitor based on website data and focus areas
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      const analysisPrompt = `Analyze ${competitorName} as a competitor. Focus on: ${focusAreas.join(', ')}.
${websiteAnalysis ? `Website data:\nCompany: ${websiteAnalysis.companyName}\nDescription: ${websiteAnalysis.description}\nOfferings: ${websiteAnalysis.keyOfferings.join(', ')}\nTarget Audience: ${websiteAnalysis.targetAudience}` : 'Limited website data available.'}

Provide analysis in JSON format:
{
  "pricing": "pricing model and tiers",
  "features": "key features and positioning",
  "marketing": "marketing messaging and channels",
  "positioning": "market positioning",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a competitive intelligence analyst. Analyze competitors and provide structured insights.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const analysisText = response.choices[0]?.message?.content;
      let analysis: {
        pricing: string;
        features: string;
        marketing: string;
        positioning: string;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
      };

      if (analysisText) {
        try {
          analysis = JSON.parse(analysisText);
        } catch {
          // Fallback if JSON parsing fails
          analysis = {
            pricing: 'Pricing information to be researched',
            features: 'Feature set to be analyzed',
            marketing: 'Marketing strategy to be reviewed',
            positioning: 'Market positioning to be determined',
            strengths: [],
            weaknesses: [],
            recommendations: [],
          };
        }
      } else {
        analysis = {
          pricing: 'Pricing information to be researched',
          features: 'Feature set to be analyzed',
          marketing: 'Marketing strategy to be reviewed',
          positioning: 'Market positioning to be determined',
          strengths: [],
          weaknesses: [],
          recommendations: [],
        };
      }

      return {
        success: true,
        message: `Completed competitor analysis for ${competitorName}. Analyzed ${focusAreas.join(', ')}.`,
        data: {
          competitor: competitorName,
          competitorUrl: websiteAnalysis ? websiteAnalysis.websiteUrl : competitorUrl,
          analysis,
          focusAreas,
          websiteAnalyzed: !!websiteAnalysis,
        },
      };
    } catch (error) {
      logger.error('AI analyze_competitor failed', error);
      return {
        success: false,
        message: 'Failed to analyze competitor',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async post_to_social_media(args, context) {
    try {
      const platform = args.platform as string;
      const content = args.content as string;
      const scheduleFor = args.scheduleFor as string | undefined;

      // Validate platform
      const supportedPlatforms = ['twitter', 'linkedin', 'facebook'];
      if (!supportedPlatforms.includes(platform)) {
        return {
          success: false,
          message: `Platform "${platform}" is not yet supported. Supported platforms: ${supportedPlatforms.join(', ')}.`,
          error: 'Unsupported platform',
        };
      }

      // Handle each platform
      if (platform === 'twitter') {
        const { getTwitterIntegration, postTweet } = await import('@/lib/social/twitter');
        const integration = await getTwitterIntegration(context.workspaceId);

        if (!integration) {
          return {
            success: false,
            message: 'Twitter account not connected. Please connect your Twitter account in Connected Apps first.',
            error: 'Twitter not connected',
          };
        }

        // Validate content length for Twitter
        if (content.length > 280) {
          return {
            success: false,
            message: `Tweet exceeds 280 character limit (${content.length} characters). Please shorten it.`,
            error: 'Content too long',
          };
        }

        // Handle scheduling/posting
        if (scheduleFor) {
          const scheduledDate = new Date(scheduleFor);
          if (scheduledDate <= new Date()) {
            return {
              success: false,
              message: 'Scheduled time must be in the future.',
              error: 'Invalid schedule time',
            };
          }

          const { socialMediaPosts } = await import('@/db/schema');
          const [post] = await db
            .insert(socialMediaPosts)
            .values({
              workspaceId: context.workspaceId,
              integrationId: integration.id,
              userId: context.userId,
              platform: 'twitter',
              content,
              status: 'scheduled',
              scheduledFor: scheduledDate,
            })
            .returning();

          return {
            success: true,
            message: `Scheduled tweet for ${scheduledDate.toLocaleString()}. It will be posted automatically.`,
            data: {
              postId: post.id,
              platform: 'twitter',
              scheduledFor: scheduledDate,
              status: 'scheduled',
            },
          };
        }

        // Post immediately
        const result = await postTweet(integration.id, content);

        if (!result.success) {
          return {
            success: false,
            message: `Failed to post to Twitter: ${result.error}`,
            error: result.error,
          };
        }

        // Save post to database
        const { socialMediaPosts } = await import('@/db/schema');
        await db.insert(socialMediaPosts).values({
          workspaceId: context.workspaceId,
          integrationId: integration.id,
          userId: context.userId,
          platform: 'twitter',
          content,
          status: 'posted',
          postedAt: new Date(),
          externalPostId: result.tweetId,
        });

        return {
          success: true,
          message: `Posted to Twitter! ${result.url ? `View it here: ${result.url}` : ''}`,
          data: {
            platform: 'twitter',
            tweetId: result.tweetId,
            url: result.url,
            status: 'posted',
          },
        };
      } else if (platform === 'linkedin') {
        const { getLinkedInIntegration, postLinkedInUpdate } = await import('@/lib/social/linkedin');
        const integration = await getLinkedInIntegration(context.workspaceId);

        if (!integration) {
          return {
            success: false,
            message: 'LinkedIn account not connected. Please connect your LinkedIn account in Connected Apps first.',
            error: 'LinkedIn not connected',
          };
        }

        if (content.length > 3000) {
          return {
            success: false,
            message: `LinkedIn post exceeds 3000 character limit (${content.length} characters). Please shorten it.`,
            error: 'Content too long',
          };
        }

        const result = await postLinkedInUpdate(integration.id, content);

        if (!result.success) {
          return {
            success: false,
            message: `Failed to post to LinkedIn: ${result.error}`,
            error: result.error,
          };
        }

        const { socialMediaPosts } = await import('@/db/schema');
        await db.insert(socialMediaPosts).values({
          workspaceId: context.workspaceId,
          integrationId: integration.id,
          userId: context.userId,
          platform: 'linkedin',
          content,
          status: 'posted',
          postedAt: new Date(),
          externalPostId: result.postId,
        });

        return {
          success: true,
          message: `Posted to LinkedIn! ${result.url ? `View it here: ${result.url}` : ''}`,
          data: {
            platform: 'linkedin',
            postId: result.postId,
            url: result.url,
            status: 'posted',
          },
        };
      } else if (platform === 'facebook') {
        const { getFacebookIntegration, postFacebookUpdate } = await import('@/lib/social/facebook');
        const integration = await getFacebookIntegration(context.workspaceId);

        if (!integration) {
          return {
            success: false,
            message: 'Facebook account not connected. Please connect your Facebook account in Connected Apps first.',
            error: 'Facebook not connected',
          };
        }

        if (content.length > 63206) {
          return {
            success: false,
            message: `Facebook post exceeds recommended character limit (${content.length} characters). Please shorten it.`,
            error: 'Content too long',
          };
        }

        const result = await postFacebookUpdate(integration.id, content);

        if (!result.success) {
          return {
            success: false,
            message: `Failed to post to Facebook: ${result.error}`,
            error: result.error,
          };
        }

        const { socialMediaPosts } = await import('@/db/schema');
        await db.insert(socialMediaPosts).values({
          workspaceId: context.workspaceId,
          integrationId: integration.id,
          userId: context.userId,
          platform: 'facebook',
          content,
          status: 'posted',
          postedAt: new Date(),
          externalPostId: result.postId,
        });

        return {
          success: true,
          message: `Posted to Facebook! ${result.url ? `View it here: ${result.url}` : ''}`,
          data: {
            platform: 'facebook',
            postId: result.postId,
            url: result.url,
            status: 'posted',
          },
        };
      }

      // Fallback for unsupported platforms (should never reach here due to validation above)
      return {
        success: false,
        message: `Platform "${platform}" is not supported.`,
        error: 'Unsupported platform',
      };
    } catch (error) {
      logger.error('AI post_to_social_media failed', error);
      return {
        success: false,
        message: 'Failed to post to social media. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async analyze_company_website(args, context) {
    // Helper function to infer company info from URL when crawling fails
    const inferCompanyFromUrl = (websiteUrl: string) => {
      let domain = '';
      try {
        domain = new URL(websiteUrl).hostname.replace('www.', '').replace('.com', '').replace('.ai', '').replace('.io', '');
      } catch {
        domain = websiteUrl;
      }

      // Clean up domain to get company name
      const companyName = domain
        .split('.')[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Infer type from domain TLD and keywords
      const urlLower = websiteUrl.toLowerCase();
      let inferredType = 'technology';
      if (urlLower.includes('.ai') || urlLower.includes('ai')) inferredType = 'AI/technology';
      else if (urlLower.includes('shop') || urlLower.includes('store')) inferredType = 'e-commerce';
      else if (urlLower.includes('agency') || urlLower.includes('studio')) inferredType = 'agency/services';
      else if (urlLower.includes('consulting') || urlLower.includes('consult')) inferredType = 'consulting';

      return {
        companyName,
        inferredType,
        description: `${companyName} appears to be a ${inferredType} company.`,
        keyOfferings: ['Products/services to be discovered', 'Core business offerings'],
        targetAudience: 'Target audience to be confirmed with user',
        suggestedActions: [
          'Tell me more about what you do so I can personalize your setup',
          'Share your main product or service offerings',
          'Describe your ideal customer'
        ],
      };
    };

    try {
      const url = args.url as string;
      const detailed = args.detailed as boolean || false;

      // Validate URL
      if (!url) {
        return {
          success: false,
          message: 'Please provide a website URL to analyze.',
          error: 'Missing URL',
        };
      }

      // Normalize URL - add https:// if missing
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Validate URL format
      try {
        new URL(normalizedUrl);
      } catch {
        return {
          success: false,
          message: 'That doesn\'t look like a valid website URL. Please check and try again.',
          error: 'Invalid URL format',
        };
      }

      // Import the analyzer
      const { analyzeWebsiteQuick, analyzeWebsiteFull } = await import('@/lib/ai/website-analyzer');

      if (detailed) {
        // Full analysis with database storage
        const analysis = await analyzeWebsiteFull(normalizedUrl, {
          maxPages: 20,
          saveToDb: true,
          workspaceId: context.workspaceId,
        });

        if (!analysis) {
          return {
            success: false,
            message: `I couldn't access ${normalizedUrl}. The site might be blocking automated requests, or there could be a connection issue. Can you share some details about your business instead?`,
            error: 'Website analysis failed',
          };
        }

        return {
          success: true,
          message: `I've analyzed ${analysis.companyName}'s website in detail!`,
          data: {
            companyName: analysis.companyName,
            description: analysis.companyDescription,
            products: analysis.products.slice(0, 5),
            services: analysis.services.slice(0, 5),
            targetAudience: analysis.targetAudience,
            valuePropositions: analysis.valuePropositions.slice(0, 5),
            brandVoice: analysis.brandVoice,
            websiteUrl: normalizedUrl,
            analysisType: 'detailed',
          },
        };
      } else {
        // Quick analysis for immediate response
        logger.info('Starting quick website analysis', { url: normalizedUrl, workspaceId: context.workspaceId });

        let insights: Awaited<ReturnType<typeof analyzeWebsiteQuick>> | undefined = undefined;
        try {
          insights = await analyzeWebsiteQuick(normalizedUrl, { maxPages: 5 });
          logger.info('Website analysis completed', {
            url: normalizedUrl,
            success: !!insights,
            methodUsed: insights?.methodUsed,
            contentLength: insights?.contentLength
          });
        } catch (error) {
          logger.error('analyzeWebsiteQuick threw an error', {
            url: normalizedUrl,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          // Continue to fallback handling below - analyzeWebsiteQuick should never throw, but just in case
        }

        if (!insights) {
          logger.warn('Website analysis returned null', { url: normalizedUrl });
          // Extract domain name for friendlier message
          let domainName = normalizedUrl;
          try {
            domainName = new URL(normalizedUrl).hostname.replace('www.', '');
          } catch {}

          // Return honest failure with helpful suggestions
          return {
            success: false,
            message: `I couldn't access ${domainName} automatically. This often happens with sites that:
* Require JavaScript rendering (React, Vue, Angular apps)
* Have bot protection (Cloudflare, Akamai)
* Require authentication to view content
* Block automated crawlers

**Let's try this instead:**
1. Tell me in 2-3 sentences what ${domainName} does
2. Or I can search for public information about ${domainName}
3. Or share a direct link to your About/Products page`,
            error: 'Website crawl failed - all methods exhausted',
            data: {
              websiteUrl: normalizedUrl,
              suggestedActions: ['manual_description', 'search_company_info', 'provide_specific_page'],
            },
          };
        }

        // Determine success level and message based on method used
        const isPartial = insights.methodUsed === 'inferred' || insights.fallbackUsed || (insights.contentLength || 0) < 500;
        const methodDisplay = insights.methodUsed?.replace('+', ' + ') || 'unknown';

        let message = '';
        if (isPartial && insights.methodUsed === 'inferred') {
          let domainName = normalizedUrl;
          try {
            domainName = new URL(normalizedUrl).hostname.replace('www.', '');
          } catch {}
          message = `I found your website at ${domainName}! I can see it's ${insights.companyName}. While I couldn't access all the details automatically, I'm ready to help you get started. Share a bit about what you do and I'll build you a personalized roadmap!`;
        } else if (isPartial) {
          message = `Great! I've analyzed ${insights.companyName}'s website. I found some information using ${methodDisplay}, and I'm ready to help you get started with GalaxyCo.ai!`;
        } else {
          message = `Perfect! I've successfully analyzed ${insights.companyName}'s website using ${methodDisplay}. Here's what I found:`;
        }

        // Also save to database in the background (don't await)
        analyzeWebsiteFull(normalizedUrl, {
          maxPages: 50, // Deep crawl for background
          saveToDb: true,
          workspaceId: context.workspaceId,
        }).catch((err) => {
          logger.warn('Background website analysis save failed', { url: normalizedUrl, error: err });
        });

        return {
          success: true,
          message,
          data: {
            companyName: insights.companyName,
            description: insights.description,
            keyOfferings: insights.keyOfferings,
            targetAudience: insights.targetAudience,
            suggestedActions: insights.suggestedActions,
            websiteUrl: normalizedUrl,
            analysisType: isPartial ? 'partial' : 'quick',
            methodUsed: insights.methodUsed,
            contentLength: insights.contentLength,
            needsMoreInfo: isPartial,
            analysisNote: insights.analysisNote,
          },
          suggestedNextStep: {
            action: 'update_dashboard_roadmap',
            reason: 'Website analysis informs personalized setup recommendations',
            prompt: 'Want me to build a personalized setup plan based on this analysis?',
            autoSuggest: true,
          },
        };
      }
    } catch (error) {
      logger.error('AI analyze_company_website failed with unexpected error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: args.url
      });

      // Extract domain for error message
      const url = args.url as string;
      let normalizedUrl = url?.trim() || '';
      if (normalizedUrl && !normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      let domainName = normalizedUrl;
      try {
        domainName = new URL(normalizedUrl).hostname.replace('www.', '');
      } catch {
        domainName = normalizedUrl;
      }

      // Return honest failure with helpful error message
      return {
        success: false,
        message: `I encountered an error analyzing ${domainName}. This could be due to:
* Network connectivity issues
* Unexpected site structure
* API rate limits
* Service temporarily unavailable

**What would help:**
1. Share key information about your business directly
2. Try again in a moment (might be temporary)
3. Provide a specific page URL (like /about or /products)`,
        error: error instanceof Error ? error.message : 'Unknown error during website analysis',
        data: {
          websiteUrl: normalizedUrl,
          suggestedActions: ['manual_description', 'retry_later', 'provide_specific_page'],
        },
      };
    }
  },

  async search_web(args, context) {
    try {
      const query = args.query as string;
      const numResults = Math.min(Math.max((args.numResults as number) || 5, 1), 10);

      if (!query || query.trim().length === 0) {
        return {
          success: false,
          message: 'Please provide a search query.',
          error: 'Missing query',
        };
      }

      // Check if search is configured
      const { isSearchConfigured, getSearchProvider } = await import('@/lib/search');
      if (!isSearchConfigured()) {
        return {
          success: false,
          message: 'Web search is not configured. Please configure Perplexity API key (PERPLEXITY_API_KEY) or Google Custom Search API keys (GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID) in environment variables.',
          error: 'Search not configured',
        };
      }

      const provider = getSearchProvider();
      logger.info('Executing web search', {
        query,
        numResults,
        provider,
        workspaceId: context.workspaceId
      });

      // Import search functions
      const { searchWeb, extractSearchInsights } = await import('@/lib/search');

      logger.info('Calling searchWeb function', {
        query,
        numResults,
        provider,
        hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
        hasGoogleKey: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
      });

      const results = await searchWeb(query, { numResults });

      logger.info('searchWeb returned results', {
        resultCount: results.length,
        provider,
        firstResultTitle: results[0]?.title
      });

      const summary = extractSearchInsights(results);

      if (results.length === 0) {
        return {
          success: true,
          message: `I searched for "${query}" but didn't find any results. Try rephrasing your query or being more specific.`,
          data: {
            query,
            results: [],
            summary: 'No results found',
            provider,
          },
        };
      }

      const providerMessage = provider === 'perplexity'
        ? `I found real-time information about "${query}" using Perplexity's web browsing.`
        : `I found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}".`;

      return {
        success: true,
        message: providerMessage,
        data: {
          query,
          results: results.map(r => ({
            title: r.title,
            link: r.link,
            snippet: r.snippet,
            displayLink: r.displayLink,
          })),
          summary,
          provider,
        },
      };
    } catch (error) {
      logger.error('AI search_web failed', error);

      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('not configured')) {
        return {
          success: false,
          message: 'Web search is not configured. Please configure Perplexity API key (PERPLEXITY_API_KEY) or Google Custom Search API keys (GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID) in environment variables.',
          error: 'Search not configured',
        };
      }

      // Return a helpful error that guides the user
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Web search tool failed', {
        error: errorMessage,
        query: args.query,
        hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
        hasGoogleKey: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
      });

      return {
        success: false,
        message: `I'm having trouble accessing the web right now. The search service returned: ${errorMessage}. This might be a temporary issue - please try again in a moment, or you can ask me questions that don't require current web information.`,
        error: errorMessage,
      };
    }
  },
};
