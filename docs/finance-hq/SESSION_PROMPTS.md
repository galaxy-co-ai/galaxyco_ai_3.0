# Finance HQ — Session Prompts

Copy-paste these prompts to start each conversation session.

---

## Session 1: Backend Foundation

```
Build Finance HQ for GalaxyCo — SESSION 1 OF 3 (Backend Foundation)

📋 FIRST: Read docs/finance-hq/HANDOFF.md completely before writing any code.

🎯 YOUR TASK: Execute Phases 1-4 only:
- Phase 1: Create /src/types/finance.ts
- Phase 2: Extend database schema (add quickbooks, stripe, shopify to integrationProviderEnum)
- Phase 3: Create backend services in /src/lib/finance/
- Phase 4: Create all API routes in /src/app/api/finance/

🚨 CRITICAL — DO NOT MODIFY EXISTING CODE:
- DO NOT change any existing components in /src/components/ui/
- DO NOT change any existing components in /src/components/galaxy/
- DO NOT change any existing components in /src/components/crm/
- DO NOT change any existing API routes outside /src/app/api/finance/
- DO NOT change any existing pages or layouts
- DO NOT change styling, themes, or design tokens
- ONLY CREATE NEW FILES in the locations specified above
- The ONLY existing file you may modify is /src/db/schema.ts (to add enum values)
- The ONLY other existing file you may modify is /src/lib/oauth.ts (to add new provider configs)

⚠️ IMPORTANT:
- Follow existing GalaxyCo patterns exactly (see HANDOFF.md)
- Run `npm run build` and `npm run lint` after each phase
- This session ends after Phase 4 — DO NOT start Phase 5

🛑 WHEN COMPLETE: Provide a summary of files created, confirm build passes, and tell me to start a new conversation for Session 2.
```

---

## Session 2: Frontend Components

```
Build Finance HQ for GalaxyCo — SESSION 2 OF 3 (Frontend Components)

📋 CONTEXT: Session 1 is complete. Backend services and API routes exist.

🔍 FIRST: Verify the codebase is ready:
- Run `npm run build` — should pass
- Check /src/lib/finance/ exists
- Check /src/app/api/finance/ routes exist

🎯 YOUR TASK: Execute Phases 5-6 only:
- Phase 5: Create all UI components in /src/components/finance-hq/
- Phase 6: Create page route and add Finance HQ to sidebar

📖 REFERENCE: docs/finance-hq/04-component-architecture.md for component specs

🚨 CRITICAL — DO NOT MODIFY EXISTING CODE:
- DO NOT change any existing components in /src/components/ui/
- DO NOT change any existing components in /src/components/galaxy/ (except sidebar.tsx to ADD nav item)
- DO NOT change any existing components in /src/components/crm/
- DO NOT change any existing components in /src/components/dashboard/
- DO NOT change any existing pages or their functionality
- DO NOT change any existing API routes
- DO NOT change styling, themes, or the design system
- ONLY CREATE NEW FILES in /src/components/finance-hq/
- ONLY CREATE NEW FILES in /src/app/(app)/finance/
- The ONLY existing file you may modify is /src/components/galaxy/sidebar.tsx (to ADD the Finance HQ nav item — do not change anything else in this file)

⚠️ IMPORTANT:
- Follow existing GalaxyCo component patterns
- Include loading skeletons for all data components
- Add proper ARIA labels and keyboard navigation
- This session ends after Phase 6 — DO NOT start Phase 7

🛑 WHEN COMPLETE: Verify /finance page loads, provide summary, tell me to start Session 3.
```

---

## Session 3: AI Integration & Polish

```
Build Finance HQ for GalaxyCo — SESSION 3 OF 3 (AI & Polish)

📋 CONTEXT: Sessions 1 & 2 are complete. Page should load at /finance.

🔍 FIRST: Verify the page works:
- Run `npm run dev`
- Navigate to http://localhost:3000/finance
- Confirm page renders

🎯 YOUR TASK: Execute Phases 7-8:
- Phase 7: Extend Neptune AI with finance context (ADD to /src/lib/ai/ files)
- Phase 8: Polish Finance HQ components, accessibility audit, final testing

📖 REFERENCE: docs/finance-hq/07-neptune-assistant-spec.md for AI specs

🚨 CRITICAL — DO NOT MODIFY EXISTING CODE:
- DO NOT change any existing UI components outside /src/components/finance-hq/
- DO NOT change any existing pages outside /src/app/(app)/finance/
- DO NOT change existing Neptune/FloatingAIAssistant UI behavior
- DO NOT change any existing API routes outside /src/app/api/finance/
- DO NOT change styling, themes, or the design system
- For AI files, ONLY ADD new functions/sections — do not modify existing AI behavior for other features
- In /src/lib/ai/context.ts — ADD gatherFinanceContext, don't change existing context gathering
- In /src/lib/ai/system-prompt.ts — ADD finance section, don't change existing prompt sections
- In /src/lib/ai/tools.ts — ADD finance tools, don't modify existing tools

✅ FINAL CHECKLIST (from HANDOFF.md):
- [ ] /finance page loads without errors
- [ ] Empty state shows when no integrations
- [ ] KPIs display with correct styling
- [ ] Module grid renders dynamically
- [ ] Timeline is horizontally scrollable
- [ ] Activity table shows transactions
- [ ] Detail drawer opens/closes
- [ ] Neptune responds with finance context
- [ ] ALL OTHER PAGES STILL WORK (Dashboard, CRM, Studio, etc.)
- [ ] npm run build passes
- [ ] npm run lint passes

🏁 WHEN COMPLETE: Provide final summary confirming all checklist items pass.
```

---

## Quick Reference

| Session | Phases | What Gets Built |
|---------|--------|-----------------|
| 1 | 1-4 | Types, schema, services, API routes |
| 2 | 5-6 | Components, hooks, page, sidebar |
| 3 | 7-8 | Neptune AI, polish, testing |

---

## Troubleshooting

### If Session Prerequisite Fails

**Session 2 prerequisite fails (no backend):**
```
The previous session may not have completed. Please check:
1. Does /src/types/finance.ts exist?
2. Does /src/lib/finance/ directory exist with service files?
3. Does /src/app/api/finance/ have route files?

If not, we need to complete Session 1 first.
```

**Session 3 prerequisite fails (page doesn't load):**
```
The previous session may not have completed. Please check:
1. Does /src/components/finance-hq/ exist with component files?
2. Does /src/app/(app)/finance/page.tsx exist?
3. Is Finance HQ in the sidebar?

If not, we need to complete Session 2 first.
```

---

## After All Sessions Complete

Your Finance HQ should have:
- 1 new page at `/finance`
- 10 API routes in `/api/finance/`
- ~20 components in `/components/finance-hq/`
- Backend services in `/lib/finance/`
- Neptune AI extensions in `/lib/ai/`

Verify with:
```bash
npm run build  # Must pass
npm run lint   # Must pass
npm run dev    # Start server, test /finance page
```

