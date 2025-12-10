# Article Studio Build - Phase 4 Kickoff

## Instructions for New Cursor Agent

I need you to continue building the Article Studio feature for our GalaxyCo.ai platform. Phases 1-3 are complete and you'll be starting Phase 4.

**Required Reading Before You Begin:**
You MUST read these files completely before writing any code:
- Plan Document: `c:\Users\Owner\.cursor\plans\article_studio_build_3e8853b6.plan.md`
- `PROJECT_STATUS.md` (see "Article Studio" section at the top)
- `README.md`

---

## What's Already Built (Phases 1-3):

### Phase 1 - Database Schema:
- Tables: `topicIdeas`, `blogVoiceProfiles`, `articleSources`, `brainstormSessions`
- Extended `blogPosts` with `outline` (JSONB) and `layoutTemplate` columns
- Topic bank CRUD APIs (`/api/admin/topics`)
- AI topic generation API (`/api/admin/ai/topics/generate`)
- Voice profile API (`/api/admin/blog-profile`)

### Phase 2 - Topic Generator & Brainstorm:
- `TopicGenerator` component (`src/components/admin/ArticleStudio/TopicGenerator.tsx`)
- `BrainstormChat` component (`src/components/admin/ArticleStudio/BrainstormChat.tsx`)
- Streaming brainstorm API (`/api/admin/ai/brainstorm`)
- Outline from conversation API (`/api/admin/ai/outline/from-conversation`)
- Article Studio page (`/admin/content/article-studio`)

### Phase 3 - Layout Templates & Outline Editor:
- 7 layout templates in `src/lib/ai/article-layouts.ts` (Standard, How-To, Listicle, Case Study, Tool Review, News, Opinion)
- `LayoutPicker` component (`src/components/admin/ArticleStudio/LayoutPicker.tsx`)
- `OutlineEditor` component (`src/components/admin/ArticleStudio/OutlineEditor.tsx`)
- Outline generation API (`/api/admin/ai/outline`)
- Section regeneration API (`/api/admin/ai/outline/section`)
- Wizard flow at `/admin/content/new` (Topic → Layout → Outline → Editor)

---

## Your Task - Phase 4: AI-Assisted Writing (Editor Enhancement)

**Goal:** Add AI capabilities to the existing Tiptap editor with minimal UI.

### 1. Tiptap Extensions (`src/components/admin/TiptapEditor/extensions/`)
Create custom extensions:
- `AIAutocomplete.ts` - Continue writing from cursor position
- `AICommands.ts` - Command palette (/) integration
- `AISelectionMenu.ts` - Floating menu on text selection

### 2. AI Command Palette
Trigger: `/` at line start or `Cmd+J` anywhere

Commands (icons only, tooltips on hover):
- Continue writing... (Cmd+Enter)
- Rephrase selection
- Expand with detail
- Make more concise
- Find source for this
- Suggest image here
- Open brainstorm chat

### 3. Selection Menu (Minimal)
On text selection, show small floating bar with 4 icons:
- Improve, Rephrase, Shorten, Source

### 4. Inline AI Results
AI suggestions appear inline, highlighted with accept/reject/regenerate controls.

### 5. API Endpoints
- `POST /api/admin/ai/continue` - Continue writing (streaming)
- `POST /api/admin/ai/rewrite` - Rewrite selection with mode (improve|simplify|expand|shorten)

---

## Key Reference Files:
- Current Editor: `src/components/admin/TiptapEditor.tsx`
- Post Editor: `src/components/admin/PostEditorClient.tsx`
- Streaming Pattern: `src/app/api/admin/ai/brainstorm/route.ts`
- AI Providers: `src/lib/ai-providers.ts`
- Article Layouts: `src/lib/ai/article-layouts.ts`

---

## Strict Rules:
- Follow existing light-mode design (`bg-gray-50/50`, light badges)
- Use components from `components/ui/`
- TypeScript strict mode - NO `any` types without justification
- Use Zod validation for all API endpoints
- Use logger from `src/lib/logger.ts` - NO console.log
- WCAG compliance: ARIA labels, keyboard navigation
- Streaming responses where applicable (follow Neptune/brainstorm patterns)

---

## After Phase 4 Complete:
1. Update `README.md` with new features/endpoints
2. Update `PROJECT_STATUS.md` with implementation details
3. Run `npm run lint` and `npm run typecheck` - fix any issues
4. Git commit: `feat(article-studio): Phase 4 complete - AI-assisted writing`
5. Git push to remote

---

## Deliverables Checklist:
- [ ] AI Tiptap extensions (AIAutocomplete, AICommands, AISelectionMenu)
- [ ] Command palette component
- [ ] Selection menu component
- [ ] Inline suggestion rendering with accept/reject
- [ ] Continue API with streaming (`/api/admin/ai/continue`)
- [ ] Rewrite API (`/api/admin/ai/rewrite`)

Begin by reading the plan document, then implement Phase 4.

