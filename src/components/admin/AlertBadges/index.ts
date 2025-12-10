/**
 * Alert Badges Components
 * 
 * Proactive notification system for the Content Cockpit.
 * Displays alerts for trends, opportunities, warnings, milestones, and suggestions.
 * 
 * @example
 * ```tsx
 * // Bell icon with dropdown (most common usage)
 * import { AlertBadgePopover } from '@/components/admin/AlertBadges';
 * 
 * <AlertBadgePopover />
 * 
 * // Custom list of alerts
 * import { AlertBadgeList } from '@/components/admin/AlertBadges';
 * 
 * <AlertBadgeList
 *   alerts={alerts}
 *   onMarkRead={handleMarkRead}
 *   onDismiss={handleDismiss}
 * />
 * 
 * // Single alert item
 * import { AlertBadgeItem } from '@/components/admin/AlertBadges';
 * 
 * <AlertBadgeItem alert={alert} />
 * ```
 */

export { AlertBadgePopover } from "./AlertBadgePopover";
export { AlertBadgeList } from "./AlertBadgeList";
export { AlertBadgeItem } from "./AlertBadgeItem";

