/**
 * Finance HQ Component Library
 * 
 * All components for the Finance HQ unified financial dashboard.
 * 
 * @example
 * ```tsx
 * import { FinanceHQDashboard } from '@/components/finance-hq';
 * 
 * export default function FinancePage() {
 *   return <FinanceHQDashboard />;
 * }
 * ```
 */

// Main dashboard component
export { FinanceHQDashboard } from "./FinanceHQDashboard";

// Layout components
export { FinanceKPIGrid } from "./FinanceKPIGrid";
export { FinanceModuleGrid } from "./FinanceModuleGrid";

// Data components
export { FinanceKPITile, FinanceKPITileSkeleton } from "./FinanceKPITile";
export { FinanceModuleTile, FinanceModuleTileSkeleton } from "./FinanceModuleTile";

// Interaction components
export { FinanceTimeline, FinanceTimelineSkeleton } from "./FinanceTimeline";
export { FinanceActivityTable, FinanceActivityTableSkeleton } from "./FinanceActivityTable";
export { FinanceDetailDrawer } from "./FinanceDetailDrawer";
export { FinanceDatePicker } from "./FinanceDatePicker";
export { FinanceFilterChips } from "./FinanceFilterChips";

// Chart components
export {
  RevenueChart,
  RevenueChartSkeleton,
  ExpenseChart,
  ExpenseChartSkeleton,
  CashFlowChart,
  CashFlowChartSkeleton,
} from "./charts";

















