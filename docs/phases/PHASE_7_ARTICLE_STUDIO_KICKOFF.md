# Article Studio Build - Phase 7 Kickoff: Blog Intelligence (Adaptive Learning)

I need you to continue building the Article Studio feature for our GalaxyCo.ai platform. Phases 1-6 are complete and you'll be building Phase 7: Blog Intelligence (Adaptive Learning).

## Required Reading Before You Begin

You MUST read these files completely before writing any code:

1. **Plan Document**: `c:\Users\Owner\.cursor\plans\article_studio_build_3e8853b6.plan.md`
2. **PROJECT_STATUS.md** (see "Article Studio - Phase 6 Complete" section at the top)
3. **README.md**

## What's Already Built (Phases 1-6):

### Phase 1 - Database Schema:
- `topicIdeas`, `blogVoiceProfiles`, `articleSources`, `brainstormSessions` tables
- Extended `blogPosts` with `outline` (JSONB) and `layoutTemplate` columns

### Phase 2 - Topic Generation & Brainstorming:
- Topic bank CRUD APIs (`/api/admin/topics`)
- AI topic generation API (`/api/admin/ai/topics/generate`)
- Voice profile API (`/api/admin/blog-profile`)
- Streaming brainstorm API (`/api/admin/ai/brainstorm`)
- `TopicGenerator`, `BrainstormChat` components

### Phase 3 - Layout Templates & Outline Editor:
- 7 layout templates in `src/lib/ai/article-layouts.ts`
- Outline generation APIs (`/api/admin/ai/outline`, `/api/admin/ai/outline/section`)
- `LayoutPicker`, `OutlineEditor` components
- Wizard flow at `/admin/content/new`

### Phase 4 - AI-Assisted Writing:
- Streaming continue API (`/api/admin/ai/continue`)
- Rewrite API with 7 modes (`/api/admin/ai/rewrite`)
- `AICommandPalette`, `AISelectionMenu`, `AIInlineSuggestion` components
- Enhanced `TiptapEditor` with all AI features

### Phase 5 - Source Verification:
- Source finding API (`/api/admin/ai/source`) with web search
- Sources CRUD API (`/api/admin/sources`)
- `SourcePanel`, `PrePublishVerification` components
- Inline citation insertion in editor

### Phase 6 - Image Generation and Upload:
- AI image generation API (`/api/admin/ai/image`) with DALL-E 3
- Image upload API (`/api/admin/upload/image`) to Vercel Blob
- `AIImageModal` component with style/size selectors
- Enhanced featured image section in `PostEditorClient`
- In-article image suggestions wired to `AICommandPalette`

---

## Your Task - Phase 7: Blog Intelligence (Adaptive Learning)

Build AI learning system that adapts to your blog's voice and identifies content gaps:

### 1. Create Voice Profile Analyzer API (`/api/admin/blog-profile/analyze`):

**Analyze Published Articles:**
- Fetch all published posts for the workspace
- Use GPT-4o to analyze writing patterns across posts
- Extract and update:
  - `toneDescriptors` (array of adjectives describing voice: friendly, technical, conversational, etc.)
  - `examplePhrases` (common phrases/transitions the author uses)
  - `avoidPhrases` (phrases that don't match the voice)
  - `avgSentenceLength` (calculated from content)
  - `structurePreferences` (JSONB with patterns like "uses bullet lists often", "short paragraphs")
- Update `analyzedPostCount` and `lastAnalyzedAt` fields
- Return analysis summary with before/after comparison

### 2. Create Voice Profile Settings Component (`src/components/admin/ArticleStudio/VoiceProfileSettings.tsx`):

**Profile Display/Edit UI:**
- Display current voice profile in readable format
- Edit tone descriptors (tag input with suggestions)
- Edit example phrases (list with add/remove)
- Edit avoid phrases (list with add/remove)
- Show analyzed post count and last analyzed date
- "Analyze My Blog" button to trigger analysis
- Loading state during analysis
- Before/after comparison after analysis

### 3. Voice-Aware Generation Prompts:

**Update AI Generation APIs to use voice profile:**
- Load workspace voice profile at start of requests
- Inject voice profile into system prompts for:
  - `/api/admin/ai/continue` - Continue writing in voice
  - `/api/admin/ai/rewrite` - Rewrite maintaining voice
  - `/api/admin/ai/outline` - Generate outlines matching structure preferences
  - `/api/admin/ai/brainstorm` - Brainstorm in the blog's voice

**Create helper function:**
- `src/lib/ai/voice-profile.ts` - `getVoicePromptSection(workspaceId)` returns formatted prompt section

### 4. Content Gap Analysis in Topic Generator:

**Enhance `/api/admin/ai/topics/generate`:**
- Query existing published posts for the workspace
- Analyze topic coverage and identify gaps
- Flag if suggested topic is similar to existing content
- Return performance data hints (which topic types perform well)
- Add `existingSimilar` field to topic suggestions

**Update `TopicGenerator` Component:**
- Show warning badge if topic is similar to existing post
- Show "Similar: [Post Title]" link to existing post
- Add "Content Gaps" section showing uncovered topics
- Show topic type performance insights (if analytics data available)

### 5. Add Voice Profile Settings Page (`/admin/settings/voice-profile`):

**Or integrate into existing settings:**
- Route: `/admin/settings/voice-profile` OR tab in existing settings
- Uses `VoiceProfileSettings` component
- Accessible from Content Studio header or settings menu

---

## Key Reference Files:

- **Voice Profile Schema**: `src/db/schema.ts` - search for `blogVoiceProfiles`
- **Existing Voice Profile API**: `src/app/api/admin/blog-profile/route.ts`
- **Topic Generator**: `src/components/admin/ArticleStudio/TopicGenerator.tsx`
- **AI Continue API**: `src/app/api/admin/ai/continue/route.ts`
- **AI Rewrite API**: `src/app/api/admin/ai/rewrite/route.ts`
- **AI Outline API**: `src/app/api/admin/ai/outline/route.ts`
- **OpenAI Provider**: `src/lib/ai-providers.ts` - `getOpenAI()` function
- **Logger**: `src/lib/logger.ts`

---

## Environment Variables Needed:

- `OPENAI_API_KEY` - Already configured (for GPT-4o analysis)
- `DATABASE_URL` - Already configured

---

## Strict Rules:

1. Follow existing light-mode design (`bg-gray-50/50`, light badges)
2. Use components from `components/ui/`
3. TypeScript strict mode - NO `any` types without justification
4. Use Zod validation for all API endpoints
5. Use logger from `src/lib/logger.ts` - NO console.log
6. WCAG compliance: ARIA labels, keyboard navigation
7. Mobile-first responsive design
8. Voice profile must be optional - generation should work without it

---

## After Phase 7 Complete:

1. Update `README.md` with new features/endpoints
2. Update `PROJECT_STATUS.md` with implementation details
3. Update the plan document to mark Phase 7 deliverables complete
4. Run `npm run lint` and `npm run typecheck` - fix any issues
5. Git commit with: `feat(article-studio): Phase 7 complete - Blog Intelligence`
6. Git push to remote

---

## Deliverables Checklist:

- [ ] Voice profile analyzer API (`/api/admin/blog-profile/analyze`)
- [ ] VoiceProfileSettings component
- [ ] Voice-aware generation prompts (update existing APIs)
- [ ] `getVoicePromptSection()` helper function
- [ ] Content gap analysis in topic generator
- [ ] Voice profile settings page/route

Begin by reading the plan document to understand the full context, then implement Phase 7.

