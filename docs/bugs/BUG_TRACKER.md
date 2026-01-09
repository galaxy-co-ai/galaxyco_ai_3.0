# Bug Tracker & Technical Debt
**GalaxyCo AI 3.0 - Issue Tracking**
**Last Updated**: January 8, 2026

---

## 📊 Summary Dashboard

| Category | P0 Critical | P1 High | P2 Medium | P3 Low | Total |
|----------|-------------|---------|-----------|--------|-------|
| Security | 0 | 2 | 4 | 7 | 13 |
| Lint Issues | 0 | 0 | 0 | ~890 | ~890 |
| Known Bugs | 0 | 0 | TBD | TBD | TBD |

---

## 🔴 P0 Critical (Production-Breaking)

_No P0 issues identified at this time._

---

## 🟠 P1 High Priority

### SEC-001: Next.js Security Vulnerabilities (HIGH)
- **Status**: 🔓 Open
- **Severity**: HIGH
- **Location**: `node_modules/next`
- **Issue**: Next.js 16.0.0-beta.0 - 16.0.8 has known vulnerabilities:
  - Server Actions Source Code Exposure (GHSA-w37m-7fhw-fmv9)
  - DoS vulnerability with Server Components (GHSA-mwv6-3258-q52c)
- **Fix**: Run `npm audit fix` or update to patched version
- **Owner**: Dalton

### SEC-002: QS Package DoS Vulnerability (HIGH)
- **Status**: 🔓 Open
- **Severity**: HIGH
- **Location**: `node_modules/qs`
- **Issue**: qs < 6.14.1 has arrayLimit bypass vulnerability (GHSA-6rw7-vpxm-498p)
- **Fix**: Run `npm audit fix`
- **Owner**: Dalton

---

## 🟡 P2 Medium Priority

### SEC-003: esbuild Moderate Vulnerabilities
- **Status**: 🔓 Open
- **Severity**: MODERATE (4 issues)
- **Location**: `drizzle-kit` dependencies
- **Issue**: @esbuild-kit/core-utils and @esbuild-kit/esm-loader vulnerabilities
- **Fix**: Update drizzle-kit (breaking change required)
- **Owner**: TBD

### CODE-001: TypeScript `any` Types in Production Code
- **Status**: 🔄 In Progress
- **Severity**: MEDIUM
- **Count**: Reduced from ~81 to ~60 instances
- **Fixed Files** (Jan 8, 2026):
  - `src/app/api/assistant/stream/route.ts` (5 → 0)
  - `src/components/crm/CRMDashboard.tsx` (9 → 0)
  - `src/components/crm/ContactDialog.tsx` (1 → 0)
  - `src/components/crm/DealDialog.tsx` (2 → 0)
  - `src/components/crm/InsightsPanel.tsx` (1 → 0)
  - `src/components/crm/ScoreCard.tsx` (1 → 0)
- **Remaining**:
  - `src/db/schema.ts` (16 - JSONB columns, some intentional)
  - `src/components/shared/EnhancedDataTable.tsx` (5)
- **Fix**: Add proper types, use `unknown` with type guards
- **Owner**: Dalton

---

## 🟢 P3 Low Priority (Technical Debt)

### LINT-001: Unused Variables
- **Status**: 🔄 In Progress
- **Count**: Reduced by 15+ in lib files (Jan 8, 2026)
- **Files Fixed**:
  - `src/lib/ai/website-intelligence.ts`
  - `src/lib/ai/agent-wizard.ts`
  - `src/lib/ai/article-layouts.ts`
  - `src/lib/ai/memory.ts`
  - `src/lib/ai/workflow-builder.ts`
  - `src/lib/auth.ts`
  - `src/lib/dashboard.ts`
  - `src/lib/neptune/business-intelligence.ts`
  - `src/lib/neptune/unified-context.ts`
  - `src/lib/orchestration/team-executor.ts`
  - `src/lib/orchestration/workflow-engine.ts`
  - `src/lib/vector.ts`
  - `src/lib/website-crawler.ts`
  - `src/lib/search.ts`
- **Fix**: Prefix with `_` or remove unused code
- **Notes**: Many remaining are in test mocks (acceptable)

### LINT-002: Missing React Hook Dependencies
- **Status**: 🔓 Open
- **Location**: `src/hooks/usePageContext.ts:196`
- **Issue**: useEffect missing dependencies for `activeTab`, `customData`, etc.
- **Fix**: Add dependencies or restructure logic

### LINT-003: Console Warnings in Production Code
- **Status**: ✅ Resolved (Jan 8, 2026)
- **Resolution**: console.logs in scripts are legitimate CLI output; ToastExamples updated

### SEC-004: Low Severity Dependency Issues (7 total)
- **Status**: 🔓 Open
- **Impact**: Low - mostly development dependencies
- **Fix**: `npm audit fix` for non-breaking changes

---

## ✅ Recently Resolved

### LINT-004: Next.js `module` Variable Assignment (Jan 8, 2026)
- **Files**: `page-prompts.ts`, `page-context.ts`, `quick-actions.ts`
- **Fix**: Renamed `module` to `pageModule` to avoid shadowing reserved variable
- **Resolved By**: AI Assistant

### LINT-005: React Purity Warnings (Jan 8, 2026)
- **Files**: `stars.tsx`, `customize/page.tsx`, `accessibility.ts`, `useNeptunePresence.ts`
- **Fix**: Added eslint-disable comments with explanations for intentional patterns
- **Resolved By**: AI Assistant

---

## 📋 Bug Submission Template

When adding new bugs, use this format:

```markdown
### BUG-XXX: [Short Description]
- **Status**: 🔓 Open | 🔄 In Progress | ✅ Resolved
- **Severity**: P0/P1/P2/P3
- **Location**: [file path or area]
- **Issue**: [Description of the problem]
- **Reproduction Steps**: [How to reproduce]
- **Expected Behavior**: [What should happen]
- **Actual Behavior**: [What actually happens]
- **Fix**: [Proposed or implemented fix]
- **Owner**: [Who is responsible]
```

---

## 🎯 Priority Legend

| Level | Definition | SLA |
|-------|------------|-----|
| **P0** | Production-breaking, data loss, security breach | Immediate |
| **P1** | Major feature broken, impacts many users | 1 week |
| **P2** | Minor feature broken, workarounds exist | 2 weeks |
| **P3** | Cosmetic, nice-to-have, tech debt | Backlog |

---

## 📈 Metrics & Goals

- **Target**: < 5 open P0/P1 bugs at any time
- **Test Coverage Goal**: 80%+ on critical paths
- **Type Safety Goal**: 0 unintentional `any` types
- **Lint Goal**: 0 errors, minimize warnings

---

**Maintained By**: Dalton
**Review Frequency**: Weekly
