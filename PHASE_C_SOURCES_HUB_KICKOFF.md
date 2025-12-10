# TASK: Content Cockpit - Phase C: Sources Hub

## CONTEXT

Phase B is complete ✅. The Content Cockpit dashboard is now live with:
- ToolCard and StatsBar components
- 6-tool grid layout with navigation
- AlertBadgePopover in header
- Posts list moved to /admin/content/posts
- Placeholder pages for all future features

Phase C builds the Sources Hub - a system for bookmarking research sites with AI review and suggestions.

## FILES TO REVIEW FIRST

1. `.cursor/plans/content_cockpit_implementation_e7966eac.plan.md` - Full implementation plan (Phase C section)
2. `src/app/(app)/admin/content/sources/page.tsx` - Current placeholder (to be replaced)
3. `src/db/schema.ts` - contentSources table definition
4. `src/components/ui/neptune-button.tsx` - Use for all buttons
5. `src/components/admin/ContentCockpit/ToolCard.tsx` - Reference for styling patterns

## PHASE C DELIVERABLES

### 1. API Routes

**`src/app/api/admin/content-sources/route.ts`**
- GET: List sources with filtering (status, type, tags)
- POST: Create new source with workspace scoping

**`src/app/api/admin/content-sources/[id]/route.ts`**
- GET: Get single source details
- PATCH: Update source (status, notes, etc.)
- DELETE: Delete source

**`src/app/api/admin/content-sources/suggestions/route.ts`**
- GET: Get AI-suggested sources queue

**`src/app/api/admin/ai/sources/review/route.ts`**
- POST: AI reviews a source URL for quality, relevance, authority

**`src/app/api/admin/ai/sources/discover/route.ts`**
- POST: AI finds new sources based on workspace topics

### 2. UI Components (`src/components/admin/ContentCockpit/SourcesHub/`)

**SourcesHubPage.tsx** - Main page layout
- Header with back button and "Add Source" CTA
- Active sources list
- Suggestions queue sidebar (collapsible on mobile)

**SourcesList.tsx** - Active sources list
- Grid or list view toggle
- Filters by type, status
- Pagination or infinite scroll

**SourceCard.tsx** - Individual source display
- URL, name, description
- Type badge, status indicator
- AI review score (if available)
- Actions: Edit, Archive, Delete

**SourcesQueueSidebar.tsx** - AI suggestions
- Suggested sources from AI
- Accept/Reject actions
- Badge count for queue

**AddSourceDialog.tsx** - Manual add with AI review
- URL input with validation
- Name, description, type fields
- AI review trigger before save
- Override option if AI flags issues

### 3. AI Review Logic

When user adds a source:
1. Validate URL format
2. AI analyzes URL for:
   - Quality: Is the site reputable?
   - Relevance: Does it match workspace topics?
   - Authority: Domain authority, update frequency
3. Return confidence score (0-100) and notes
4. Show warning if score < 70 with override option

### 4. Scheduled Job (Trigger.dev)

**`src/trigger/content-source-discovery.ts`**
- Runs weekly (Monday 9 AM)
- Steps:
  1. Get workspace's existing sources and topic ideas
  2. Use AI to search for relevant new sources
  3. Add to suggestions queue (status: 'suggested')
  4. Create alert badge for new suggestions

### 5. Update Sources Hub Page

Replace placeholder at `src/app/(app)/admin/content/sources/page.tsx`:
- Server component wrapper
- Client component for interactive features
- Use SWR for data fetching
- Integrate with API routes

## DATABASE REFERENCE

contentSources table fields:
```typescript
{
  id: uuid,
  workspaceId: uuid, // Required for all queries
  name: text,
  url: text,
  description: text,
  type: contentSourceTypeEnum, // news, research, competitor, etc.
  status: contentSourceStatusEnum, // active, suggested, rejected, archived
  aiReviewScore: integer, // 0-100
  aiReviewNotes: text,
  tags: text[],
  engagementCount: integer,
  lastCheckedAt: timestamp,
  addedBy: uuid,
  createdAt: timestamp,
  updatedAt: timestamp,
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

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] CRUD operations work for sources
- [ ] AI review returns meaningful feedback
- [ ] Suggestions queue displays correctly
- [ ] Approve/reject from queue works
- [ ] Mobile responsive layout
- [ ] All actions have visual feedback (loading, success, error)

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase C completion
2. Git commit: `feat(content-cockpit): Phase C - Sources Hub`
3. Create Phase D kickoff message for Hit List

