/**
 * CRM Tool Implementations
 */
import type { ToolImplementations, ToolResult } from '../types';
import { db } from '@/lib/db';
import { prospects, contacts } from '@/db/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const crmToolImplementations: ToolImplementations = {
  // CRM: Create Lead
  async create_lead(args, context) {
    try {
      const [prospect] = await db
        .insert(prospects)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          email: (args.email as string) || null,
          phone: (args.phone as string) || null,
          company: (args.company as string) || null,
          title: (args.title as string) || null,
          stage: (args.stage as 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost') || 'new',
          estimatedValue: args.estimatedValue ? Math.round((args.estimatedValue as number) * 100) : null,
          source: (args.source as string) || 'ai_assistant',
          notes: (args.notes as string) || null,
        })
        .returning();

      logger.info('AI created lead', { prospectId: prospect.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created lead "${prospect.name}" successfully`,
        data: {
          id: prospect.id,
          name: prospect.name,
          email: prospect.email,
          company: prospect.company,
          stage: prospect.stage,
        },
        suggestedNextStep: {
          action: 'schedule_meeting',
          reason: 'New B2B leads typically benefit from a discovery call to qualify their needs',
          prompt: `Want me to schedule a discovery call with ${prospect.name}${prospect.company ? ` at ${prospect.company}` : ''}?`,
          autoSuggest: true,
        },
      };
    } catch (error) {
      logger.error('AI create_lead failed', error);
      return {
        success: false,
        message: 'Failed to create lead',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Search Leads
  async search_leads(args, context) {
    try {
      const query = (args.query as string) || '';
      const stage = args.stage as string | undefined;
      const limit = (args.limit as number) || 10;

      const conditions = [eq(prospects.workspaceId, context.workspaceId)];

      if (query) {
        conditions.push(
          or(
            like(prospects.name, `%${query}%`),
            like(prospects.email, `%${query}%`),
            like(prospects.company, `%${query}%`)
          )!
        );
      }

      if (stage) {
        conditions.push(eq(prospects.stage, stage as typeof prospects.stage.enumValues[number]));
      }

      const results = await db.query.prospects.findMany({
        where: and(...conditions),
        orderBy: [desc(prospects.createdAt)],
        limit,
      });

      return {
        success: true,
        message: `Found ${results.length} lead(s)`,
        data: {
          leads: results.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            company: p.company,
            stage: p.stage,
            estimatedValue: p.estimatedValue ? p.estimatedValue / 100 : null,
            lastContactedAt: p.lastContactedAt,
          })),
        },
      };
    } catch (error) {
      logger.error('AI search_leads failed', error);
      return {
        success: false,
        message: 'Failed to search leads',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Update Lead Stage
  async update_lead_stage(args, context) {
    try {
      const leadId = args.leadId as string;
      const newStage = args.newStage as typeof prospects.stage.enumValues[number];
      const notes = args.notes as string | undefined;

      // Verify the lead belongs to this workspace
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found or access denied',
        };
      }

      const updateData: Record<string, unknown> = {
        stage: newStage,
        updatedAt: new Date(),
      };

      if (notes) {
        updateData.notes = lead.notes ? `${lead.notes}\n\n[${new Date().toISOString()}] ${notes}` : notes;
      }

      const previousStage = lead.stage;
      
      await db
        .update(prospects)
        .set(updateData)
        .where(eq(prospects.id, leadId));

      logger.info('AI updated lead stage', { leadId, newStage, workspaceId: context.workspaceId });

      // Fire event if stage changed to negotiation (deal stage change)
      if (previousStage !== newStage && newStage === 'negotiation') {
        const { fireEvent } = await import('@/lib/ai/event-hooks');
        fireEvent({
          type: 'deal_stage_changed',
          workspaceId: context.workspaceId,
          userId: context.userId,
          dealId: leadId,
          newStage,
        }).catch(err => {
          logger.error('Failed to fire deal stage change event (non-critical):', err);
        });
      }

      return {
        success: true,
        message: `Updated "${lead.name}" to stage "${newStage}"`,
        data: {
          id: lead.id,
          name: lead.name,
          previousStage: lead.stage,
          newStage,
        },
      };
    } catch (error) {
      logger.error('AI update_lead_stage failed', error);
      return {
        success: false,
        message: 'Failed to update lead stage',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Create Contact
  async create_contact(args, context) {
    try {
      const [contact] = await db
        .insert(contacts)
        .values({
          workspaceId: context.workspaceId,
          firstName: (args.firstName as string) || null,
          lastName: (args.lastName as string) || null,
          email: args.email as string,
          phone: (args.phone as string) || null,
          company: (args.company as string) || null,
          title: (args.title as string) || null,
          notes: (args.notes as string) || null,
        })
        .returning();

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;
      logger.info('AI created contact', { contactId: contact.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created contact "${name}" successfully`,
        data: {
          id: contact.id,
          name,
          email: contact.email,
          company: contact.company,
        },
        suggestedNextStep: {
          action: 'add_to_campaign',
          reason: 'New contacts benefit from automated nurture sequences',
          prompt: 'Want to add them to a nurture campaign?',
          autoSuggest: false,
        },
      };
    } catch (error) {
      logger.error('AI create_contact failed', error);
      return {
        success: false,
        message: 'Failed to create contact',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Create Deal
  async create_deal(args, context): Promise<ToolResult> {
    try {
      // For now, we'll create this as a prospect with deal metadata
      // In a full implementation, you'd have a separate deals table
      const stage = args.stage as string;
      const validStage = stage === 'qualification' ? 'qualified' : (stage as 'qualified' | 'proposal' | 'negotiation') || 'proposal';

      const [prospect] = await db
        .insert(prospects)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          stage: validStage,
          estimatedValue: args.value ? Math.round((args.value as number) * 100) : null,
          notes: (args.notes as string) || `Deal created by Neptune`,
          source: 'ai_deal',
        })
        .returning();

      logger.info('AI created deal', { dealId: prospect.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created deal "${prospect.name}" worth $${(args.value as number)?.toLocaleString() || 0}`,
        data: {
          id: prospect.id,
          name: prospect.name,
          value: args.value,
          stage: prospect.stage,
        },
      };
    } catch (error) {
      logger.error('AI create_deal failed', error);
      return {
        success: false,
        message: 'Failed to create deal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Update Deal
  async update_deal(args, context): Promise<ToolResult> {
    try {
      const dealId = args.dealId as string;

      const deal = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, dealId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!deal) {
        return {
          success: false,
          message: 'Deal not found or access denied',
        };
      }

      const previousStage = deal.stage;

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (args.value) updateData.estimatedValue = Math.round((args.value as number) * 100);
      if (args.stage) updateData.stage = args.stage;
      if (args.notes) updateData.notes = deal.notes ? `${deal.notes}\n\n${args.notes}` : args.notes;

      await db.update(prospects).set(updateData).where(eq(prospects.id, dealId));

      // Fire event if stage changed to negotiation
      if (args.stage && previousStage !== args.stage && args.stage === 'negotiation') {
        const { fireEvent } = await import('@/lib/ai/event-hooks');
        fireEvent({
          type: 'deal_stage_changed',
          workspaceId: context.workspaceId,
          userId: context.userId,
          dealId,
          newStage: args.stage as string,
        }).catch(err => {
          logger.error('Failed to fire deal stage change event (non-critical):', err);
        });
      }

      return {
        success: true,
        message: `Updated deal "${deal.name}"`,
        data: {
          id: deal.id,
          name: deal.name,
          updates: Object.keys(updateData).filter(k => k !== 'updatedAt'),
        },
      };
    } catch (error) {
      logger.error('AI update_deal failed', error);
      return {
        success: false,
        message: 'Failed to update deal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Get Deals Closing Soon
  async get_deals_closing_soon(args, context): Promise<ToolResult> {
    try {
      const days = (args.days as number) || 30;
      const minValue = args.minValue as number | undefined;

      // Get deals in closing stages
      const deals = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
        orderBy: [desc(prospects.estimatedValue)],
        limit: 20,
      });

      let filteredDeals = deals;
      if (minValue) {
        filteredDeals = deals.filter(d => (d.estimatedValue || 0) >= minValue * 100);
      }

      const totalValue = filteredDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: `Found ${filteredDeals.length} deals in closing stages worth $${totalValue.toLocaleString()}`,
        data: {
          deals: filteredDeals.map(d => ({
            id: d.id,
            name: d.name,
            company: d.company,
            stage: d.stage,
            value: d.estimatedValue ? d.estimatedValue / 100 : 0,
          })),
          totalValue,
        },
      };
    } catch (error) {
      logger.error('AI get_deals_closing_soon failed', error);
      return {
        success: false,
        message: 'Failed to get closing deals',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Add Note
  async add_note(args, context): Promise<ToolResult> {
    try {
      const entityType = args.entityType as 'lead' | 'contact' | 'deal';
      const entityId = args.entityId as string;
      const content = args.content as string;

      const timestamp = new Date().toISOString();
      const noteEntry = `[${timestamp}] ${context.userName}: ${content}`;

      if (entityType === 'lead' || entityType === 'deal') {
        const lead = await db.query.prospects.findFirst({
          where: and(
            eq(prospects.id, entityId),
            eq(prospects.workspaceId, context.workspaceId)
          ),
        });

        if (!lead) {
          return { success: false, message: `${entityType} not found` };
        }

        await db
          .update(prospects)
          .set({
            notes: lead.notes ? `${lead.notes}\n\n${noteEntry}` : noteEntry,
            updatedAt: new Date(),
          })
          .where(eq(prospects.id, entityId));

        return {
          success: true,
          message: `Added note to ${entityType} "${lead.name}"`,
          data: { entityType, entityId, entityName: lead.name },
        };
      } else if (entityType === 'contact') {
        const contact = await db.query.contacts.findFirst({
          where: and(
            eq(contacts.id, entityId),
            eq(contacts.workspaceId, context.workspaceId)
          ),
        });

        if (!contact) {
          return { success: false, message: 'Contact not found' };
        }

        await db
          .update(contacts)
          .set({
            notes: contact.notes ? `${contact.notes}\n\n${noteEntry}` : noteEntry,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, entityId));

        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;
        return {
          success: true,
          message: `Added note to contact "${name}"`,
          data: { entityType, entityId, entityName: name },
        };
      }

      return { success: false, message: 'Invalid entity type' };
    } catch (error) {
      logger.error('AI add_note failed', error);
      return {
        success: false,
        message: 'Failed to add note',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Get Activity Timeline
  async get_activity_timeline(args, context): Promise<ToolResult> {
    try {
      const entityType = args.entityType as 'lead' | 'contact' | 'deal';
      const entityId = args.entityId as string;

      // For now, return the notes as activity timeline
      // In a full implementation, you'd have an activity log table
      if (entityType === 'lead' || entityType === 'deal') {
        const lead = await db.query.prospects.findFirst({
          where: and(
            eq(prospects.id, entityId),
            eq(prospects.workspaceId, context.workspaceId)
          ),
        });

        if (!lead) {
          return { success: false, message: `${entityType} not found` };
        }

        return {
          success: true,
          message: `Activity timeline for "${lead.name}"`,
          data: {
            name: lead.name,
            stage: lead.stage,
            createdAt: lead.createdAt,
            lastContactedAt: lead.lastContactedAt,
            notes: lead.notes,
          },
        };
      }

      return { success: false, message: 'Invalid entity type' };
    } catch (error) {
      logger.error('AI get_activity_timeline failed', error);
      return {
        success: false,
        message: 'Failed to get activity timeline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
