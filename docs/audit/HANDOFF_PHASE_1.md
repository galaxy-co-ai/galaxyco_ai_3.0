# Audit Handoff: Phase 1 — First 5 Minutes

**Created:** December 15, 2024  
**For:** New Claude session  
**Scope:** Auth → Onboarding → Dashboard → Navigation

---

## Your Mission

You are auditing GalaxyCo.ai's critical first-user-experience flows. Test each item, write findings to files, log bugs by severity, and update the tracker. Do NOT report findings in chat — write them to files.

**When complete:** Create `HANDOFF_PHASE_2.md` with instructions for the next session, then confirm to Dalton.

---

## Before You Start

1. **Dev server must be running:** `npm run dev` (Dalton runs this in Warp)
2. **Site URL:** http://localhost:3000
3. **Read the tracker:** `docs/audit/AUDIT_TRACKER.md`
4. **Use the template:** `docs/audit/findings/_TEMPLATE.md`

---

## Sections to Audit (4 total)

### Section 1.1: Authentication & Sign Up
Test these items:
- [ ] Email sign up flow
- [ ] Google OAuth flow
- [ ] Microsoft OAuth flow
- [ ] Sign in flow
- [ ] Sign out flow
- [ ] Session persistence
- [ ] Redirect after auth

**Write findings to:** `docs/audit/findings/01-auth.md`

---

### Section 1.2: Onboarding Flow
Test these items:
- [ ] Onboarding wizard loads after first login
- [ ] Step 1: Profile setup
- [ ] Step 2: Use case selection
- [ ] Step 3: App connections
- [ ] Step 4: Completion celebration
- [ ] Skip functionality works
- [ ] Progress persistence
- [ ] Redirect to dashboard

**Write findings to:** `docs/audit/findings/02-onboarding.md`

---

### Section 1.3: Dashboard
Test these items:
- [ ] Page loads without errors
- [ ] Stats cards display data
- [ ] Activity feed works
- [ ] Quick actions functional
- [ ] Navigation to all sections works
- [ ] Mobile responsive
- [ ] Empty state handling (if applicable)

**Write findings to:** `docs/audit/findings/03-dashboard.md`

---

### Section 1.4: Navigation & Layout
Test these items:
- [ ] Sidebar navigation works
- [ ] All nav links functional (click each one)
- [ ] Breadcrumbs display correctly
- [ ] Mobile menu works
- [ ] Command palette (Cmd+K) opens
- [ ] Global search works
- [ ] Notification center opens

**Write findings to:** `docs/audit/findings/04-navigation.md`

---

## How to Test

Use Playwright browser tools:
1. `Playwright:browser_navigate` to go to URLs
2. `Playwright:browser_snapshot` to see page state
3. `Playwright:browser_click` to interact with elements
4. `Playwright:browser_type` to fill forms

Or use the simpler approach:
1. Navigate to the page
2. Take a snapshot
3. Check for errors, missing elements, broken states
4. Document what you find

---

## How to Log Bugs

**P0 (Critical):** Blocks core flow → `docs/audit/bugs/P0-critical.md`  
**P1 (Embarrassing):** Works but looks bad → `docs/audit/bugs/P1-embarrassing.md`  
**P2 (Later):** Minor issues → `docs/audit/bugs/P2-later.md`

Use the format in each bug file.

---

## How to Update Tracker

After testing each section, update `docs/audit/AUDIT_TRACKER.md`:
1. Mark checkboxes `[x]` for tested items
2. Update the "Tested by" and "Date" fields
3. Update the Progress Summary table at the top

---

## When You're Done

1. **Update the tracker** with final counts
2. **Create handoff:** `docs/audit/HANDOFF_PHASE_2.md` for next session
3. **Confirm to Dalton** with a brief summary:
   - Sections completed
   - Bug counts (P0/P1/P2)
   - Ready for Phase 2

---

## Phase 2 Scope (for handoff)

Next session should audit:
- 2.1 CRM Dashboard
- 2.2 Contacts Management
- 2.3 Deals Pipeline
- 3.6 Neptune AI

---

## Codebase Location

`C:\Users\Owner\workspace\galaxyco-ai-3.0`

---

## Working Style

- Write to files, don't bloat the chat
- Be thorough but efficient
- If something is broken, log it and move on
- Don't try to fix bugs — just document them
- Stay focused on the 4 sections above

---

*Start with Section 1.1 (Auth). Go.*
