# TASK: Content Cockpit - Phase I: Testing and Polish

## CONTEXT

Phase H is complete ✅. Neptune AI Integration is now live with:
- 8 new AI tools for Content Cockpit
- Content-aware conversation handlers
- Proactive insights for content operations
- ContentCockpitContext in AI context gathering

Phase I is the final phase - comprehensive testing, polish, and documentation.

## FILES TO REVIEW FIRST

1. `c:\Users\Owner\.cursor\plans\content_cockpit_implementation_e7966eac.plan.md` - Full plan (Phase I section)
2. `src/lib/ai/content-cockpit-handlers.ts` - Content Cockpit handlers
3. `src/lib/ai/tools.ts` - AI tools (search for "CONTENT COCKPIT")
4. `src/lib/ai/proactive-engine.ts` - Proactive insights
5. `docs/CONTENT_COCKPIT_HISTORY.md` - Phase history

## PHASE I DELIVERABLES

### 1. End-to-End Testing

Test complete flows:

**Flow 1: Source Discovery → Review → Approve → Use in Topic**
- [ ] Add a content source manually
- [ ] Trigger AI review on source
- [ ] Check source appears in suggestions (if AI suggests)
- [ ] Approve/reject from suggestions queue
- [ ] Verify source is used when generating topics

**Flow 2: Topic Creation → Hit List → Article Studio → Publish → Analytics**
- [ ] Create topic idea directly
- [ ] Add topic to hit list
- [ ] Start writing from hit list (pre-fills Article Studio)
- [ ] Track wizard progress
- [ ] Publish article
- [ ] Verify analytics tracking begins
- [ ] Check hit list item marked complete

**Flow 3: Use Case Creation → Roadmap Generation → User Matching**
- [ ] Create new use case through wizard
- [ ] Generate AI roadmap
- [ ] Test match API with sample answers
- [ ] Verify roadmap returned correctly

**Flow 4: Alert Badge Lifecycle**
- [ ] Trigger an alert (via proactive insights)
- [ ] Verify alert appears in header
- [ ] Mark alert as read
- [ ] Dismiss alert
- [ ] Bulk dismiss multiple alerts

### 2. Neptune AI Tool Testing

Test each Content Cockpit tool via Neptune:

- [ ] "Add TechCrunch as a content source" → add_content_source
- [ ] "Save an article idea about AI trends" → add_to_hit_list
- [ ] "What should I write next?" → get_hit_list_insights
- [ ] "Reprioritize my content queue" → reprioritize_hit_list
- [ ] "How is my blog performing?" → get_article_analytics
- [ ] "Give me content suggestions" → get_content_insights
- [ ] "Find a use case for SaaS founders" → get_use_case_recommendation
- [ ] "Show me new source suggestions" → get_source_suggestions

### 3. Proactive Insights Verification

Verify each insight type triggers correctly:

- [ ] Hit list has 3+ high-priority topics → "High-Priority Content Opportunities"
- [ ] 3+ articles in progress → "Multiple Articles In Progress"
- [ ] Empty hit list → "Build Your Content Queue"
- [ ] Source suggestions available → "New Source Suggestions"
- [ ] Views declining > 20% → "Content Views Declining"
- [ ] Views growing > 30% → "Content Views Growing!"
- [ ] Draft use cases without roadmaps → "Incomplete Use Cases"
- [ ] 14+ days since publish → "Content Publishing Gap"

### 4. Mobile Responsiveness

Test all Content Cockpit pages on mobile viewport:

- [ ] Content Cockpit dashboard
- [ ] Hit List page (drag-drop may need fallback)
- [ ] Sources Hub
- [ ] Use Case Studio wizard
- [ ] Article Analytics

### 5. Accessibility Audit

- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

### 6. Performance Testing

- [ ] Verify scheduled jobs handle multiple workspaces
- [ ] Test with large data volumes (100+ topics, 50+ sources)
- [ ] Check API response times under load

## REQUIREMENTS

- Document any bugs found with screenshots/steps
- Fix critical bugs before marking complete
- Log non-critical issues in a tech debt list

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors (warnings OK if pre-existing)
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] All E2E flows pass
- [ ] Mobile responsive
- [ ] ARIA labels in place

## AFTER COMPLETION

1. Update docs/CONTENT_COCKPIT_HISTORY.md with Phase I completion
2. Git commit: `feat(content-cockpit): Phase I - Testing and Polish`
3. Content Cockpit is COMPLETE! 🎉
