/**
 * Dynamic Roadmap Engine
 * 
 * Generates personalized milestone roadmaps based on company type and workspace health.
 * Tracks progress and recommends next best actions.
 */

import type { WorkspaceHealthScore } from './workspace-health';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completionCriteria: string[];
  estimatedImpact: number; // 0-100
  timeEstimate: string;
  dependencies: string[];
  category: 'crm' | 'automation' | 'knowledge' | 'integration' | 'growth';
}

export interface DynamicRoadmap {
  milestones: RoadmapMilestone[];
  progress: {
    percentage: number;
    completedCount: number;
    totalCount: number;
  };
  nextRecommended: {
    milestoneId: string;
    reason: string;
    impact: number;
  } | null;
}

export type CompanyVertical = 'saas' | 'agency' | 'ecommerce' | 'consulting' | 'other';

// ============================================================================
// MILESTONE TEMPLATES BY VERTICAL
// ============================================================================

/**
 * Get milestone templates for specific company verticals
 */
export function getVerticalMilestones(companyType: CompanyVertical): RoadmapMilestone[] {
  const verticalTemplates: Record<CompanyVertical, RoadmapMilestone[]> = {
    saas: [
      {
        id: 'saas-trial-nurture',
        title: 'Trial User Nurturing Workflow',
        description: 'Automatically follow up with trial users to boost conversions',
        completed: false,
        completionCriteria: ['Agent created for trial follow-up', 'Email sequence configured'],
        estimatedImpact: 85,
        timeEstimate: '15 minutes',
        dependencies: [],
        category: 'automation',
      },
      {
        id: 'saas-feature-adoption',
        title: 'Feature Adoption Tracking',
        description: 'Track which features users activate and send targeted tips',
        completed: false,
        completionCriteria: ['Product analytics integrated', 'Engagement agent active'],
        estimatedImpact: 75,
        timeEstimate: '20 minutes',
        dependencies: ['saas-trial-nurture'],
        category: 'growth',
      },
      {
        id: 'saas-churn-prevention',
        title: 'Churn Prevention System',
        description: 'Identify at-risk customers and proactively reach out',
        completed: false,
        completionCriteria: ['Churn scoring model', 'Retention agent created'],
        estimatedImpact: 90,
        timeEstimate: '25 minutes',
        dependencies: ['saas-trial-nurture'],
        category: 'automation',
      },
    ],
    
    agency: [
      {
        id: 'agency-proposal-automation',
        title: 'Proposal Generation Workflow',
        description: 'Auto-generate proposals from client discovery calls',
        completed: false,
        completionCriteria: ['Proposal templates created', 'Generation agent active'],
        estimatedImpact: 80,
        timeEstimate: '20 minutes',
        dependencies: [],
        category: 'automation',
      },
      {
        id: 'agency-client-reporting',
        title: 'Client Reporting Automation',
        description: 'Generate and send monthly client reports automatically',
        completed: false,
        completionCriteria: ['Report templates', 'Scheduled reporting agent'],
        estimatedImpact: 70,
        timeEstimate: '25 minutes',
        dependencies: [],
        category: 'automation',
      },
      {
        id: 'agency-pipeline-management',
        title: 'Lead Pipeline Management',
        description: 'Organize leads by service type and stage',
        completed: false,
        completionCriteria: ['Pipeline stages defined', 'Lead scoring active'],
        estimatedImpact: 75,
        timeEstimate: '15 minutes',
        dependencies: [],
        category: 'crm',
      },
    ],
    
    ecommerce: [
      {
        id: 'ecommerce-abandoned-cart',
        title: 'Abandoned Cart Recovery',
        description: 'Automatically follow up with customers who left items in cart',
        completed: false,
        completionCriteria: ['Cart abandonment tracking', 'Recovery email agent'],
        estimatedImpact: 85,
        timeEstimate: '20 minutes',
        dependencies: [],
        category: 'automation',
      },
      {
        id: 'ecommerce-product-recommendations',
        title: 'Personalized Product Recommendations',
        description: 'Send targeted product suggestions based on browsing behavior',
        completed: false,
        completionCriteria: ['Recommendation engine', 'Email automation active'],
        estimatedImpact: 70,
        timeEstimate: '25 minutes',
        dependencies: ['ecommerce-abandoned-cart'],
        category: 'growth',
      },
      {
        id: 'ecommerce-customer-segmentation',
        title: 'Customer Segmentation',
        description: 'Segment customers by purchase history and engagement',
        completed: false,
        completionCriteria: ['Segments defined', 'Automated tagging active'],
        estimatedImpact: 75,
        timeEstimate: '15 minutes',
        dependencies: [],
        category: 'crm',
      },
    ],
    
    consulting: [
      {
        id: 'consulting-discovery-workflow',
        title: 'Discovery Call Workflow',
        description: 'Automate scheduling, prep, and follow-up for discovery calls',
        completed: false,
        completionCriteria: ['Scheduling agent', 'Prep materials automation'],
        estimatedImpact: 80,
        timeEstimate: '20 minutes',
        dependencies: [],
        category: 'automation',
      },
      {
        id: 'consulting-knowledge-base',
        title: 'Expertise Knowledge Base',
        description: 'Build a searchable repository of your methodologies and frameworks',
        completed: false,
        completionCriteria: ['10+ documents uploaded', 'Collections organized'],
        estimatedImpact: 70,
        timeEstimate: '30 minutes',
        dependencies: [],
        category: 'knowledge',
      },
      {
        id: 'consulting-client-progress',
        title: 'Client Progress Tracking',
        description: 'Track client milestones and automatically report progress',
        completed: false,
        completionCriteria: ['Milestone tracking setup', 'Progress reporting agent'],
        estimatedImpact: 75,
        timeEstimate: '25 minutes',
        dependencies: [],
        category: 'automation',
      },
    ],
    
    other: [
      {
        id: 'general-crm-setup',
        title: 'CRM Foundation',
        description: 'Import contacts and organize your customer database',
        completed: false,
        completionCriteria: ['25+ contacts added', 'Contact fields configured'],
        estimatedImpact: 85,
        timeEstimate: '15 minutes',
        dependencies: [],
        category: 'crm',
      },
      {
        id: 'general-first-automation',
        title: 'First Automation Workflow',
        description: 'Create your first automated workflow to save time',
        completed: false,
        completionCriteria: ['1 agent created', 'Agent has run successfully'],
        estimatedImpact: 80,
        timeEstimate: '10 minutes',
        dependencies: ['general-crm-setup'],
        category: 'automation',
      },
      {
        id: 'general-email-integration',
        title: 'Email Integration',
        description: 'Connect your email to enable communication automation',
        completed: false,
        completionCriteria: ['Email provider connected', 'Test email sent'],
        estimatedImpact: 75,
        timeEstimate: '5 minutes',
        dependencies: [],
        category: 'integration',
      },
    ],
  };
  
  return verticalTemplates[companyType] || verticalTemplates.other;
}

