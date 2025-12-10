# GalaxyCo.ai 3.0 - Project Organization Guidelines

**Last Updated:** 2025-12-10  
**Version:** 1.0  
**Purpose:** Maintain clean, navigable project structure for AI agents and developers

---

## 📋 Table of Contents

1. [Directory Structure](#directory-structure)
2. [File Naming Conventions](#file-naming-conventions)
3. [Code Organization](#code-organization)
4. [Documentation Standards](#documentation-standards)
5. [Cleanup & Maintenance](#cleanup--maintenance)
6. [AI Agent Navigation](#ai-agent-navigation)

---

## 🗂️ Directory Structure

### Root Level

```
galaxyco-ai-3.0/
├── README.md                 # Only markdown file at root
├── docs/                     # All documentation
│   ├── status/              # Current project state
│   ├── plans/               # Strategic plans & roadmaps
│   ├── guides/              # Setup & tutorial docs
│   └── archive/             # Historical/completed docs
├── src/                      # All source code
│   ├── app/                 # Next.js 15 app directory
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities
│   ├── hooks/               # React hooks
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types
├── public/                   # Static assets
├── tests/                    # Test files
└── scripts/                  # Build/deploy scripts
```

### Documentation Structure (`docs/`)

**`docs/status/`** - Current project state & tracking:
- PROJECT_STATUS.md - Overall project health
- SITE_ASSESSMENT.md - Technical assessment
- UI_FUNCTIONALITY_TODO.md - UI task tracking
- Production readiness summaries

**`docs/plans/`** - Strategic planning:
- ROADMAP.md - Long-term vision
- EXECUTION_PLAN.md - Sprint planning
- Feature-specific improvement plans
- Architecture proposals

**`docs/guides/`** - Setup & instructions:
- START_HERE.md - Onboarding for new contributors
- QUICK_START_CHECKLIST.md - Quick setup guide
- AGENT_INSTRUCTIONS.md - AI agent guidelines
- API_DOCUMENTATION.md - API reference
- DESIGN-SYSTEM.md - Design tokens & patterns
- Component-specific guides

**`docs/archive/`** - Historical records:
- Completed tasks documentation
- Old configuration files
- Deprecated guides
- Session handoff documents (rotate weekly)

### Source Directory (`src/`)

**`src/app/`** - Next.js 15 App Router:
```
app/
├── (auth)/              # Auth-gated routes
├── (marketing)/         # Public marketing pages
├── admin/               # Admin panel
├── api/                 # API routes
├── dashboard/           # User dashboard
└── layout.tsx           # Root layout
```

**`src/components/`** - React components:
```
components/
├── admin/               # Admin-only components
├── auth/                # Authentication UI
├── common/              # Shared across all pages
├── dashboard/           # Dashboard components
├── creator/             # Creator tools
├── marketing/           # Marketing components
├── ui/                  # Base UI primitives (shadcn/ui)
└── landing/             # Landing page components
```

**Rules:**
- ✅ ONE version of each feature (no `dashboard-v2` or `crm-modern`)
- ✅ Component files in PascalCase: `UserProfile.tsx`
- ✅ Utility files in camelCase: `formatDate.ts`
- ✅ Test files adjacent: `UserProfile.test.tsx`
- ❌ No `_unused`, `_old`, `_backup` directories in src/

**`src/lib/`** - Shared utilities:
```
lib/
├── api/                 # API client utilities
├── auth/                # Auth helpers (NextAuth config)
├── db/                  # Database utilities (Drizzle)
├── redis/               # Redis caching
├── stripe/              # Stripe integration
└── utils/               # Generic utilities
```

**`src/hooks/`** - React hooks:
- Custom hooks in camelCase: `useAuth.ts`
- One hook per file
- Export as named export

**`src/types/`** - TypeScript definitions:
- Domain types: `user.ts`, `product.ts`
- API types: `api.ts`
- Shared interfaces: `common.ts`

---

## 📝 File Naming Conventions

### Components

```
✅ GOOD:
src/components/dashboard/AnalyticsChart.tsx
src/components/ui/Button.tsx
src/components/marketing/PricingCard.tsx

❌ BAD:
src/components/dashboard/analytics-chart.tsx
src/components/ui/button.tsx
src/components/dashboard/AnalyticsChartV2.tsx (use feature flags instead)
```

### Utilities

```
✅ GOOD:
src/lib/utils/formatCurrency.ts
src/hooks/useDebounce.ts
src/api/getUserData.ts

❌ BAD:
src/lib/utils/format-currency.ts
src/hooks/use-debounce.ts
src/api/get-user-data.ts
```

### Tests

```
✅ GOOD:
src/components/Button.test.tsx
src/lib/formatCurrency.test.ts
tests/e2e/auth.spec.ts

❌ BAD:
src/components/__tests__/Button.test.tsx (extra nesting)
tests/Button.spec.tsx (not adjacent to source)
```

### Documentation

```
✅ GOOD:
docs/guides/QUICK_START_CHECKLIST.md
docs/plans/ROADMAP.md
docs/status/PROJECT_STATUS.md

❌ BAD:
QUICK_START_CHECKLIST.md (at root)
quick-start-checklist.md (lowercase in docs/)
Quick Start Checklist.md (spaces)
```

---

## 🏗️ Code Organization

### Component Structure

```tsx
// 1. Imports (sorted: external, internal, types, styles)
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/user';

// 2. Types
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

// 3. Component
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);
  
  // 3b. Handlers
  const handleSave = () => {
    // ...
  };
  
  // 3c. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}

// 4. Exports
export type { UserProfileProps };
```

### API Route Structure

```ts
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// 1. Validation schemas
const GetUserSchema = z.object({
  id: z.string().uuid(),
});

// 2. Route handlers
export async function GET(req: NextRequest) {
  try {
    // Validate
    const { id } = GetUserSchema.parse(req.nextUrl.searchParams);
    
    // Execute
    const user = await db.user.findUnique({ where: { id } });
    
    // Response
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}
```

### Utility Function Structure

```ts
// src/lib/utils/formatCurrency.ts

/**
 * Format number as USD currency
 * @param amount - Amount in cents
 * @returns Formatted string like "$12.34"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}
```

---

## 📚 Documentation Standards

### Markdown Files

**Headers:**
```markdown
# Title (H1 - one per file)
## Section (H2)
### Subsection (H3)
#### Detail (H4 - use sparingly)
```

**Required Front Matter:**
```markdown
# Document Title

**Last Updated:** YYYY-MM-DD  
**Status:** Active | Completed | Deprecated  
**Owner:** Team/Person  

Brief 1-2 sentence description.

---

[Content starts here]
```

**Code Blocks:**
````markdown
```tsx
// Always specify language
export function Component() {}
```
````

**Links:**
```markdown
[Relative links](./other-doc.md)
[Absolute links](/docs/guides/start.md)
[External](https://example.com)
```

### Code Comments

**Component Comments:**
```tsx
/**
 * UserProfile displays user information with edit functionality
 * 
 * @example
 * ```tsx
 * <UserProfile user={currentUser} onUpdate={handleUpdate} />
 * ```
 */
export function UserProfile(props: UserProfileProps) {}
```

**Inline Comments:**
```tsx
// ✅ GOOD: Explain WHY, not WHAT
// Delay to prevent API rate limiting
await sleep(1000);

// ❌ BAD: Obvious from code
// Set the count to 0
setCount(0);
```

---

## 🧹 Cleanup & Maintenance

### What to Archive

Move to `docs/archive/` when:
- Documentation for completed features
- Old session handoff documents (>1 week)
- Deprecated guides
- Historical decisions/discussions

### What to Delete

Delete completely when:
- Duplicate files with same content
- Auto-generated files in version control
- Temporary test/debug files
- Empty or stub files

### What to Keep

Keep at current location:
- Active documentation
- In-progress plans
- Current status reports
- Essential configuration files

### Cleanup Checklist

**Weekly:**
- [ ] Archive old session documents
- [ ] Update PROJECT_STATUS.md
- [ ] Remove stale TODOs from code
- [ ] Check for unused dependencies

**Monthly:**
- [ ] Review `docs/archive/` for permanent deletion candidates
- [ ] Consolidate duplicate documentation
- [ ] Update API documentation
- [ ] Run dependency audit: `npm audit`

**Quarterly:**
- [ ] Major dependency updates
- [ ] Architecture documentation review
- [ ] Remove deprecated code
- [ ] Update README.md

---

## 🤖 AI Agent Navigation

### For AI Agents Reading This

**Start Here:**
1. Read `docs/guides/START_HERE.md` for project overview
2. Check `docs/status/PROJECT_STATUS.md` for current state
3. Review `docs/plans/EXECUTION_PLAN.md` for active work
4. Check `docs/guides/AGENT_INSTRUCTIONS.md` for specific guidelines

**When Working on Features:**
1. Check if component already exists in `src/components/`
2. Look for similar patterns in existing code
3. Follow TypeScript strictness (no `any` types)
4. Maintain existing conventions
5. Run health checks before committing:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

**When Creating Files:**
1. Use correct naming convention (see above)
2. Place in appropriate directory
3. Add proper imports/exports
4. Include JSDoc comments for functions
5. Add adjacent test file if applicable

**When Modifying Files:**
1. Maintain existing code style
2. Don't break TypeScript types
3. Keep component structure consistent
4. Update related documentation
5. Test changes in browser

**Safety Rules:**
- ✅ Always work on a branch, never main
- ✅ Move files, never delete (use `_archive/`)
- ✅ Test after every change
- ✅ Commit incrementally for easy rollback
- ❌ Never delete directories without verification
- ❌ Never change imports without exhaustive grep

---

## 📊 Metrics

### Clean Codebase Indicators

**TypeScript:**
- ✅ Target: 0 errors
- ✅ Current: 0 errors

**ESLint:**
- ✅ Target: 0 errors
- ✅ Current: 0 errors
- 🎯 Target warnings: <500
- 📊 Current warnings: 901

**File Organization:**
- ✅ Root markdown files: 1 (README.md only)
- ✅ Documentation structure: Organized
- 🎯 Duplicate directories: 0 (currently has duplicates)

### Tracking Progress

Update these metrics after cleanup phases:
- [ ] Phase 1: Documentation ✅ Complete (2025-12-10)
- [ ] Phase 2: Source Directory Cleanup
- [ ] Phase 3: ESLint Auto-Fix
- [ ] Phase 4: ESLint Configuration ✅ Complete (2025-12-10)
- [ ] Phase 5: Backend Optimization
- [ ] Phase 6: Organization Guidelines ✅ Complete (2025-12-10)

---

## 🔗 Related Documentation

- [Project Status](../status/PROJECT_STATUS.md)
- [Execution Plan](../plans/EXECUTION_PLAN.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Design System](./DESIGN-SYSTEM.md)
- [Agent Instructions](./AGENT_INSTRUCTIONS.md)

---

**Maintainers:** Executive Engineer & UI/UX Lead  
**Review Cycle:** Monthly  
**Last Review:** 2025-12-10
