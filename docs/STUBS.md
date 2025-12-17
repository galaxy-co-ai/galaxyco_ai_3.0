# Known Gaps & Incomplete Features

**Last Updated:** 2025-12-17  
**Auto-generated from:** `grep -r "TODO\|FIXME\|mock" src/`

---

## High Priority Gaps

### 1. Data Calculation Missing
**Impact:** Features show placeholder/zero values

| File | Issue | Priority |
|------|-------|----------|
| `conversations/page.tsx` | avgResponseTime always 0, needs calculation | Medium |
| `lib/dashboard.ts` | hotLeads tracking not implemented | Medium |
| `lib/dashboard.ts` | lastLogin not tracked in database | Low |
| `lib/user-activity.ts` | agentRuns count missing database query | Low |
| `lib/user-activity.ts` | newMessages count not implemented | Low |

**Action:** Add database queries for these metrics

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
| `settings/page.tsx` | Mock sessions data for security section | Medium |
| `pricing/page.tsx` | Placeholder Stripe Price IDs | High |

**Action:** Replace mock data with real API calls

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

## How to Use This File

1. **Before starting work:** Check if your feature area has known gaps
2. **When you find a gap:** Add it here with priority level
3. **When you fix a gap:** Remove it from this file and note in START.md
4. **Regular cleanup:** Run `grep -r "TODO\|FIXME" src/` monthly to refresh

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
