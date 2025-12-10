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

