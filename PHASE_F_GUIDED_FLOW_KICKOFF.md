# TASK: Content Cockpit - Phase F: Guided Article Flow

## CONTEXT

Phase E is complete ✅. The Article Analytics dashboard is now live with:
- Overview API with total views, unique visitors, avg metrics, and trends
- Articles list API with sorting, filtering, pagination, and engagement scores
- Client-side tracking utility (ArticleTracker class)
- 7 UI components for analytics visualization

Phase F connects the Hit List to Article Studio, enabling a seamless writing flow.

## FILES TO REVIEW FIRST

1. `c:\Users\Owner\.cursor\plans\content_cockpit_implementation_e7966eac.plan.md` - Full plan (Phase F section)
2. `src/components/admin/ContentCockpit/HitList/HitListItem.tsx` - Add "Start Writing" button
3. `src/app/(app)/admin/content/article-studio/` - Article Studio to receive pre-filled data
4. `src/app/api/admin/hit-list/[id]/progress/route.ts` - Progress tracking API

## PHASE F DELIVERABLES

### 1. Hit List "Start Writing" Button

**Modify: `src/components/admin/ContentCockpit/HitList/HitListItem.tsx`**

Add "Start Writing" button that:
- Navigates to Article Studio with `?topicId={id}` query param
- Only shows for items with status 'queued' or 'in_progress'
- Uses NeptuneButton styling

### 2. Article Studio Pre-fill Integration

**Modify: `src/app/(app)/admin/content/article-studio/page.tsx`**

When `topicId` query param exists:
1. Fetch topic idea data from API
2. Pre-fill title with topic title
3. Pre-fill description/brief with topic description
4. Show "Writing from Hit List" badge
5. Store topicId in session for progress tracking

### 3. Wizard Progress Tracking

**Create: `src/lib/hooks/useHitListProgress.ts`**

Hook that:
- Tracks which Article Studio step user is on
- Sends progress updates to `/api/admin/hit-list/[id]/progress`
- Debounces updates (max 1 per 5 seconds)

**Progress stages:**
- `topic_selected` (0%)
- `brainstorm_started` (15%)
- `outline_created` (30%)
- `writing_started` (50%)
- `first_draft_complete` (70%)
- `editing` (85%)
- `ready_to_publish` (95%)
- `published` (100%)

### 4. Auto-Completion on Publish

**Modify: `src/app/api/admin/blog/[id]/route.ts`** (or publish endpoint)

When article status changes to 'published':
1. Check if article has linked `topicId`
2. If yes, update topic idea:
   - Set status to 'published'
   - Set resultingPostId to the published post ID
   - Set wizardProgress to 'published' (100%)
3. Create success alert badge: "Article '{title}' published from Hit List!"

### 5. Hit List Item Status Display

**Modify: `src/components/admin/ContentCockpit/HitList/HitListItem.tsx`**

Show progress indicator:
- Progress bar (0-100%)
- Current stage label
- "Resume Writing" button if progress > 0%
- Link to published article if status = 'published'

### 6. API Updates

**Modify: `src/app/api/admin/hit-list/[id]/progress/route.ts`**

PATCH endpoint should:
- Accept `{ stage: string, percentage: number }`
- Update `wizardProgress` jsonb field
- Update `status` based on stage (in_progress, published)

## REQUIREMENTS

- Use NeptuneButton for all buttons
- Progress updates must be workspace-scoped
- Debounce progress API calls to avoid spam
- Handle edge cases (topic deleted mid-write, etc.)
- Show loading states during navigation

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] "Start Writing" navigates to Article Studio with topic pre-filled
- [ ] Progress bar updates as user moves through wizard
- [ ] Publishing marks hit list item complete
- [ ] "Resume Writing" works for in-progress items
- [ ] Published items link to final article

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase F completion
2. Git commit: `feat(content-cockpit): Phase F - Guided Article Flow`
3. Create Phase G kickoff message for Use Case Studio

