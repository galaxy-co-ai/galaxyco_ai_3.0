Create a new Neptune AI tool that can be called via natural language:

## Tool Structure
```typescript
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { Tool, ToolContext } from '@/lib/ai/neptune/types';

export const myNewTool: Tool = {
  // 1. Unique tool name (snake_case)
  name: 'my_action_name',
  
  // 2. Clear description (helps AI know when to use this tool)
  description: 'Describe what this tool does in detail. Include when to use it and what it returns.',
  
  // 3. Zod schema for parameters
  parameters: z.object({
    param1: z.string().describe('Description of param1 for the AI'),
    param2: z.number().optional().describe('Optional description'),
    param3: z.enum(['option1', 'option2']).describe('Choose an option'),
  }),
  
  // 4. Execute function
  execute: async (params, context: ToolContext) => {
    try {
      // Validate authentication
      if (!context.userId) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      // Validate organization context
      if (!context.organizationId) {
        return {
          success: false,
          error: 'Organization context required',
        };
      }

      // Your tool logic here
      const result = await performAction(params, context);

      // Return user-friendly message
      return {
        success: true,
        message: `Action completed! ${result.summary}`,
        data: result,
      };
    } catch (error) {
      logger.error('Tool execution failed', {
        tool: 'my_action_name',
        error,
        userId: context.userId,
      });
      
      return {
        success: false,
        error: 'Could not complete action. Please try again.',
      };
    }
  },
  
  // 5. Risk level for autonomy learning
  riskLevel: 'medium', // 'low' | 'medium' | 'high'
};
```

## Risk Levels

### Low Risk (auto-executes)
- Read-only operations
- Search queries
- Generate drafts
- Get information

**Example:** `search_contacts`, `get_pipeline_summary`, `list_tasks`

### Medium Risk (learns from user)
- Create operations
- Update non-critical data
- Schedule future actions
- Send internal messages

**Example:** `create_lead`, `update_task_status`, `schedule_meeting`

### High Risk (always confirm)
- Delete operations
- Send external communications
- Financial transactions
- Public-facing actions

**Example:** `send_email`, `delete_contact`, `process_payment`

## Tool Categories

### CRM Tools
- `create_lead`, `search_contacts`, `update_deal_stage`, `schedule_follow_up`

### Task Management
- `create_task`, `prioritize_tasks`, `batch_similar_tasks`

### Marketing
- `create_campaign`, `segment_audience`, `optimize_campaign`

### Finance
- `get_overdue_invoices`, `project_cash_flow`, `send_payment_reminder`

### Knowledge Base
- `search_knowledge`, `upload_document`, `generate_summary`

### Analytics
- `get_pipeline_summary`, `calculate_conversion_rate`, `revenue_forecast`

## Registration

After creating your tool, register it in the tool registry:

```typescript
// src/lib/ai/neptune/tools/index.ts

import { myNewTool } from './my-new-tool';

export const allTools = [
  // ... existing tools
  myNewTool,
];
```

## Testing

Test your tool with Neptune:
```
"Neptune, [describe what you want in natural language]"

Examples:
- "Create a new lead for John at Acme Corp"
- "Show me my overdue tasks"
- "Generate a sales forecast for Q1"
```

## Best Practices

1. **Clear descriptions** - Help the AI understand when to use your tool
2. **Validate everything** - Check auth, orgId, and all parameters
3. **User-friendly messages** - Don't expose technical details
4. **Comprehensive error handling** - Always wrap in try-catch
5. **Log for debugging** - Use logger, not console.log
6. **Return structured data** - AI can use it in follow-up actions
7. **Test with real scenarios** - Use actual user workflows

## Common Patterns

### Database Query Tool
```typescript
execute: async (params, context) => {
  const items = await db.query.tableName.findMany({
    where: and(
      eq(tableName.organizationId, context.organizationId),
      // other filters from params
    ),
  });
  
  return {
    success: true,
    message: `Found ${items.length} items`,
    data: items,
  };
}
```

### Create/Update Tool
```typescript
execute: async (params, context) => {
  const [created] = await db.insert(tableName).values({
    ...params,
    organizationId: context.organizationId,
    createdBy: context.userId,
  }).returning();
  
  return {
    success: true,
    message: `Created ${created.name} successfully`,
    data: created,
  };
}
```

### External API Tool
```typescript
execute: async (params, context) => {
  const response = await externalApi.call({
    ...params,
    apiKey: process.env.EXTERNAL_API_KEY,
  });
  
  return {
    success: true,
    message: `Completed action`,
    data: response,
  };
}
```

