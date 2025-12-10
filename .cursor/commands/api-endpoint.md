Create a new API endpoint following GalaxyCo AI standards:

## Required Structure
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// 1. Define Zod schema for input validation
const requestSchema = z.object({
  // Define your request body schema here
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
});

// 2. GET endpoint (if needed)
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'api:endpoint-name', 100, 60);
    if (!rateLimitResult.success) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Multi-tenant query (ALWAYS filter by orgId)
    const items = await db.query.tableName.findMany({
      where: eq(tableName.organizationId, orgId),
    });

    return Response.json({ success: true, data: items });
  } catch (error) {
    logger.error('GET /api/endpoint-name failed', { error, userId });
    return Response.json(
      { success: false, error: { message: 'Failed to fetch data' } },
      { status: 500 }
    );
  }
}

// 3. POST endpoint (if needed)
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'api:endpoint-name', 100, 60);
    if (!rateLimitResult.success) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Create with organizationId (REQUIRED for multi-tenancy)
    const [created] = await db.insert(tableName).values({
      ...data,
      organizationId: orgId,
      createdBy: userId,
    }).returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/endpoint-name failed', { error, userId });
    return Response.json(
      { success: false, error: { message: 'Failed to create resource' } },
      { status: 500 }
    );
  }
}
```

## Checklist
- [ ] Zod schema for input validation
- [ ] Clerk authentication check
- [ ] Rate limiting implemented
- [ ] organizationId filter in ALL queries
- [ ] Try-catch error handling
- [ ] Logger for errors (not console.log)
- [ ] Standardized response format
- [ ] Proper HTTP status codes
- [ ] JSDoc comments for the endpoint

## Response Format
Always return:
```typescript
// Success
{ success: true, data: any }

// Error
{ success: false, error: { message: string, code?: string } }
```

## Testing
After creating the endpoint, test with:
```bash
# In your terminal
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@example.com"}'
```

