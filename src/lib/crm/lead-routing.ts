import { db } from '@/lib/db';
import { leadRoutingRules } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface LeadData {
  source?: string;
  industry?: string;
  companySize?: string;
  score?: number;
  estimatedValue?: number;
  tags?: string[];
  country?: string;
  stage?: string;
  [key: string]: unknown;
}

interface RoutingResult {
  matched: boolean;
  ruleId?: string;
  ruleName?: string;
  assignedUserId?: string;
  method?: 'direct' | 'round_robin';
}

interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
}

interface RuleCriteria {
  conditions: Condition[];
  matchType: 'all' | 'any';
}

/**
 * Find the best routing rule for a lead and return the assigned user
 */
export async function routeLead(
  workspaceId: string,
  leadData: LeadData
): Promise<RoutingResult> {
  try {
    // Fetch all enabled routing rules, sorted by priority
    const rules = await db.query.leadRoutingRules.findMany({
      where: and(
        eq(leadRoutingRules.workspaceId, workspaceId),
        eq(leadRoutingRules.isEnabled, true)
      ),
      orderBy: [desc(leadRoutingRules.priority)],
    });

    if (rules.length === 0) {
      return { matched: false };
    }

    // Evaluate each rule in priority order
    for (const rule of rules) {
      const criteria = rule.criteria as RuleCriteria;
      const matches = evaluateCriteria(criteria, leadData);

      if (matches) {
        // Determine assigned user
        let assignedUserId: string | undefined;
        let method: 'direct' | 'round_robin' = 'direct';

        if (rule.assignToUserId) {
          // Direct assignment
          assignedUserId = rule.assignToUserId;
        } else if (rule.roundRobinUserIds && rule.roundRobinUserIds.length > 0) {
          // Round-robin assignment
          method = 'round_robin';
          const userIds = rule.roundRobinUserIds as string[];
          const currentIndex = rule.roundRobinIndex || 0;
          assignedUserId = userIds[currentIndex % userIds.length];

          // Update round-robin index for next lead
          await db
            .update(leadRoutingRules)
            .set({
              roundRobinIndex: (currentIndex + 1) % userIds.length,
              matchCount: (rule.matchCount || 0) + 1,
              lastMatchedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(leadRoutingRules.id, rule.id));
        }

        if (assignedUserId) {
          logger.info('Lead routed via rule', {
            workspaceId,
            ruleId: rule.id,
            ruleName: rule.name,
            assignedUserId,
            method,
          });

          return {
            matched: true,
            ruleId: rule.id,
            ruleName: rule.name,
            assignedUserId,
            method,
          };
        }
      }
    }

    return { matched: false };
  } catch (error) {
    logger.error('Lead routing failed', { error, workspaceId });
    return { matched: false };
  }
}

/**
 * Evaluate if lead data matches the rule criteria
 */
function evaluateCriteria(criteria: RuleCriteria, leadData: LeadData): boolean {
  const { conditions, matchType } = criteria;

  if (matchType === 'all') {
    // ALL conditions must match
    return conditions.every((condition) => evaluateCondition(condition, leadData));
  } else {
    // ANY condition must match
    return conditions.some((condition) => evaluateCondition(condition, leadData));
  }
}

/**
 * Evaluate a single condition against lead data
 */
function evaluateCondition(condition: Condition, leadData: LeadData): boolean {
  const { field, operator, value } = condition;
  const fieldValue = leadData[field];

  // Handle missing fields
  if (fieldValue === undefined || fieldValue === null) {
    return operator === 'not_equals'; // Only not_equals matches undefined
  }

  switch (operator) {
    case 'equals':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(String(value));
      }
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();

    case 'not_equals':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(String(value));
      }
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase();

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((v) =>
          String(v).toLowerCase().includes(String(value).toLowerCase())
        );
      }
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(value);

    case 'less_than':
      return Number(fieldValue) < Number(value);

    case 'in':
      if (!Array.isArray(value)) return false;
      return value.map((v) => String(v).toLowerCase()).includes(String(fieldValue).toLowerCase());

    default:
      return false;
  }
}

/**
 * Apply routing to a newly created lead
 * Returns the user ID to assign the lead to, or null if no match
 */
export async function applyLeadRouting(
  workspaceId: string,
  leadData: LeadData
): Promise<string | null> {
  const result = await routeLead(workspaceId, leadData);
  return result.matched ? result.assignedUserId || null : null;
}

