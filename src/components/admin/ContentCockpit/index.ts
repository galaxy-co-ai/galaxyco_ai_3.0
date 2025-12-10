/**
 * Content Cockpit Components
 *
 * Dashboard components for the Content Cockpit - the central hub for
 * content management tools in Mission Control.
 *
 * @example
 * ```tsx
 * import { ToolCard, StatsBar } from '@/components/admin/ContentCockpit';
 *
 * // Tool card for navigation
 * <ToolCard
 *   icon={Sparkles}
 *   title="Article Studio"
 *   description="Create AI-assisted articles"
 *   href="/admin/content/article-studio"
 * />
 *
 * // Stats bar for overview
 * <StatsBar
 *   publishedCount={42}
 *   queueCount={8}
 *   viewsThisMonth={1250}
 *   alertsCount={3}
 * />
 * ```
 */

export { ToolCard } from "./ToolCard";
export { StatsBar } from "./StatsBar";

// Sources Hub Components
export {
  SourceCard,
  SuggestionCard,
  SourcesList,
  SourcesQueueSidebar,
  SuggestionsBottomSheet,
  AddSourceDialog,
  SourcesHubPage,
} from "./SourcesHub";
export type { SourceFilters, SourceFormData } from "./SourcesHub";

// Analytics Components
export {
  AnalyticsDashboard,
  ArticlePerformanceCard,
  PerformanceTrendsChart,
  TopPerformersTable,
  EngagementBreakdown,
  DateRangeSelector,
  StatsOverviewCards,
} from "./Analytics";
export type { DateRangePreset } from "./Analytics/DateRangeSelector";
export type { MetricType } from "./Analytics/PerformanceTrendsChart";

// Use Case Studio Components
export {
  UseCaseListPage,
  UseCaseCard,
  UseCaseWizard,
} from "./UseCaseStudio";
export type {
  UseCase,
  UseCaseFormData,
  Persona,
  JourneyStage,
  Messaging,
  OnboardingQuestion,
  RoadmapStep,
} from "./UseCaseStudio/types";

