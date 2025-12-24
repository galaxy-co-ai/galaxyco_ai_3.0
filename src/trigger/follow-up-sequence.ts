/**
 * Trigger.dev Follow-Up Sequence Tasks
 * 
 * Multi-step follow-up sequences using wait.for() for timed delays
 * and wait.until() for specific date targeting.
 */

import { task, wait } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { prospects, contacts, crmInteractions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface FollowUpStep {
  stepNumber: number;
  delay: string; // e.g., "1d", "3d", "7d"
  type: "email" | "task" | "notification";
  subject?: string;
  body?: string;
  taskTitle?: string;
}

export interface FollowUpSequencePayload {
  workspaceId: string;
  prospectId?: string;
  contactId?: string;
  sequenceId: string;
  sequenceName: string;
  steps: FollowUpStep[];
  triggeredBy: string;
}

export interface FollowUpResult {
  success: boolean;
  sequenceId: string;
  completedSteps: number;
  totalSteps: number;
  stoppedAt?: string;
  error?: string;
}

// ============================================================================
// FOLLOW-UP SEQUENCE TASK
// ============================================================================

/**
 * Execute Follow-Up Sequence Task
 * 
 * Runs a multi-step follow-up sequence with configurable delays
 * between each step using wait.for().
 */
export const executeFollowUpSequenceTask = task({
  id: "execute-follow-up-sequence",
  retry: {
    maxAttempts: 1, // Sequences should not retry from the beginning
  },
  run: async (payload: FollowUpSequencePayload): Promise<FollowUpResult> => {
    const {
      workspaceId,
      prospectId,
      contactId,
      sequenceId,
      sequenceName,
      steps,
      triggeredBy,
    } = payload;

    logger.info("Starting follow-up sequence", {
      sequenceId,
      sequenceName,
      stepCount: steps.length,
      workspaceId,
    });

    // Get the target (prospect or contact)
    let targetEmail: string | null = null;
    let targetName: string = "there";

    if (prospectId) {
      const prospect = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, prospectId),
          eq(prospects.workspaceId, workspaceId)
        ),
      });
      
      if (!prospect) {
        return {
          success: false,
          sequenceId,
          completedSteps: 0,
          totalSteps: steps.length,
          error: "Prospect not found",
        };
      }
      
      targetEmail = prospect.email;
      targetName = prospect.name;
    } else if (contactId) {
      const contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, contactId),
          eq(contacts.workspaceId, workspaceId)
        ),
      });
      
      if (!contact) {
        return {
          success: false,
          sequenceId,
          completedSteps: 0,
          totalSteps: steps.length,
          error: "Contact not found",
        };
      }
      
      targetEmail = contact.email;
      targetName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "there";
    }

    if (!targetEmail) {
      return {
        success: false,
        sequenceId,
        completedSteps: 0,
        totalSteps: steps.length,
        error: "No email address for target",
      };
    }

    let completedSteps = 0;

    // Execute each step in sequence
    for (const step of steps) {
      // Check if the target still exists and hasn't converted/unsubscribed
      if (prospectId) {
        const currentProspect = await db.query.prospects.findFirst({
          where: and(
            eq(prospects.id, prospectId),
            eq(prospects.workspaceId, workspaceId)
          ),
        });

        // Stop if prospect converted or was marked lost
        if (!currentProspect || 
            currentProspect.convertedToCustomer || 
            currentProspect.stage === "won" || 
            currentProspect.stage === "lost") {
          logger.info("Stopping sequence - prospect status changed", {
            sequenceId,
            prospectId,
            reason: !currentProspect ? "deleted" : currentProspect.convertedToCustomer ? "converted" : `stage:${currentProspect.stage}`,
          });
          return {
            success: true,
            sequenceId,
            completedSteps,
            totalSteps: steps.length,
            stoppedAt: `Step ${step.stepNumber} - prospect status changed`,
          };
        }
      }

      // Wait for the delay before executing this step
      if (step.delay && step.stepNumber > 1) {
        logger.info("Waiting before next follow-up step", {
          sequenceId,
          stepNumber: step.stepNumber,
          delay: step.delay,
        });

        // Use wait.for() for duration-based delays
        await wait.for({ seconds: parseDurationToSeconds(step.delay) });
      }

      // Execute the step based on type
      try {
        switch (step.type) {
          case "email":
            if (isEmailConfigured() && step.subject && step.body) {
              await sendEmail({
                to: targetEmail,
                subject: step.subject.replace("{{name}}", targetName),
                html: step.body.replace(/\{\{name\}\}/g, targetName),
                text: step.body.replace(/<[^>]*>/g, "").replace(/\{\{name\}\}/g, targetName),
                tags: [
                  { name: "sequence_id", value: sequenceId },
                  { name: "sequence_name", value: sequenceName },
                  { name: "step_number", value: String(step.stepNumber) },
                  { name: "workspace", value: workspaceId },
                ],
              });

              // Log the interaction
              await db.insert(crmInteractions).values({
                workspaceId,
                type: "email",
                direction: "outbound",
                subject: step.subject.replace("{{name}}", targetName),
                notes: `Automated follow-up sequence: ${sequenceName} - Step ${step.stepNumber}`,
                prospectId: prospectId || undefined,
                contactId: contactId || undefined,
                createdBy: triggeredBy,
                occurredAt: new Date(),
              });

              logger.info("Follow-up email sent", {
                sequenceId,
                stepNumber: step.stepNumber,
                targetEmail,
              });
            }
            break;

          case "task":
            // TODO: Create a task in the task system
            logger.info("Follow-up task would be created", {
              sequenceId,
              stepNumber: step.stepNumber,
              taskTitle: step.taskTitle,
            });
            break;

          case "notification":
            // TODO: Send internal notification
            logger.info("Follow-up notification would be sent", {
              sequenceId,
              stepNumber: step.stepNumber,
            });
            break;
        }

        completedSteps++;
      } catch (error) {
        logger.error("Error executing follow-up step", {
          sequenceId,
          stepNumber: step.stepNumber,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Continue to next step even if this one fails
      }
    }

    logger.info("Follow-up sequence completed", {
      sequenceId,
      completedSteps,
      totalSteps: steps.length,
    });

    return {
      success: true,
      sequenceId,
      completedSteps,
      totalSteps: steps.length,
    };
  },
});

