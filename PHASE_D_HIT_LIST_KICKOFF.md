# TASK: Content Cockpit - Phase D: Article Hit List

## CONTEXT

Phase C is complete ✅. The Sources Hub is now live with:
- Full CRUD API routes for content sources
- AI source review (quality, relevance, authority scoring)
- AI source discovery for finding new sources
- SourceCard, SourcesList, SourcesQueueSidebar components
- AddSourceDialog with AI review integration
- Weekly Trigger.dev job for automatic source discovery
- Mobile-responsive with bottom sheet for suggestions

Phase D builds the Article Hit List - a prioritized topic queue with AI-powered scoring and drag-and-drop reordering.

## FILES TO REVIEW FIRST

1. `.cursor/plans/content_cockpit_implementation_e7966eac.plan.md` - Full implementation plan (Phase D section)
2. `src/app/(app)/admin/content/hit-list/page.tsx` - Current placeholder (to be replaced)
3. `src/db/schema.ts` - topicIdeas table with Hit List fields (already added in Phase A)
4. `src/components/admin/ContentCockpit/SourcesHub/` - Reference for patterns
5. `src/components/ui/neptune-button.tsx` - Use for all buttons

## PHASE D DELIVERABLES

### 1. API Routes

**`src/app/api/admin/hit-list/route.ts`**
- GET: List hit list items with filters (status, priority, date range)
- POST: Add topic idea to hit list

**`src/app/api/admin/hit-list/[id]/route.ts`**
- GET: Get single hit list item with full details
- PATCH: Update item (status, priority, etc.)
- DELETE: Remove from hit list

**`src/app/api/admin/hit-list/[id]/progress/route.ts`**
- PATCH: Update wizard progress when writing article

**`src/app/api/admin/hit-list/reorder/route.ts`**
- POST: Manual reorder of hit list items

**`src/app/api/admin/ai/hit-list/prioritize/route.ts`**
- POST: AI calculates priority scores for all items

### 2. Priority Scoring Algorithm

Create: `src/lib/ai/hit-list-prioritizer.ts`

Weighted scoring system (total 100 points):
- **Content Gap (0-20)**: How much this fills a gap in existing content
- **Trending Score (0-20)**: Industry trend relevance
- **Engagement Potential (0-20)**: Predicted reader interest
- **Seasonality (0-15)**: Time-sensitive relevance
- **Competitor Coverage (0-15)**: What competitors are writing
- **User Sentiment (0-10)**: Positive signals from audience

Each factor returns a score and reasoning note.

### 3. UI Components (`src/components/admin/ContentCockpit/HitList/`)

**HitListPage.tsx** - Main page layout
- Header with back button and "Add Topic" CTA
- Priority score legend
- Drag-and-drop sortable list
- Filters and view options

**HitListItem.tsx** - Individual topic item
- Priority score badge with color coding
- Title, description, estimated time
- Progress indicator (if writing started)
- Actions: Start Writing, Edit, Archive, Delete
- Drag handle for reordering

**PriorityScoreBreakdown.tsx** - Expandable score details
- Shows all 6 scoring factors
- Score bar for each factor
- AI reasoning notes

**HitListFilters.tsx** - Filter toolbar
- Filter by status (queued, in-progress, published)
- Filter by priority level
- Sort options (priority, date added, target date)
- Search by title

**AddToHitListDialog.tsx** - Add existing topic or create new
- Search existing topic ideas
- Create new topic option
- Set priority, target date, estimated time

### 4. Scheduled Job (Trigger.dev)

**`src/trigger/hit-list-prioritization.ts`**
- Runs daily at 6 AM UTC
- Steps:
  1. Gather external signals (industry trends, competitor content)
  2. Analyze internal signals (engagement patterns, content gaps)
  3. Calculate weighted scores for each hit list item
  4. Update priorityScore in database
  5. Reorder list by score
  6. Create alert badge for significant priority changes

### 5. Update Hit List Page

Replace placeholder at `src/app/(app)/admin/content/hit-list/page.tsx`:
- Server component wrapper
- HitListPage client component integration
- Use SWR for data fetching

## DATABASE REFERENCE

topicIdeas table Hit List fields (already in schema):
```typescript
{
  // ... existing fields ...
  
  // Hit List fields (added in Phase A)
  hitListPosition: integer, // For manual reorder
  priorityScore: integer, // 0-100 calculated score
  hitListAddedAt: timestamp,
  targetPublishDate: timestamp,
  assignedTo: uuid,
  estimatedTimeMinutes: integer,
  difficultyLevel: hitListDifficultyEnum, // easy, medium, hard, expert
  wizardProgress: jsonb, // Tracks Article Studio progress
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
- Error handling with user-friendly messages
- Drag-and-drop must work on mobile (touch events)

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] CRUD operations work for hit list items
- [ ] Priority scoring produces meaningful scores (0-100)
- [ ] Drag-and-drop reordering works on desktop and mobile
- [ ] Filters and search work correctly
- [ ] AI prioritization updates scores
- [ ] All actions have visual feedback (loading, success, error)
- [ ] Mobile responsive layout

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase D completion
2. Git commit: `feat(content-cockpit): Phase D - Article Hit List`
3. Create Phase E kickoff message for Article Analytics

