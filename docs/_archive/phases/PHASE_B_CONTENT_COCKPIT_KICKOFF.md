# TASK: Content Cockpit - Phase B: Dashboard UI Redesign

## CONTEXT

Phase A is complete ✅ (commit: 1c3b1b4). The database foundation is now in place with:
- 7 new enums for content management
- 5 new tables (contentSources, useCases, articleAnalytics, contentAiLearning, alertBadges)
- Enhanced topicIdeas table with Hit List fields
- NeptuneButton component with standardized styling
- Alert Badge system with components and API routes

Phase B transforms the Content tab from a simple posts list into a comprehensive Content Cockpit dashboard.

## FILES TO REVIEW FIRST

1. `.cursor/plans/content_cockpit_implementation_e7966eac.plan.md` - Full implementation plan
2. `src/app/(app)/admin/content/page.tsx` - Current Content tab (to be redesigned)
3. `src/components/ui/neptune-button.tsx` - Use this for all buttons
4. `src/components/admin/AlertBadges/AlertBadgePopover.tsx` - Alert bell to add to header

## PHASE B DELIVERABLES

### 1. Tool Card Component (`src/components/admin/ContentCockpit/ToolCard.tsx`)

Reusable card for each Content Cockpit tool:
```tsx
interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badgeCount?: number;
  badgeColor?: string;
  href: string;
}
```

Design:
- White background with subtle shadow
- Icon in gradient badge
- Title and description
- Optional count badge (for queue items)
- Neptune hover effect (lift + shadow)
- Link to tool page

### 2. Content Cockpit Dashboard (`src/app/(app)/admin/content/page.tsx`)

Transform from posts list to tool card grid:

```
+------------------------------------------+
|  CONTENT COCKPIT              [Alert Bell]|
+------------------------------------------+
|  [Article Studio] [Hit List] [Sources]   |
|  [Use Case Studio] [Analytics] [Posts]   |
+------------------------------------------+
|  Quick Stats Bar (Published, In Queue,   |
|  Views This Month, Alerts)               |
+------------------------------------------+
```

Tools Grid:
1. **Article Studio** - Create AI-assisted articles
   - Icon: Sparkles
   - Links to: `/admin/content/article-studio`
   
2. **Article Hit List** - Prioritized topic queue
   - Icon: ListOrdered
   - Badge: Count of queued items
   - Links to: `/admin/content/hit-list` (create in later phase)

3. **Sources Hub** - Bookmarked research sites
   - Icon: BookOpen
   - Badge: Count of suggested sources
   - Links to: `/admin/content/sources` (create in later phase)

4. **Use Case Studio** - Roadmap templates
   - Icon: Route
   - Links to: `/admin/content/use-cases` (create in later phase)

5. **Article Analytics** - Performance insights
   - Icon: BarChart3
   - Links to: `/admin/content/analytics` (create in later phase)

6. **All Posts** - Traditional posts list
   - Icon: FileText
   - Badge: Total posts count
   - Links to: `/admin/content/posts`

### 3. Move Posts List to Subpage

Create: `src/app/(app)/admin/content/posts/page.tsx`
- Move current posts list functionality here
- Add "Back to Content Cockpit" link

### 4. Stats Bar Component (`src/components/admin/ContentCockpit/StatsBar.tsx`)

Display quick stats:
- Published articles count
- In Queue (hit list items)
- Views this month
- Active alerts count

### 5. Header Integration

Add AlertBadgePopover to the Content Cockpit header:
```tsx
import { AlertBadgePopover } from '@/components/admin/AlertBadges';

// In header:
<AlertBadgePopover />
```

## REQUIREMENTS

- Use NeptuneButton for all buttons
- Follow existing code patterns
- Use SWR for stats data fetching
- Server component for page, client components for interactive parts
- Include ARIA labels for accessibility
- Test on mobile viewport

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors  
- [ ] Tool cards display correctly with hover effects
- [ ] Stats bar shows real data
- [ ] Alert badge shows in header
- [ ] All links work (even if target pages are placeholders)
- [ ] Mobile responsive layout

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase B completion
2. Git commit: `feat(content-cockpit): Phase B - Dashboard UI redesign`
3. Create Phase C kickoff message for Sources Hub

## DESIGN REFERENCE

Use Neptune button styling consistently:
```tsx
<NeptuneButton variant="default">
  <Sparkles className="h-4 w-4" />
  Article Studio
</NeptuneButton>
```

Tool card hover should use the same lift effect:
```css
hover:-translate-y-px hover:shadow-lg transition-all duration-150
```