// ============================================================================
// SINGLE DELAYED FOLLOW-UP TASK
// ============================================================================

/**
 * Single Delayed Follow-Up Task
 * 
 * Sends a single follow-up after a specified delay.
 * Useful for one-off follow-ups without a full sequence.
 */
export const sendDelayedFollowUpTask = task({
  id: "send-delayed-follow-up",
  run: async (payload: {
    workspaceId: string;
    prospectId?: string;
    contactId?: string;
    delay: string;
    subject: string;
    body: string;
    triggeredBy: string;
  }) => {
    const { workspaceId, prospectId, contactId, delay, subject, body, triggeredBy } = payload;

    // Wait for the specified delay
    logger.info("Waiting before sending follow-up", {
      delay,
      prospectId,
      contactId,
    });

    await wait.for({ seconds: parseDurationToSeconds(delay) });

    // Get the target
    let targetEmail: string | null = null;
    let targetName: string = "there";

    if (prospectId) {
      const prospect = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, prospectId),
          eq(prospects.workspaceId, workspaceId)
        ),
      });

      if (!prospect || prospect.convertedToCustomer) {
        logger.info("Skipping follow-up - prospect no longer valid", {
          prospectId,
          reason: !prospect ? "deleted" : "converted",
        });
        return { success: false, reason: "Prospect no longer valid" };
      }

      targetEmail = prospect.email;
      targetName = prospect.name;
    } else if (contactId) {
      const contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, contactId),
          eq(contacts.workspaceId, workspaceId)
        ),
      });

      if (!contact) {
        return { success: false, reason: "Contact not found" };
      }

      targetEmail = contact.email;
      targetName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "there";
    }

    if (!targetEmail || !isEmailConfigured()) {
      return { success: false, reason: "No email address or email not configured" };
    }

    // Send the email
    const result = await sendEmail({
      to: targetEmail,
      subject: subject.replace("{{name}}", targetName),
      html: body.replace(/\{\{name\}\}/g, targetName),
      text: body.replace(/<[^>]*>/g, "").replace(/\{\{name\}\}/g, targetName),
      tags: [
        { name: "type", value: "delayed-follow-up" },
        { name: "workspace", value: workspaceId },
      ],
    });

    // Log the interaction
    await db.insert(crmInteractions).values({
      workspaceId,
      type: "email",
      direction: "outbound",
      subject: subject.replace("{{name}}", targetName),
      notes: "Delayed follow-up email",
      prospectId: prospectId || undefined,
      contactId: contactId || undefined,
      createdBy: triggeredBy,
      occurredAt: new Date(),
    });

    logger.info("Delayed follow-up sent", {
      targetEmail,
      prospectId,
      contactId,
    });

    return { success: true, sent: true, messageId: result?.id };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a duration string like "1d", "3d", "7d", "2h" to seconds
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)(m|h|d|w)$/);
  if (!match) {
    return 24 * 60 * 60; // Default: 1 day
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    case "w":
      return value * 7 * 24 * 60 * 60;
    default:
      return 24 * 60 * 60;
  }
}
