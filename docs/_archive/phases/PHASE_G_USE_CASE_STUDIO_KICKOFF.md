# TASK: Content Cockpit - Phase G: Use Case Studio

## CONTEXT

Phase F is complete ✅. The Guided Article Flow is now live with:
- "Start Writing" button on Hit List items
- Article Studio pre-fills from topic data
- Progress tracking through wizard stages
- Auto-completion when article publishes

Phase G builds the Use Case Studio - a 7-step wizard for creating user persona roadmaps.

## FILES TO REVIEW FIRST

1. `c:\Users\Owner\.cursor\plans\content_cockpit_implementation_e7966eac.plan.md` - Full plan (Phase G section)
2. `src/app/(app)/admin/content/use-cases/page.tsx` - Current placeholder (to be replaced)
3. `src/db/schema.ts` - useCases table (already added in Phase A)
4. `src/components/admin/ContentCockpit/HitList/` - Reference for component patterns

## PHASE G DELIVERABLES

### 1. API Routes

**`src/app/api/admin/use-cases/route.ts`**
- GET: List all use cases for workspace (with filtering by status)
- POST: Create new use case (draft status)

**`src/app/api/admin/use-cases/[id]/route.ts`**
- GET: Get single use case with all fields
- PATCH: Update use case (partial updates for wizard steps)
- DELETE: Delete use case

**`src/app/api/admin/use-cases/[id]/generate-roadmap/route.ts`**
- POST: AI generates tailored roadmap based on all wizard inputs

**`src/app/api/admin/use-cases/match/route.ts`**
- POST: Match user onboarding answers to best use case template
- Returns the matched use case's pre-built roadmap

### 2. UI Components (`src/components/admin/ContentCockpit/UseCaseStudio/`)

**UseCaseWizard.tsx** - Main wizard container
- Step progress indicator (7 steps)
- Navigation (Back/Next/Save Draft)
- Form state management with React Hook Form
- Auto-save on step completion

**steps/BasicInfoStep.tsx** - Step 1
- Use case name (required)
- Description (optional textarea)
- Category dropdown (b2b_saas, b2c_app, agency, enterprise, solopreneur, ecommerce, creator, consultant, internal_team, other)
- Icon/emoji selector

**steps/PersonasStep.tsx** - Step 2
- Add 1-5 target personas
- For each: name, role, pain points (list), goals (list)
- Add/remove persona buttons
- Drag to reorder

**steps/PlatformMappingStep.tsx** - Step 3
- Checkbox grid of GalaxyCo platform features
- Grouped by category (AI Assistant, CRM, Marketing, Finance, etc.)
- Selected features highlight with indigo background
- Tooltips with feature descriptions

**steps/UserJourneyStep.tsx** - Step 4
- Define journey stages (default: Awareness, Consideration, Decision, Onboarding, Success)
- For each stage: name, description, key actions, success metrics
- Add/remove stages
- Drag to reorder

**steps/MarketingStep.tsx** - Step 5
- Key messaging points (add/remove tag input)
- Recommended channels (checkboxes: Email, Social, Content, Paid, Events)
- Tone selector (Professional, Friendly, Technical, Casual)
- Content themes (tag input)

**steps/OnboardingQuestionsStep.tsx** - Step 6
- Build 3-5 quiz questions for matching users
- Each question: text, 2-4 answer options
- Each answer has weight (0-100) for this use case
- Preview quiz flow button

**steps/ReviewStep.tsx** - Step 7 (Final)
- Summary cards for all 6 previous steps
- "Generate Roadmap" button (calls AI)
- Preview generated roadmap steps
- Publish / Save as Draft buttons

**UseCaseCard.tsx** - List item card
- Name, category badge, status badge
- Persona count, question count indicators
- Last updated date
- Actions dropdown (Edit, Duplicate, Delete)

**UseCaseListPage.tsx** - Main list page
- Grid of UseCaseCards
- "Create New Use Case" button
- Filter tabs (All, Draft, Complete, Published)
- Search input

### 3. AI Roadmap Generator (`src/lib/ai/use-case-roadmap-generator.ts`)

Function that takes use case data and generates:
- Personalized onboarding steps (5-10 steps)
- Feature activation sequence
- Success milestones with metrics
- Estimated timeline (days/weeks)

Uses GPT-4o with structured output.

### 4. Pages

**`src/app/(app)/admin/content/use-cases/page.tsx`**
- Replace placeholder with UseCaseListPage

**`src/app/(app)/admin/content/use-cases/new/page.tsx`**
- UseCaseWizard in create mode

**`src/app/(app)/admin/content/use-cases/[id]/page.tsx`**
- UseCaseWizard in edit mode (loads existing data)

## DATABASE REFERENCE

useCases table fields (from schema.ts):
- id, workspaceId, name, description, category, icon
- status (draft, complete, published, archived)
- personas (jsonb array)
- platformFeatures (jsonb array of feature IDs)
- journeyStages (jsonb array)
- messaging (jsonb object)
- onboardingQuestions (jsonb array)
- generatedRoadmap (jsonb - AI output)
- createdAt, updatedAt, publishedAt

## REQUIREMENTS

- Use NeptuneButton for all buttons
- All APIs workspace-scoped (multi-tenant)
- Zod validation on all inputs
- SWR for client-side data fetching
- Auto-save wizard progress to prevent data loss
- ARIA labels on all interactive elements
- Mobile responsive (wizard steps stack vertically)

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] Use case CRUD operations work
- [ ] All 7 wizard steps save correctly
- [ ] AI roadmap generates meaningful content
- [ ] User matching returns correct roadmap
- [ ] Mobile layout works

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase G completion
2. Git commit: `feat(content-cockpit): Phase G - Use Case Studio`
3. Create Phase H kickoff message for Neptune AI Integration

