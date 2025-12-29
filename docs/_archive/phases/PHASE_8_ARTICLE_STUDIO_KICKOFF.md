# Article Studio Build - Phase 8 Kickoff: Pre-Publish Review and Polish

I need you to continue building the Article Studio feature for our GalaxyCo.ai platform. Phases 1-7 are complete and you'll be building Phase 8: Pre-Publish Review and Polish.

## Required Reading Before You Begin

You MUST read these files completely before writing any code:

1. **Plan Document**: `c:\Users\Owner\.cursor\plans\article_studio_build_3e8853b6.plan.md`
2. **PROJECT_STATUS.md** (see "Article Studio - Phase 7 Complete" section at the top)
3. **README.md**

## Your Task - Phase 8: Pre-Publish Review and Polish

Build a comprehensive pre-publish quality checklist and SEO tools:

### PrePublishChecklist Component (`src/components/admin/ArticleStudio/PrePublishChecklist.tsx`)

Create a modal/panel component with these quality checks:

**Content Quality:**
- Title compelling (AI score 1-10 with feedback)
- Clear introduction hook (AI assessment)
- Actionable takeaways present

**SEO Checks:**
- Meta title length (target: 60 chars) with character counter
- Meta description length (target: 160 chars) with character counter
- Focus keyword presence check
- URL slug validation

**Sources:**
- All claims verified (count verified vs unverified)
- Source links working (check URLs accessible)
- Integration with existing `PrePublishVerification` component

**Visual:**
- Featured image set (required check)
- Alt text on images (accessibility)
- Proper image dimensions

### Auto-SEO Generation API (`/api/admin/ai/seo`)

- `POST /api/admin/ai/seo` - Generate SEO metadata from content
  - Input: article title, content, optional focus keyword
  - Output: suggested meta title, meta description, slug
  - Uses GPT-4o for intelligent suggestions
  - Follows SEO best practices (character limits, keyword placement)

### Preview Modes

Add preview functionality to PostEditorClient:
- Mobile preview (responsive iframe or modal)
- Desktop preview
- Launchpad live preview link (link to `/launchpad/[slug]` if published)

### Publish Flow Enhancement

Update the publish button flow in PostEditorClient:
- Show PrePublishChecklist before publishing
- Block publish if critical issues (no featured image, unverified claims)
- Allow override with explicit acknowledgment
- Show success state after publish

## Deliverables Checklist

- [ ] PrePublishChecklist component with all quality checks
- [ ] SEO auto-generation API
- [ ] Preview mode selector in editor
- [ ] Publish flow with checklist gate
- [ ] Update README.md and PROJECT_STATUS.md
- [ ] Update plan document to mark Phase 8 deliverables complete
- [ ] Run `npm run lint` and `npm run typecheck` - fix any issues
- [ ] Git commit with: `feat(article-studio): Phase 8 complete - Pre-Publish Review`
- [ ] Git push to remote

## Technical Guidelines

1. Follow the existing light-mode UI design (bg-gray-50/50 backgrounds, light badges)
2. Use existing Button, Card, Badge, Input components from `components/ui/`
3. All interactive elements need ARIA labels and keyboard navigation
4. Use Zod validation for all API endpoints
5. Use logger from `src/lib/logger.ts` - NO console.log
6. Error handling: All async functions must have try-catch

## Reference Files

Look at these existing implementations for patterns:
- `src/components/admin/ArticleStudio/PrePublishVerification.tsx` - Source verification modal
- `src/components/admin/PostEditorClient.tsx` - Current editor wrapper
- `src/app/api/admin/ai/source/route.ts` - Example AI endpoint with web checks

Begin by reading the plan document to understand the full context, then implement Phase 8.

