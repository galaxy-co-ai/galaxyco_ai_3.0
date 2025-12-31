# AI Tools System

This directory contains the modular AI tool system for Neptune (the GalaxyCo AI assistant). Tools enable Neptune to execute actions on behalf of users, such as creating leads, scheduling meetings, managing tasks, and more.

## Overview

- **94 tools** across **10 categories**
- OpenAI function calling format (ChatCompletionTool)
- Modular structure: each category has definitions + implementations
- Automatic aggregation via main index.ts

## Directory Structure

```
src/lib/ai/tools/
├── index.ts              # Main aggregator - exports all tools
├── types.ts              # Shared TypeScript types
├── README.md             # This documentation
│
├── agents/               # Agent management tools
│   ├── definitions.ts    # Tool schemas (OpenAI format)
│   ├── implementations.ts # Tool logic
│   └── index.ts          # Category exports
│
├── analytics/            # Analytics and reporting tools
├── calendar/             # Calendar and scheduling tools
├── content/              # Content creation tools
├── crm/                  # CRM tools (leads, contacts, deals)
├── finance/              # Finance and invoicing tools
├── knowledge/            # Knowledge base tools
├── marketing/            # Marketing and campaign tools
├── orchestration/        # Workflow and automation tools
└── tasks/                # Task management tools
```

## Adding a New Tool

### Step 1: Choose or Create a Category

If your tool fits an existing category, add it there. Otherwise, create a new category folder with:
- `definitions.ts`
- `implementations.ts`
- `index.ts`

### Step 2: Add Tool Definition

In `definitions.ts`, add your tool schema following the OpenAI function format:

```typescript
// Example: src/lib/ai/tools/crm/definitions.ts

import type { ToolDefinitions } from '../types';

export const crmToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'your_tool_name',           // Use snake_case
      description: 'Clear description of what the tool does. Include when to use it.',
      parameters: {
        type: 'object',
        properties: {
          paramName: {
            type: 'string',             // string, number, boolean, array, object
            description: 'What this parameter is for',
          },
          optionalParam: {
            type: 'number',
            description: 'Optional parameter description',
          },
          enumParam: {
            type: 'string',
            enum: ['option1', 'option2', 'option3'],
            description: 'Parameter with fixed options',
          },
        },
        required: ['paramName'],        // List required parameters
      },
    },
  },
  // ... more tools
];
```

### Step 3: Add Tool Implementation

In `implementations.ts`, implement the tool logic:

```typescript
// Example: src/lib/ai/tools/crm/implementations.ts

import type { ToolImplementations, ToolResult } from '../types';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const crmToolImplementations: ToolImplementations = {
  // Key must match the 'name' in definitions
  async your_tool_name(args, context): Promise<ToolResult> {
    try {
      // Extract and validate arguments
      const paramName = args.paramName as string;
      const optionalParam = args.optionalParam as number | undefined;

      // IMPORTANT: Always scope operations to context.workspaceId
      // This ensures multi-tenant security
      const result = await db.query.yourTable.findMany({
        where: eq(yourTable.workspaceId, context.workspaceId),
        // ... your query
      });

      // Log the action
      logger.info('AI executed your_tool_name', {
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      // Return success response
      return {
        success: true,
        message: 'Human-readable success message',
        data: {
          // Include relevant data for the AI to use in response
          id: result.id,
          name: result.name,
        },
        // Optional: Suggest next action to user
        suggestedNextStep: {
          action: 'related_action',
          reason: 'Why this makes sense',
          prompt: 'Question to ask the user',
          autoSuggest: true,  // true = show prominently
        },
      };
    } catch (error) {
      logger.error('AI your_tool_name failed', error);
      return {
        success: false,
        message: 'Failed to perform action',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
```

### Step 4: Export from Category Index

In your category's `index.ts`:

```typescript
// Example: src/lib/ai/tools/crm/index.ts

export { crmToolDefinitions } from './definitions';
export { crmToolImplementations } from './implementations';
```

### Step 5: Register in Main Index (New Categories Only)

