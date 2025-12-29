# TASK: Content Cockpit - Phase E: Article Analytics

## CONTEXT

Phase D is complete ✅ (commit: 815295d). The Article Hit List is now live with:
- Full CRUD API routes for hit list items
- AI prioritization API with weighted scoring algorithm (6 factors, 100 points)
- HitListItem, PriorityScoreBreakdown, HitListFilters, AddToHitListDialog components
- HitListPage main orchestrator with drag-and-drop reordering
- Daily Trigger.dev job for automatic re-prioritization at 6 AM UTC
- Alert badges for significant priority changes

Phase E builds the Article Analytics dashboard - performance insights for published content.

## FILES TO REVIEW FIRST

1. `.cursor/plans/content_cockpit_implementation_e7966eac.plan.md` - Full implementation plan (Phase E section)
2. `src/app/(app)/admin/content/analytics/page.tsx` - Current placeholder (to be replaced)
3. `src/db/schema.ts` - articleAnalytics table (already added in Phase A)
4. `src/components/admin/ContentCockpit/HitList/` - Reference for patterns
5. `src/components/ui/neptune-button.tsx` - Use for all buttons

## PHASE E DELIVERABLES

### 1. API Routes

**`src/app/api/admin/analytics/articles/route.ts`**
- GET: List article performance metrics with date range filters
- Query params: startDate, endDate, sortBy, sortOrder, limit

**`src/app/api/admin/analytics/articles/[id]/route.ts`**
- GET: Get detailed analytics for single article
- PATCH: Update tracking settings (optional)

**`src/app/api/admin/analytics/overview/route.ts`**
- GET: Dashboard overview stats (total views, avg engagement, top performers, trends)

**`src/app/api/admin/analytics/trends/route.ts`**
- GET: Content performance trends over time
- Query params: period (daily, weekly, monthly), metric (views, engagement, shares)

### 2. UI Components (`src/components/admin/ContentCockpit/Analytics/`)

**AnalyticsDashboard.tsx** - Main dashboard layout
- Overview cards (Total Views, Avg Read Time, Engagement Rate, Shares)
- Date range selector
- Performance trends chart
- Top performing articles list

**ArticlePerformanceCard.tsx** - Individual article performance
- Title, publish date, featured image
- Key metrics (views, read time, bounce rate)
- Engagement breakdown
- Trend indicator (up/down vs previous period)

**PerformanceTrendsChart.tsx** - Time-series visualization
- Line/area chart for views, engagement over time
- Date range presets (7d, 30d, 90d, custom)
- Multiple metric overlay option

**TopPerformersTable.tsx** - Sortable table
- Columns: Title, Views, Avg Read Time, Engagement, Published Date
- Click to view detailed analytics
- Export option (CSV)

**EngagementBreakdown.tsx** - Engagement details
- Scroll depth distribution
- Time on page histogram
- Bounce rate comparison
- Share distribution by platform

**DateRangeSelector.tsx** - Reusable date picker
- Preset options (Today, 7 days, 30 days, 90 days)
- Custom date range
- Compare to previous period toggle

### 3. Analytics Tracking Enhancement

**`src/lib/analytics/article-tracker.ts`**
- Client-side tracking utilities for blog posts
- Track: page views, scroll depth, time on page, click events
- Send events to API endpoint

### 4. Update Analytics Page

Replace placeholder at `src/app/(app)/admin/content/analytics/page.tsx`:
- Server component wrapper
- AnalyticsDashboard client component integration
- Use SWR for data fetching

## DATABASE REFERENCE

articleAnalytics table (already in schema):
```typescript
{
  id: uuid,
  workspaceId: uuid, // Multi-tenant
  postId: uuid, // References blogPosts
  date: timestamp, // Date of metrics
  
  // Core metrics
  pageViews: integer,
  uniqueViews: integer,
  avgTimeOnPage: integer, // seconds
  bounceRate: numeric,
  
  // Engagement
  scrollDepth: jsonb, // { '25': count, '50': count, '75': count, '100': count }
  clickEvents: integer,
  shares: jsonb, // { 'twitter': count, 'linkedin': count, etc }
  
  // Source breakdown
  trafficSource: jsonb, // { 'organic': count, 'social': count, etc }
  
  createdAt, updatedAt
}
```

## REQUIREMENTS

- Use NeptuneButton for all buttons
- All API routes must be workspace-scoped (multi-tenant)
- Validate all inputs with Zod schemas
- Use SWR for client-side data fetching
- Server components by default, 'use client' only when needed
- Include ARIA labels for accessibility
- Test on mobile viewport
- Charts should be responsive and accessible
- Error handling with user-friendly messages

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] Overview stats display correctly
- [ ] Date range filtering works
- [ ] Performance trends chart renders
- [ ] Top performers table sorts properly
- [ ] All actions have visual feedback
- [ ] Mobile responsive layout

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase E completion
2. Git commit: `feat(content-cockpit): Phase E - Article Analytics`
3. Create Phase F kickoff message for Use Case Studio

## DESIGN REFERENCE

Charts should use a consistent color palette:
- Primary metric: Indigo (#6366f1)
- Secondary metric: Emerald (#10b981)
- Warning/Decline: Amber (#f59e0b)
- Comparison/Previous: Gray (#9ca3af)

Card styling should match Hit List:
```tsx
<div className={cn(
  "rounded-xl bg-white p-4",
  "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
  "hover:-translate-y-px hover:shadow-lg",
  "transition-all duration-200"
)}>
```

