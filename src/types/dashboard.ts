/**
 * Dashboard v2 TypeScript Types & Zod Schemas
 * 
 * Complete type definitions for the redesigned user-first dashboard.
 * All types include Zod schemas for runtime validation.
 */

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS (for validation)
// ============================================================================

/**
 * Dashboard statistics schema
 * Tracks key metrics across the platform
 */
export const DashboardStatsSchema = z.object({
  activeAgents: z.number().int().nonnegative(),
  totalAgents: z.number().int().nonnegative(),
  completedTasks: z.number().int().nonnegative(),
  hoursSaved: z.number().nonnegative(),
  crmContacts: z.number().int().nonnegative(),
  hotLeads: z.number().int().nonnegative(),
  financeConnections: z.number().int().nonnegative(),
});

/**
 * Next step action schema
 * Represents the ONE recommended action for the user
 */
export const NextStepActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  why: z.string(),
  benefits: z.array(z.string()),
  cta: z.string(),
  href: z.string(),
  priority: z.number().int().min(1).max(10),
});

/**
 * Win/accomplishment schema
 * Represents a recent achievement or automated action
 */
export const WinSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  title: z.string(),
  detail: z.string(),
  timeAgo: z.string(),
  timestamp: z.coerce.date(),
  type: z.enum(['agent', 'task', 'crm', 'finance', 'content', 'general']),
});

/**
 * Journey pathway schema
 * Represents an outcome-based navigation path
 */
export const JourneyPathwaySchema = z.object({
  id: z.string(),
  title: z.string(),
  promise: z.string(),
  href: z.string(),
  icon: z.string(),
  iconColor: z.string(),
  iconBg: z.string(),
  badge: z.string().optional(),
  order: z.number().int(),
});

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  name: z.string(),
  isFirstTime: z.boolean(),
  lastLogin: z.coerce.date().optional(),
});

/**
 * Onboarding status schema
 */
export const OnboardingStatusSchema = z.object({
  isComplete: z.boolean(),
  completionPercentage: z.number().min(0).max(100),
});

/**
 * Complete dashboard data schema
 * Validates the entire API response
 */
export const DashboardV2DataSchema = z.object({
  stats: DashboardStatsSchema,
  nextStep: NextStepActionSchema,
  pathways: z.array(JourneyPathwaySchema),
  wins: z.array(WinSchema),
  user: UserProfileSchema,
  onboarding: OnboardingStatusSchema,
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type NextStepAction = z.infer<typeof NextStepActionSchema>;
export type Win = z.infer<typeof WinSchema>;
export type JourneyPathway = z.infer<typeof JourneyPathwaySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type DashboardV2Data = z.infer<typeof DashboardV2DataSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for the main client component
 */
export interface DashboardV2ClientProps {
  initialData: DashboardV2Data;
}

/**
 * Props for the welcome section
 */
export interface WelcomeSectionProps {
  userName: string;
  isFirstTime: boolean;
  lastLogin?: Date;
  stats: DashboardStats;
  hasActiveAgents: boolean;
}

/**
 * Props for the next step card
 */
export interface NextStepCardProps {
  action: NextStepAction;
  onClick?: () => void;
}

/**
 * Props for journey pathways
 */
export interface JourneyPathwaysProps {
  pathways: JourneyPathway[];
}

/**
 * Props for recent wins timeline
 */
export interface RecentWinsTimelineProps {
  wins: Win[];
  isEmpty: boolean;
}

/**
 * Props for tools grid
 */
export interface ToolsGridProps {
  isCollapsed?: boolean;
}

/**
 * Props for loading skeleton
 */
export interface DashboardV2LoadingProps {
  message?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Neptune suggestion type
 */
export interface NeptuneSuggestion {
  text: string;
  condition?: boolean;
  priority?: number;
}

/**
 * Tool definition for ToolsGrid
 */
export interface Tool {
  name: string;
  icon: string;
  href: string;
  description: string;
}

/**
 * Analytics event properties
 */
export interface DashboardAnalyticsEvent {
  userId?: string;
  workspaceId?: string;
  timestamp: Date;
  [key: string]: unknown;
}