If you created a new category, update `src/lib/ai/tools/index.ts`:

```typescript
// Import your new category
import { newToolDefinitions, newToolImplementations } from './new-category';

// Add to aggregated definitions
export const aiTools: ChatCompletionTool[] = [
  // ... existing categories
  ...newToolDefinitions,
];

// Add to implementations map
const toolImplementations = {
  // ... existing categories
  ...newToolImplementations,
};

// Add to toolsByCategory helper
export const toolsByCategory = {
  // ... existing categories
  newCategory: Object.keys(newToolImplementations),
};
```

## Types Reference

### ToolContext

Provided to every tool implementation:

```typescript
interface ToolContext {
  workspaceId: string;        // Current workspace ID (ALWAYS use for queries)
  userId: string;             // Clerk user ID
  userEmail: string;          // User's email
  userName: string;           // User's display name
  connectedApps?: Array<{     // OAuth integrations
    provider: string;
    type: string;
    scopes: string[];
    accessToken?: string;
    status: string;
  }>;
}
```

### ToolResult

Return type for all tool implementations:

```typescript
interface ToolResult {
  success: boolean;           // Whether the action succeeded
  message: string;            // Human-readable result message
  data?: Record<string, unknown>;  // Structured data for AI to use
  error?: string;             // Error message if failed
  suggestedNextStep?: {       // Optional follow-up suggestion
    action: string;           // Action identifier
    reason: string;           // Why suggest this
    prompt: string;           // Question for user
    autoSuggest: boolean;     // Show prominently if true
  };
}
```

## Best Practices

### Security

1. **Always scope to workspace**: Every database query must filter by `context.workspaceId`
2. **Validate ownership**: Before updating/deleting, verify the record belongs to the workspace
3. **Sanitize inputs**: Cast and validate all args before use
4. **Never expose secrets**: Don't include API keys or tokens in results

### Performance

1. **Use efficient queries**: Prefer indexed columns, limit results
2. **Avoid N+1 queries**: Use joins or batch fetches
3. **Log appropriately**: Use `logger.info` for actions, `logger.debug` for details

### User Experience

1. **Clear descriptions**: Help the AI understand when to use each tool
2. **Descriptive messages**: Return helpful success/error messages
3. **Include relevant data**: Return data the AI needs for a good response
4. **Suggest next steps**: Guide users to logical follow-up actions

### Error Handling

1. **Catch all errors**: Wrap implementations in try/catch
2. **Log failures**: Always log errors with context
3. **Return gracefully**: Never throw - return `{ success: false, message, error }`

## Capability Mapping

Tools can be filtered by capability for focused contexts:

```typescript
const capabilityToTools = {
  crm: ['crm', 'calendar', 'tasks'],
  marketing: ['marketing', 'content', 'analytics'],
  sales: ['crm', 'calendar', 'analytics', 'marketing'],
  finance: ['finance', 'analytics'],
  operations: ['tasks', 'calendar', 'orchestration'],
  agents: ['agents', 'orchestration'],
  knowledge: ['knowledge', 'content'],
  all: ['crm', 'calendar', 'agents', 'analytics', 'content', 'knowledge', 'orchestration', 'tasks', 'finance', 'marketing'],
};
```

Use `getToolsForCapability(capability)` to get filtered tools.

## Testing Tools

When testing a new tool:

1. Verify the definition schema is valid JSON Schema
2. Test with mock ToolContext
3. Verify workspace scoping works correctly
4. Test error cases return proper ToolResult format
5. Check that suggested next steps make sense

## Current Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| agents | 10 | Create, manage, and run AI agents |
| analytics | 8 | Generate reports and analyze data |
| calendar | 9 | Schedule meetings, manage events |
| content | 12 | Create and manage content |
| crm | 9 | Leads, contacts, deals management |
| finance | 8 | Invoices, expenses, financial reports |
| knowledge | 10 | Knowledge base and document management |
| marketing | 11 | Campaigns, email marketing |
| orchestration | 9 | Workflows and automation |
| tasks | 8 | Task management and tracking |

**Total: 94 tools**