// ============================================================================
// GAP-BASED MILESTONE GENERATION
// ============================================================================

/**
 * Generate milestones from workspace health gaps
 */
export function generateGapMilestones(
  gaps: WorkspaceHealthScore['gaps']
): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = [];
  
  // Map critical and high severity gaps to milestones
  const criticalGaps = gaps.filter(g => g.severity === 'critical' || g.severity === 'high');
  
  criticalGaps.forEach((gap, index) => {
    const milestone: RoadmapMilestone = {
      id: `gap-${gap.area.toLowerCase()}-${index}`,
      title: `Fix: ${gap.description}`,
      description: gap.recommendation,
      completed: false,
      completionCriteria: [gap.recommendation],
      estimatedImpact: gap.estimatedImpact,
      timeEstimate: gap.timeToFix,
      dependencies: [],
      category: mapGapToCategory(gap.area),
    };
    
    milestones.push(milestone);
  });
  
  return milestones;
}

/**
 * Map gap area to milestone category
 */
function mapGapToCategory(area: string): RoadmapMilestone['category'] {
  const areaLower = area.toLowerCase();
  
  if (areaLower.includes('crm')) return 'crm';
  if (areaLower.includes('agent')) return 'automation';
  if (areaLower.includes('workflow')) return 'automation';
  if (areaLower.includes('knowledge')) return 'knowledge';
  if (areaLower.includes('integration')) return 'integration';
  
  return 'growth';
}

