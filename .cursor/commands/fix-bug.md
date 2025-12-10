Debug and fix this issue following GalaxyCo AI best practices:

## Step 1: Reproduce the Bug
- [ ] Identify exact steps to reproduce
- [ ] Note expected vs actual behavior
- [ ] Check browser console for errors
- [ ] Check server logs for backend errors
- [ ] Verify it happens consistently

## Step 2: Isolate the Problem

### Frontend Issues
- Check React DevTools for component state
- Verify props are being passed correctly
- Check network tab for API call failures
- Look for console errors or warnings
- Check if error only occurs in production

### Backend Issues
- Check server logs in terminal
- Verify database queries are correct
- Check for missing error handling
- Verify authentication/authorization
- Check rate limiting isn't blocking requests

### Common Issue Areas
- **Multi-tenancy**: Missing `organizationId` filter?
- **Authentication**: User not authenticated properly?
- **Validation**: Zod schema too strict or wrong?
- **Type errors**: TypeScript complaining?
- **State management**: State not updating correctly?

## Step 3: Find Root Cause

### Check These First
1. **Console errors** - Look for stack traces
2. **Network tab** - Check API responses
3. **Database queries** - Use Drizzle Studio
4. **Environment variables** - Are they set?
5. **Type errors** - Run `npm run typecheck`

### Common Bugs & Fixes

#### ❌ TypeError: Cannot read property 'map' of undefined
```typescript
// Problem: data might be undefined
const items = data.items.map(item => ...);

// Fix: Use optional chaining and fallback
const items = (data?.items ?? []).map(item => ...);
```

#### ❌ 401 Unauthorized on API call
```typescript
// Problem: Missing authentication check
export async function GET(request: NextRequest) {
  const items = await db.query.items.findMany();
  return Response.json({ data: items });
}

// Fix: Add auth check
export async function GET(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of code
}
```

#### ❌ Data leaking between organizations
```typescript
// Problem: Missing organizationId filter
const contacts = await db.query.contacts.findMany();

// Fix: Always filter by organizationId
const contacts = await db.query.contacts.findMany({
  where: eq(contacts.organizationId, orgId),
});
```

#### ❌ Component not re-rendering
```typescript
// Problem: Mutating state directly
const addItem = () => {
  items.push(newItem);
  setItems(items); // Won't trigger re-render
};

// Fix: Create new array
const addItem = () => {
  setItems([...items, newItem]);
};
```

#### ❌ Infinite loop in useEffect
```typescript
// Problem: Dependency causes re-render
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData changes every render

// Fix: Wrap in useCallback or use correct dependencies
const fetchData = useCallback(async () => {
  // fetch logic
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

#### ❌ Form submission doesn't work
```typescript
// Problem: Missing preventDefault
const handleSubmit = (data) => {
  apiCall(data);
};

// Fix: Use react-hook-form properly
const form = useForm();
const onSubmit = async (data) => {
  try {
    await apiCall(data);
    toast.success('Saved!');
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

## Step 4: Implement Fix

### Code Fix Template
```typescript
// Before (broken)
// [paste broken code]

// After (fixed)
// [paste fixed code]

// Why this fixes it:
// [explain the root cause and solution]
```

### Testing the Fix
- [ ] Bug no longer reproduces
- [ ] Edge cases handled
- [ ] No new errors in console
- [ ] TypeScript passes (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] Works in both light and dark mode
- [ ] Works on mobile (if applicable)
- [ ] Doesn't break other features

## Step 5: Prevent Future Bugs

### Add Error Handling
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  toast.error('Something went wrong');
  return fallbackValue;
}
```

### Add Type Safety
```typescript
// Use proper TypeScript types
interface MyData {
  items: Item[];
  total: number;
}

const data: MyData = await fetchData();
```

### Add Validation
```typescript
// Validate with Zod
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const result = schema.safeParse(input);
if (!result.success) {
  // Handle validation error
}
```

### Add Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await action();
  } finally {
    setIsLoading(false);
  }
};
```

## Step 6: Document the Fix

### Commit Message
```bash
fix(scope): brief description of bug

- Explain what was broken
- Explain what caused it
- Explain how you fixed it

Fixes #123 (if there's an issue)
```

### Code Comments (if complex)
```typescript
// FIX: Added null check to prevent crash when data is undefined
// This can happen during initial load before SWR fetches data
const items = data?.items ?? [];
```

## Debugging Tools

### Frontend
- React DevTools
- Chrome DevTools (Elements, Console, Network, Sources)
- Redux DevTools (if using Redux)
- SWR DevTools

### Backend
- `logger.error()` statements
- Drizzle Studio (`npm run db:studio`)
- Postman/Insomnia for API testing
- Server logs in terminal

### TypeScript
```bash
npm run typecheck  # See all type errors
```

### Linting
```bash
npm run lint  # See all linting errors
```

Provide the complete fix with before/after code and explanation of root cause.

