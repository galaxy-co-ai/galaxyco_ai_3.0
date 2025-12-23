# Legacy Pages Refactoring Plan

> **Status:** ✅ COMPLETED
> **Created:** 2025-12-22
> **Completed:** 2025-12-22

## Summary

The `src/legacy-pages/` directory has been refactored and removed. All files are now in a staging folder for safe deletion after successful deployment.

## What Was Done

### 1. Moved Landing.tsx to Proper Location
- **From:** `src/legacy-pages/Landing.tsx`
- **To:** `src/components/landing/LandingPage.tsx`
- **Updated imports** in `src/app/page.tsx` to use new path

### 2. Removed Dead Code
The `src/components/landing/showcases/` folder was discovered to be **completely unused** (nobody imported from it since static images replaced the live demos). All files moved to staging.

### 3. Files in Staging Folder

All removed files are in `_to-delete-after-deploy/` for recovery if needed:

```
_to-delete-after-deploy/
├── legacy-pages/
│   ├── CRM.tsx
│   ├── Dashboard.tsx
│   ├── Integrations.tsx
│   ├── KnowledgeBase.tsx
│   ├── Landing.tsx          # Original copy (new version at src/components/landing/LandingPage.tsx)
│   └── Marketing.tsx
└── showcases/
    ├── CRMShowcase.tsx
    ├── DashboardShowcase.tsx
    ├── index.ts
    ├── KnowledgeShowcase.tsx
    ├── MarketingShowcase.tsx
    └── StudioShowcase.tsx
```

### 4. Config Updates Made
- `tsconfig.json` - Removed `src/legacy-pages` exclusion, added `_to-delete-after-deploy`
- `vitest.config.ts` - Removed `src/legacy-pages/**` from coverage excludes
- `.gitignore` - Added `_to-delete-after-deploy/`

## Verification

- ✅ `npm run typecheck` passes
- ⏳ `npm run build` - verify after deployment
- ⏳ Landing page renders correctly - verify after deployment

## Post-Deployment Cleanup

After confirming successful deployment:

```powershell
# Delete the staging folder permanently
Remove-Item "_to-delete-after-deploy" -Recurse -Force
```

## Recovery (If Something Breaks)

If the landing page has issues after deployment, files can be recovered from:
- `_to-delete-after-deploy/legacy-pages/Landing.tsx` - original landing page
- Other files in the staging folder as needed