// ============================================================================
// MILESTONE COMPLETION CHECKING
// ============================================================================

/**
 * Check if a milestone is completed based on workspace health
 */
export function checkMilestoneCompletion(
  milestoneId: string,
  health: WorkspaceHealthScore
): boolean {
  // CRM milestones
  if (milestoneId.includes('crm') || milestoneId === 'general-crm-setup') {
    return health.dimensions.crmHealth >= 60;
  }
  
  // Agent/automation milestones
  if (milestoneId.includes('agent') || milestoneId.includes('automation') || 
      milestoneId === 'general-first-automation') {
    return health.dimensions.agentUtilization >= 40;
  }
  
  // Knowledge milestones
  if (milestoneId.includes('knowledge')) {
    return health.dimensions.knowledgeDepth >= 50;
  }
  
  // Integration milestones
  if (milestoneId.includes('integration') || milestoneId === 'general-email-integration') {
    return health.dimensions.integrationHealth >= 40;
  }
  
  // Vertical-specific completion logic
  if (milestoneId.includes('trial-nurture') || milestoneId.includes('follow-up')) {
    return health.dimensions.agentUtilization >= 60 && health.dimensions.crmHealth >= 50;
  }
  
  if (milestoneId.includes('proposal') || milestoneId.includes('reporting')) {
    return health.dimensions.agentUtilization >= 50;
  }
  
  // Default: check if overall health is good
  return health.overall >= 70;
}

// ============================================================================
// NEXT ACTION SELECTION
// ============================================================================

/**
 * Select the next recommended milestone
 */
export function selectNextMilestone(
  milestones: RoadmapMilestone[]
): DynamicRoadmap['nextRecommended'] {
  // Filter to incomplete milestones
  const incomplete = milestones.filter(m => !m.completed);
  
  if (incomplete.length === 0) {
    return null;
  }
  
  // Filter out milestones with incomplete dependencies
  const completedIds = new Set(milestones.filter(m => m.completed).map(m => m.id));
  const available = incomplete.filter(m => 
    m.dependencies.length === 0 || 
    m.dependencies.every(dep => completedIds.has(dep))
  );
  
  if (available.length === 0) {
    // If no milestones are available due to dependencies, return the highest impact incomplete one
    const sorted = [...incomplete].sort((a, b) => b.estimatedImpact - a.estimatedImpact);
    const next = sorted[0];
    return {
      milestoneId: next.id,
      reason: `Complete ${next.dependencies[0]} first to unlock this`,
      impact: next.estimatedImpact,
    };
  }
  
  // Sort by impact and select highest
  const sorted = [...available].sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  const next = sorted[0];
  
  return {
    milestoneId: next.id,
    reason: generateRecommendationReason(next),
    impact: next.estimatedImpact,
  };
}

/**
 * Generate a contextual reason for recommending this milestone
 */
function generateRecommendationReason(milestone: RoadmapMilestone): string {
  const reasons: Record<string, string> = {
    'general-crm-setup': 'Build your customer foundation first',
    'general-first-automation': 'Start saving time with your first automated workflow',
    'general-email-integration': 'Unlock email automation capabilities',
    'saas-trial-nurture': 'Convert more trial users into paying customers',
    'agency-proposal-automation': 'Speed up your sales cycle',
    'ecommerce-abandoned-cart': 'Recover lost revenue from abandoned carts',
    'consulting-discovery-workflow': 'Streamline your client onboarding',
  };
  
  return reasons[milestone.id] || `High impact action (${milestone.estimatedImpact}% potential improvement)`;
}

// ============================================================================
// MAIN ROADMAP GENERATION
// ============================================================================

/**
 * Generate a dynamic roadmap for the workspace
 */
