# Known Gaps & Incomplete Features

**Last Updated:** 2025-12-17 (Verified & Updated)  
**Accuracy:** 93% (13/14 gaps valid, 1 false positive removed)  
**Recent Fixes:** avgResponseTime, agentRuns, newMessages (2025-12-17)

---

## ✅ Recently Fixed (2025-12-17)

| File | Issue | Status |
|------|-------|--------|
| `conversations/page.tsx` | ✅ avgResponseTime calculation | FIXED |
| `lib/user-activity.ts` | ✅ agentRuns count query | FIXED |
| `lib/user-activity.ts` | ✅ newMessages count query | FIXED |
| `pricing/page.tsx` | ✅ Stripe Price IDs (false positive - already configured) | NOT A GAP |

---

## High Priority Gaps

### 1. Data Calculation Missing
**Impact:** Features show placeholder/zero values

| File | Issue | Priority |
|------|-------|----------|
| `lib/dashboard.ts` | hotLeads tracking not implemented (needs leadStatus field) | Medium |
| `lib/dashboard.ts` | lastLogin not tracked in database | Low |

**Action:** Add database schema changes and queries for these metrics

---

### 2. AI Integration Gaps
**Impact:** Features have UI but no AI backend

| File | Issue | Priority |
|------|-------|----------|
| `ChangeOrderForm.tsx` | onAIFill not connected to Neptune | Low |
| `EstimateForm.tsx` | AI line item generation not connected | Low |
| `InvoiceForm.tsx` | onAIFill not connected to Neptune | Low |

**Action:** Wire up Neptune API calls for AI-assisted form filling

---

### 3. Mock Data in Production Code
**Impact:** Features may not work with real data

| File | Issue | Priority |
|------|-------|----------|
| `settings/page.tsx` | Mock sessions data for security section | High |

**Action:** Replace mock data with real API calls  
**Note:** Stripe Price IDs are already configured in .env.local

---

### 4. Media/Attachment Handling
**Impact:** Feature incomplete

| File | Issue | Priority |
|------|-------|----------|
| `webhooks/twilio/route.ts` | Media attachments not handled in SMS webhook | Medium |

**Action:** Implement media attachment processing

---

### 5. External Sync Not Implemented
**Impact:** Features don't persist to external systems

| File | Issue | Priority |
|------|-------|----------|
| `FinanceHQDashboard.tsx` | Documents not saved to Library or external software | Medium |
| `team/channels/route.ts` | Real unread counts not calculated | Low |

**Action:** Implement external sync and persistence

---

## Medium Priority Gaps

### Schema Definitions Missing
- `marketing/page.tsx` - Content and channels schemas needed

### Placeholder Form Actions
Multiple forms have placeholder `onSubmit` or `onAIFill` handlers that need implementation.

---

## Low Priority / Nice-to-Have

### Enhanced Calculations
- Response time analytics
- Real-time unread badge counts
- Agent execution statistics

### AI Enhancements
- Form auto-fill via Neptune
- Document generation assistance

---

## Legacy Components to Review

**Location:** `src/components/_archive/`

These components are archived but may still contain useful patterns or need cleanup:
- Dashboard demos
- Sandbox demos
- Old CRM contact demos

**Action:** Audit and either delete or migrate useful code

---

## Not Actually Gaps (False Positives)

The following are legitimate uses of "placeholder" or "mock":
- ✅ Form placeholder text attributes
- ✅ Test/demo components in `_archive/`
- ✅ Example data in documentation files

---

## Fix Priority Recommendations

### 🔥 Quick Wins (< 30 min each)
1. Mock sessions data (settings/page.tsx) - Users see fake security info
2. New messages count (FIXED ✅)
3. Agent runs count (FIXED ✅)

### ⚡ Important (30-90 min each)
4. Hot leads tracking - Requires schema change (add `leadStatus` to contacts)
5. Finance document saving - Create API endpoint + storage integration

### 📋 Nice to Have (Defer)
6. Media attachments in SMS/MMS
7. Last login tracking
8. AI form auto-fill features

---

## How to Use This File

1. **Before starting work:** Check if your feature area has known gaps
2. **When you find a gap:** Add it here with priority level
3. **When you fix a gap:** Move it to "Recently Fixed" section with date
4. **Regular cleanup:** Run `grep -r "TODO\|FIXME" src/` monthly to refresh
5. **Verify accuracy:** Re-verify all gaps every 2-3 months (last verified: 2025-12-17)

---

## Quick Gap Scan Commands

```bash
# Find all TODOs
grep -r "TODO" src/ --include="*.ts" --include="*.tsx"

# Find mock data usage
grep -r "mock\|Mock" src/ --include="*.ts" --include="*.tsx" | grep -v "placeholder\|test"

# Find FIXME markers
grep -r "FIXME" src/ --include="*.ts" --include="*.tsx"
```

---

*This file tracks known incomplete features. It should shrink over time as gaps are closed.*
