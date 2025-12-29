# GalaxyCo UX Architecture Session Handoff

**Date:** December 27, 2024
**Purpose:** Enable a fresh Claude Code session to continue UX architecture work without context loss.

---

## Executive Summary

GalaxyCo.ai is a production SaaS platform (Next.js 16, React 19, TypeScript) targeting 5 verticals: B2B SaaS, Agencies, Consultants, Professional Services, and Sales Teams. The platform is ~80% feature-complete but has critical UX/flow problems that would tank conversion if launched today.

**The core problem:** Features exist but there's no user journey. Users land in a dashboard, see 13 navigation items, empty states everywhere, and no clear path to value.

**The solution:** Implement vertical-based onboarding that was already designed (see docs below) but never built.

---

## Critical Documents to Read First

All in `docs/launch/Vertical Use Cases/`:

1. `06_vertical_onboarding_path_mapping.md` - **READ THIS FIRST** - Defines exactly what onboarding should look like per vertical
2. `07_neptune_vertical_system_prompts.md` - Neptune's behavior per vertical
3. `01_b2b_saas_and_tech_startups.md` - B2B SaaS use case
4. `02_marketing_creative_agencies.md` - Agency use case
5. `03_consultants_coaches.md` - Consultant use case
6. `04_professional_services.md` - Professional services use case
7. `05_sales_teams_sdrs.md` - Sales/SDR use case

**Also read:** `docs/launch/chatgpt-ux-conversation.md` (user will add this - contains detailed UX architecture discussion)

---

## Current State Assessment

### What Exists (88+ routes)
- Dashboard with Neptune AI assistant
- CRM (leads, contacts, deals, organizations)
- Conversations (multi-channel messaging)
- Marketing (campaigns, templates)
- Finance HQ (integrations dashboard)
- My Agents page with 5 tabs (Activity, Messages, Teams, Workflows, Laboratory)
- Orchestration page (duplicate of Teams/Workflows)
- Library (knowledge base)
- Creator (content studio)
- Neptune HQ (analytics - REDUNDANT, should be removed)
- Settings (comprehensive)
- Admin panel

### UX Problems Identified

1. **No vertical selection on signup** - The critical missing piece. Without knowing who the user is, nothing downstream works.

2. **Navigation overload** - 13 items in sidebar before user has created anything

3. **Agent features fragmented across 3 locations:**
   - My Agents (`/activity`) - has Activity, Messages, Teams, Workflows, Laboratory tabs
   - Orchestration (sidebar) - has Teams, Workflows again
   - Neptune HQ - has agent analytics

4. **Agent creation buried** - Most valuable action (creating an agent) is tab 5 of 5 in "My Agents"

5. **Empty state hell** - Every page shows zeros and "no items found" for new users

6. **No user journey** - No path from signup to quick win

7. **Redundant pages:**
   - Neptune HQ (Neptune is everywhere, doesn't need separate page)
   - Orchestration duplicates Teams/Workflows from My Agents

### What Should Happen (from docs)

```
Sign up
    ↓
Select vertical (B2B SaaS, Agency, Consultant, Pro Services, Sales)
    ↓
Store vertical as workspace attribute
    ↓
Dashboard shows vertical-specific:
  - Headline
  - Primary CTA
  - Neptune opening message
    ↓
User takes ONE clear first action
    ↓
Quick win in 3-5 minutes
    ↓
Success moment visible
    ↓
Neptune guides to next step
```

### Quick Wins Per Vertical (from doc 06)

| Vertical | First Action | Quick Win |
|----------|--------------|-----------|
| B2B SaaS | Add a lead | Lead scored, in pipeline |
| Agency | Create client workspace | Content draft generated |
| Consultant | Add a client | Notes/follow-up captured |
| Pro Services | Create client workspace | Document organized |
| Sales/SDR | Import leads | Prioritized lead list |

---

## Decisions Made This Session

1. **Remove Neptune HQ** - It's redundant. Neptune is accessible everywhere.

2. **Consolidate agent features** - Teams/Workflows shouldn't appear in both My Agents AND Orchestration.

3. **Progressive disclosure** - Hide advanced features until user has basics working.

4. **Vertical selection is the unlock** - Everything depends on knowing who the user is.

---

## Technical Changes Made Today

1. **Dashboard simplified:**
   - Removed Compass/Vision/Boards right panel
   - Removed welcome banner (Neptune's greeting is the welcome)
   - Hidden zero-count stat badges for new users
   - Added `minimal` mode to Neptune panel
   - Changed quick actions to business-type prompts

2. **Navigation fix:**
   - Fixed `window.location.href` → `router.push()` for client-side navigation
   - Updated dashboard loading skeleton

3. **Commits pushed:**
   - `f3eaf90` - Remove Compass/Vision/Boards panel
   - `4dd62e4` - Streamline onboarding to Neptune-first experience
   - `b08af31` - Fix navigation to use client-side routing

---

## Next Steps (Priority Order)

### Phase 1: Vertical Selection (Critical Path)
1. Create vertical selection UI (modal on first login or during signup)
2. Store vertical as workspace attribute in database
3. Pass vertical to Neptune context
4. Update Neptune system prompt based on vertical

### Phase 2: Dashboard Per Vertical
1. Vertical-specific headline on dashboard
2. Vertical-specific primary CTA
3. Vertical-specific Neptune opening message
4. Hide/show features based on vertical

### Phase 3: Navigation Cleanup
1. Remove Neptune HQ from navigation
2. Decide: Keep Orchestration separate OR merge into My Agents
3. Implement progressive disclosure (hide advanced until earned)
4. Reduce initial nav items for new users

### Phase 4: My Agents Page Redesign
1. Make Laboratory (agent creation) primary, not tab 5
2. Consider: Remove tabs entirely for new users, just show "Create Your First Agent"
3. Teams/Workflows appear after user has agents

### Phase 5: Quick Win Flows
1. Implement the "hero workflow" for each vertical
2. Ensure 3-5 minute time to value
3. Visible success states

---

## Local Development

Dev server command: `npm run dev`
Runs at: http://localhost:3000

---

## Questions for Next Session

1. Should vertical selection happen during Clerk signup flow or as a post-signup modal?
2. What's the database schema change needed to store vertical on workspace?
3. Should we do one vertical perfectly first (golden path) or all 5 in parallel?
4. What happens to existing users who never selected a vertical?

---

## Files to Reference

- `src/app/(app)/dashboard/page.tsx` - Dashboard page
- `src/components/dashboard/DashboardV2Client.tsx` - Dashboard client component
- `src/contexts/neptune-context.tsx` - Neptune context (needs vertical awareness)
- `src/lib/neptune/quick-actions.ts` - Quick action prompts (needs vertical variants)
- `src/components/galaxy/sidebar.tsx` - Navigation sidebar
- `src/components/agents/MyAgentsDashboard.tsx` - My Agents page

---

**End of handoff. Next session should read this file first, then the vertical use case docs, then the ChatGPT transcript.**