export async function generateDynamicRoadmap(
  health: WorkspaceHealthScore,
  companyType: CompanyVertical = 'other'
): Promise<DynamicRoadmap> {
  try {
    logger.info('Generating dynamic roadmap', { 
      companyType, 
      overallHealth: health.overall 
    });
    
    // Get vertical-specific milestones
    const verticalMilestones = getVerticalMilestones(companyType);
    
    // Generate gap-based milestones
    const gapMilestones = generateGapMilestones(health.gaps);
    
    // Combine and deduplicate
    const allMilestones = [...verticalMilestones, ...gapMilestones];
    
    // Sort by impact and take top 8
    const topMilestones = allMilestones
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 8);
    
    // Check completion status for each
    const withStatus = topMilestones.map(m => ({
      ...m,
      completed: checkMilestoneCompletion(m.id, health),
    }));
    
    // Calculate progress
    const completedCount = withStatus.filter(m => m.completed).length;
    const totalCount = withStatus.length;
    const percentage = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100) 
      : 0;
    
    const progress = {
      percentage,
      completedCount,
      totalCount,
    };
    
    // Select next recommended action
    const nextRecommended = selectNextMilestone(withStatus);
    
    const roadmap: DynamicRoadmap = {
      milestones: withStatus,
      progress,
      nextRecommended,
    };
    
    logger.info('Dynamic roadmap generated', {
      companyType,
      totalMilestones: totalCount,
      completed: completedCount,
      progress: percentage,
      hasRecommendation: !!nextRecommended,
    });
    
    return roadmap;
  } catch (error) {
    logger.error('Failed to generate dynamic roadmap', error);
    
    // Return empty roadmap on error
    return {
      milestones: [],
      progress: {
        percentage: 0,
        completedCount: 0,
        totalCount: 0,
      },
      nextRecommended: null,
    };
  }
}

/**
 * Format roadmap for display in chat
 */
export function formatRoadmapForChat(roadmap: DynamicRoadmap): string {
  const { milestones, progress, nextRecommended } = roadmap;
  
  if (milestones.length === 0) {
    return 'No roadmap available yet. Let me analyze your workspace first.';
  }
  
  let output = `## 🗺️ Your Workspace Roadmap (${progress.percentage}% Complete)\n\n`;
  
  // Completed milestones
  const completed = milestones.filter(m => m.completed);
  if (completed.length > 0) {
    output += `✅ **COMPLETED** (${completed.length} milestone${completed.length !== 1 ? 's' : ''})\n`;
    completed.forEach(m => {
      output += `• ${m.title}\n`;
    });
    output += '\n';
  }
  
  // Next recommended
  if (nextRecommended) {
    const milestone = milestones.find(m => m.id === nextRecommended.milestoneId);
    if (milestone) {
      output += `🎯 **RECOMMENDED NEXT** (${milestone.estimatedImpact}% impact)\n`;
      output += `**${milestone.title}**\n`;
      output += `${milestone.description}\n`;
      output += `→ ${nextRecommended.reason}\n`;
      output += `⏱️ Time: ${milestone.timeEstimate}\n\n`;
    }
  }
  
  // Progress bar
  const barLength = 20;
  const filled = Math.round((progress.percentage / 100) * barLength);
  const empty = barLength - filled;
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  
  output += `📊 **PROGRESS**\n`;
  output += `${progressBar} ${progress.percentage}%\n`;
  output += `${progress.completedCount} of ${progress.totalCount} milestones complete\n\n`;
  
  // Upcoming milestones
  const upcoming = milestones.filter(m => !m.completed);
  if (upcoming.length > 0 && upcoming.length > 1) {
    output += `📋 **UPCOMING**\n`;
    upcoming.slice(0, 3).forEach(m => {
      if (m.id !== nextRecommended?.milestoneId) {
        output += `• ${m.title} (${m.timeEstimate})\n`;
      }
    });
  }
  
  return output;
}

/**
 * Detect company vertical from website data
 */
export function detectCompanyVertical(websiteDescription?: string | null): CompanyVertical {
  if (!websiteDescription) return 'other';
  
  const desc = websiteDescription.toLowerCase();
  
  if (desc.includes('saas') || desc.includes('software as a service') || desc.includes('subscription')) {
    return 'saas';
  }
  if (desc.includes('agency') || desc.includes('marketing') || desc.includes('design services')) {
    return 'agency';
  }
  if (desc.includes('ecommerce') || desc.includes('e-commerce') || desc.includes('online store') || desc.includes('shop')) {
    return 'ecommerce';
  }
  if (desc.includes('consulting') || desc.includes('consultant') || desc.includes('advisory')) {
    return 'consulting';
  }
  
  return 'other';
}

