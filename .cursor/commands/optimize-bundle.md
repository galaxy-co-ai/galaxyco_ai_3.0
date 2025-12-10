Analyze this code for bundle optimization opportunities:

## Dependency Analysis
- Identify heavy dependencies that could be replaced or tree-shaken
- Check for duplicate dependencies across the bundle
- Look for unused imports that can be removed
- Suggest lighter alternatives for large libraries

## Code Splitting
- Identify components that should be dynamically imported
- Suggest route-based code splitting opportunities
- Recommend lazy loading for below-the-fold content
- Find components only used in specific user flows

## Performance Optimization
- Check for unnecessary re-renders (missing memoization)
- Identify expensive computations that need `useMemo`
- Find callback functions that need `useCallback`
- Look for large static data that could be code-split

## Next.js Specific
- Verify proper use of Server vs Client Components
- Check for client-side data fetching that could be server-side
- Ensure `next/image` is used instead of `<img>`
- Verify `next/link` is used for navigation
- Check for missing `loading.tsx` and `error.tsx` boundaries

## Recommendations
Provide specific code changes with:
1. Current implementation (showing the issue)
2. Optimized implementation (showing the fix)
3. Expected bundle size reduction
4. Performance impact estimate

**Example output:**
```typescript
// ❌ Before: Imports entire lodash (24KB)
import _ from 'lodash';
const sorted = _.sortBy(items, 'date');

// ✅ After: Import only what you need (2KB)
import { sortBy } from 'lodash-es';
const sorted = sortBy(items, 'date');

// 💰 Savings: ~22KB (91% reduction)
```

