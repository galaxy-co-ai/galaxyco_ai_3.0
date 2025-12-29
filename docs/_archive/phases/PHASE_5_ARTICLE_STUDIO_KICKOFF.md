# Article Studio Build - Phase 5 Kickoff

Copy and paste this message to start the next Cursor agent conversation:

---

## Article Studio Build - Phase 5 Continuation

I need you to continue building the Article Studio feature for our GalaxyCo.ai platform. Phases 1-4 are complete and you'll be starting Phase 5.

**Required Reading Before You Begin:**
You MUST read these files completely before writing any code:
- Plan Document: c:\Users\Owner\.cursor\plans\article_studio_build_3e8853b6.plan.md
- PROJECT_STATUS.md (see "Article Studio" section at the top)
- README.md

**What's Already Built (Phases 1-4):**
- Database schema: topicIdeas, blogVoiceProfiles, articleSources, brainstormSessions tables
- Extended blogPosts with outline (JSONB) and layoutTemplate columns
- Topic bank CRUD APIs (/api/admin/topics)
- AI topic generation API (/api/admin/ai/topics/generate)
- Voice profile API (/api/admin/blog-profile)
- Streaming brainstorm API (/api/admin/ai/brainstorm)
- Outline generation APIs (/api/admin/ai/outline, /api/admin/ai/outline/section)
- TopicGenerator, BrainstormChat, LayoutPicker, OutlineEditor components
- Article Studio page (/admin/content/article-studio)
- Wizard flow at /admin/content/new (Topic → Layout → Outline → Editor)
- **Phase 4:** AI-assisted writing in Tiptap editor:
  - Streaming continue API (/api/admin/ai/continue)
  - Rewrite API with 7 modes (/api/admin/ai/rewrite)
  - AICommandPalette (Cmd+J or / trigger)
  - AISelectionMenu (floating menu on text selection)
  - AIInlineSuggestion (accept/reject/regenerate controls)
  - Enhanced TiptapEditor with all AI features

**Your Task - Phase 5: Source Verification System**
Build fact-checking and citation capabilities:
1. Create SourcePanel sidebar component (src/components/admin/ArticleStudio/SourcePanel.tsx):
   - List of sources attached to article
   - "Find Source" button for selected text
   - Manual source addition form
   - Verification status per source (verified/unverified/failed)
2. Create source finding API (/api/admin/ai/source):
   - Uses web search (Perplexity/Google CSE) to find supporting sources
   - Returns: title, URL, publication, relevant quote, confidence score
   - If cannot verify, return warning (NOT a made-up source)
3. Add inline citation insertion to editor:
   - Auto-insert "According to [Source](url)..." format
   - Add source to articleSources table
   - Flag unverified claims
4. Create pre-publish verification check:
   - List all unverified claims with suggestions
   - Require resolution before publish (or explicit override)
5. Wire to existing articleSources database table

**Key Reference Files:**
- Article Sources Schema: src/db/schema.ts (search for "articleSources")
- Current Editor: src/components/admin/TiptapEditor/index.tsx
- Post Editor: src/components/admin/PostEditorClient.tsx
- AI Providers: src/lib/ai-providers.ts
- Web Search Pattern: src/lib/web-search.ts (if exists) or src/app/api/assistant/chat/route.ts

**Strict Rules:**
- Follow existing light-mode design (bg-gray-50/50, light badges)
- Use components from components/ui/
- TypeScript strict mode - NO any types without justification
- Use Zod validation for all API endpoints
- Use logger from src/lib/logger.ts - NO console.log
- WCAG compliance: ARIA labels, keyboard navigation
- After Phase 5 complete: Update README.md, PROJECT_STATUS.md, run lint/typecheck, git commit with "feat(article-studio): Phase 5 complete", git push

Begin by reading the plan document, then implement Phase 5.

---

