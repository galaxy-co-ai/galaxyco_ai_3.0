# Finance HQ — Neptune Assistant Specification (GalaxyCo Tailored)

> **Document Purpose:** Defines how Neptune (the existing FloatingAIAssistant) operates within Finance HQ with finance-specific context, capabilities, and suggestions.

---

## 1. Integration with Existing Neptune

Finance HQ extends the existing Neptune assistant (`/src/components/shared/FloatingAIAssistant.tsx`) rather than creating a new component. The existing assistant already:

- Appears on all pages via `AppLayout`
- Communicates via `/api/assistant/chat`
- Uses context from `/lib/ai/context.ts`
- Has conversation history stored in `aiConversations` and `aiMessages` tables

### What We're Adding
1. **Finance Context** - New data gathering in `/lib/ai/context.ts`
2. **Finance System Prompt** - Extended prompt in `/lib/ai/system-prompt.ts`
3. **Finance Suggestions** - Context-aware suggestions for finance pages
4. **Finance Tools** - New AI tools for finance actions in `/lib/ai/tools.ts`

---

## 2. Context Modes

Neptune adapts its behavior based on what the user is viewing in Finance HQ.

| Mode | Trigger | Context Data |
|------|---------|--------------|
| **Overview** | User on `/finance` main page | Full dashboard KPIs, all integrations |
| **Module** | User clicked a module tile | Module-specific data (invoices, revenue, etc.) |
| **Detail** | Detail drawer is open | Specific invoice/transaction/payout |
| **Forecast** | User requests forecast | Historical data for projections |

### Context Detection (in FloatingAIAssistant)

The existing assistant sends context via the `context` field:

```typescript
// Current implementation in FloatingAIAssistant.tsx
const response = await fetch("/api/assistant/chat", {
  method: "POST",
  body: JSON.stringify({
    message: textToSend,
    conversationId: conversationId,
    context: {
      feature: "floating_chat",
      page: typeof window !== "undefined" ? window.location.pathname : undefined,
    },
  }),
});
```

**Enhancement:** Finance HQ passes additional finance context:

```typescript
// Enhanced context for Finance HQ
context: {
  feature: "finance",
  page: "/finance",
  financeContext: {
    mode: 'overview' | 'module' | 'detail' | 'forecast',
    selectedModule?: string,        // 'invoices', 'revenue', etc.
    selectedItem?: {
      type: 'invoice' | 'transaction' | 'payout' | 'order',
      id: string,
      data: Record<string, unknown>,
    },
    dateRange: { start: string, end: string },
    connectedIntegrations: string[],
  },
}
```

---

## 3. Extend AI Context Gathering

**File:** `/src/lib/ai/context.ts`

Add `FinanceContext` to the existing context gathering:

```typescript
// Add to existing types
export interface FinanceContext {
  hasFinanceIntegrations: boolean;
  connectedProviders: string[];
  summary?: {
    revenue: number;
    expenses: number;
    profit: number;
    outstandingInvoices: number;
    cashflow: number;
  };
  recentInvoices?: Array<{
    id: string;
    number: string;
    customer: string;
    amount: number;
    status: string;
    dueDate: string;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  }>;
}

// Add to AIContext interface
export interface AIContext {
  user: UserContext;
  preferences: UserPreferencesContext;
  crm: CRMContext;
  calendar: CalendarContext;
  tasks: TaskContext;
  agents: AgentContext;
  finance?: FinanceContext;  // NEW
}

// Add gathering function
async function gatherFinanceContext(workspaceId: string): Promise<FinanceContext | undefined> {
  try {
    // Check for finance integrations
    const financeIntegrations = await db.query.integrations.findMany({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        inArray(integrations.provider, ['quickbooks', 'stripe', 'shopify']),
        eq(integrations.status, 'active')
      ),
    });

    if (financeIntegrations.length === 0) {
      return { hasFinanceIntegrations: false, connectedProviders: [] };
    }

    const connectedProviders = financeIntegrations.map(i => i.provider);

    // Fetch summary data (cached)
    const summary = await getCacheOrFetch(
      `ai:finance:summary:${workspaceId}`,
      async () => {
        // Aggregate from services
        return await getFinanceSummaryForAI(workspaceId);
      },
      { ttl: 300 }
    );

    return {
      hasFinanceIntegrations: true,
      connectedProviders,
      summary,
      // Only include recent items if they exist
      recentInvoices: summary?.recentInvoices,
      recentTransactions: summary?.recentTransactions,
    };
  } catch (error) {
    logger.error('Failed to gather finance context', error);
    return undefined;
  }
}

// Update gatherAIContext to include finance
export async function gatherAIContext(
  workspaceId: string,
  clerkUserId: string
): Promise<AIContext> {
  const [user, preferences, crm, calendar, tasks, agents, finance] = await Promise.all([
    gatherUserContext(workspaceId, clerkUserId),
    gatherUserPreferencesContext(workspaceId, clerkUserId),
    gatherCRMContext(workspaceId),
    gatherCalendarContext(workspaceId),
    gatherTaskContext(workspaceId),
    gatherAgentContext(workspaceId),
    gatherFinanceContext(workspaceId),  // NEW
  ]);

  return { user, preferences, crm, calendar, tasks, agents, finance };
}
```

---

## 4. Extend System Prompt

**File:** `/src/lib/ai/system-prompt.ts`

Add finance-specific instructions:

```typescript
// Add to generateSystemPrompt function
function generateFinancePromptSection(finance: FinanceContext | undefined, feature?: string): string {
  if (!finance?.hasFinanceIntegrations) {
    return '';
  }

  let prompt = `

## FINANCE CAPABILITIES

You have access to the user's financial data from: ${finance.connectedProviders.join(', ')}.

Current Financial Summary:
- Revenue: $${finance.summary?.revenue?.toLocaleString() || 'N/A'}
- Expenses: $${finance.summary?.expenses?.toLocaleString() || 'N/A'}
- Profit: $${finance.summary?.profit?.toLocaleString() || 'N/A'}
- Outstanding Invoices: $${finance.summary?.outstandingInvoices?.toLocaleString() || 'N/A'}
- Cash Flow: $${finance.summary?.cashflow?.toLocaleString() || 'N/A'}
`;

  // Add context-specific guidance
  if (feature === 'finance') {
    prompt += `
The user is currently viewing Finance HQ. You can:
- Summarize their financial health
- Explain trends in revenue, expenses, or cash flow
- Help with invoices (list overdue, send reminders, create new)
- Analyze transactions and identify patterns
- Generate forecasts based on historical data
- Compare periods (this month vs last month, YoY)

When discussing finances:
- Be precise with numbers
- Always clarify which data source (QuickBooks, Stripe, Shopify)
- Offer actionable next steps
- Be proactive about flagging issues (overdue invoices, cash flow concerns)
`;
  }

  if (finance.recentInvoices?.length) {
    const overdue = finance.recentInvoices.filter(i => i.status === 'overdue');
    if (overdue.length > 0) {
      prompt += `
⚠️ ALERT: There are ${overdue.length} overdue invoices totaling $${overdue.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}. Consider proactively mentioning this.
`;
    }
  }

  return prompt;
}

// Update main function
export function generateSystemPrompt(context: AIContext, feature?: string): string {
  let prompt = BASE_SYSTEM_PROMPT;
  
  // ... existing sections ...
  
  // Add finance section
  prompt += generateFinancePromptSection(context.finance, feature);
  
  return prompt;
}
```

---

## 5. Finance AI Tools

**File:** `/src/lib/ai/tools.ts`

Add finance-specific tools:

```typescript
// Add to aiTools array
{
  type: 'function' as const,
  function: {
    name: 'get_finance_summary',
    description: 'Get a summary of the user\'s financial data including revenue, expenses, profit, and cash flow',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'last_month', 'this_quarter', 'this_year'],
          description: 'The time period to summarize',
        },
      },
      required: ['period'],
    },
  },
},
{
  type: 'function' as const,
  function: {
    name: 'get_overdue_invoices',
    description: 'Get a list of overdue invoices that need attention',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
},
{
  type: 'function' as const,
  function: {
    name: 'send_invoice_reminder',
    description: 'Send a payment reminder for an overdue invoice',
    parameters: {
      type: 'object',
      properties: {
        invoiceId: {
          type: 'string',
          description: 'The ID of the invoice to send a reminder for',
        },
        customMessage: {
          type: 'string',
          description: 'Optional custom message to include in the reminder',
        },
      },
      required: ['invoiceId'],
    },
  },
},
{
  type: 'function' as const,
  function: {
    name: 'generate_cash_flow_forecast',
    description: 'Generate a cash flow forecast for the next 30/60/90 days',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          enum: [30, 60, 90],
          description: 'Number of days to forecast',
        },
      },
      required: ['days'],
    },
  },
},
{
  type: 'function' as const,
  function: {
    name: 'compare_financial_periods',
    description: 'Compare financial metrics between two time periods',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'expenses', 'profit', 'orders'],
          description: 'The metric to compare',
        },
        period1: {
          type: 'string',
          description: 'First period (e.g., "this_month")',
        },
        period2: {
          type: 'string',
          description: 'Second period (e.g., "last_month")',
        },
      },
      required: ['metric', 'period1', 'period2'],
    },
  },
},

// Add to executeTool function
case 'get_finance_summary':
  return await executeGetFinanceSummary(args, context);
case 'get_overdue_invoices':
  return await executeGetOverdueInvoices(context);
case 'send_invoice_reminder':
  return await executeSendInvoiceReminder(args, context);
case 'generate_cash_flow_forecast':
  return await executeGenerateCashFlowForecast(args, context);
case 'compare_financial_periods':
  return await executeCompareFinancialPeriods(args, context);
```

---

## 6. Context-Aware Suggestions

Update the suggestion generator to include finance-specific suggestions:

```typescript
// In FloatingAIAssistant.tsx or a separate utility
function generateSuggestions(userMessage: string, aiResponse: string, context?: any): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Finance-specific suggestions when on /finance page
  if (context?.page === '/finance' || context?.feature === 'finance') {
    // Overview mode suggestions
    if (!context?.financeContext?.selectedModule) {
      return [
        "Summarize this month's finances",
        "Show overdue invoices",
        "Forecast next 30 days",
        "Compare to last month",
      ];
    }
    
    // Module-specific suggestions
    if (context?.financeContext?.selectedModule === 'invoices') {
      return [
        "Send reminders for overdue",
        "Create a new invoice",
        "Show payment trends",
      ];
    }
    
    if (context?.financeContext?.selectedModule === 'revenue') {
      return [
        "Break down by source",
        "Show top customers",
        "Revenue forecast",
      ];
    }
    
    if (context?.financeContext?.selectedModule === 'expenses') {
      return [
        "Categorize expenses",
        "Find anomalies",
        "Compare to budget",
      ];
    }
  }
  
  // ... existing suggestion logic ...
  
  return ["Tell me more", "What else can you do?", "Thanks!"];
}
```

---

## 7. Finance Assistant Panel Behavior

### Opening Behavior
- Standard Neptune button in bottom-right (existing)
- Optional: Add Neptune icon to Finance HQ header for quick access
- Context automatically detected from page state

### Mode Switching
When user navigates within Finance HQ, the assistant context updates:

```typescript
// In Finance HQ page component
useEffect(() => {
  // Update Neptune context when finance state changes
  window.__neptuneContext = {
    feature: 'finance',
    page: '/finance',
    financeContext: {
      mode: selectedItem ? 'detail' : selectedModule ? 'module' : 'overview',
      selectedModule: selectedModule,
      selectedItem: selectedItem,
      dateRange: dateRange,
      connectedIntegrations: integrations?.connected || [],
    },
  };
}, [selectedModule, selectedItem, dateRange, integrations]);
```

### Response Format
When Neptune provides finance answers:
- Include specific numbers with currency formatting
- Cite data source (QuickBooks, Stripe, Shopify)
- Offer follow-up actions as suggestions
- Flag anomalies or concerns proactively

---

## 8. Example Interactions

### Overview Mode
**User:** "How are my finances looking this month?"

**Neptune:** "Here's your financial summary for March 2025:

📊 **Revenue:** $42,875 (+12% vs Feb)
- Stripe: $28,500
- Shopify: $10,200
- QuickBooks: $4,175

💰 **Expenses:** $18,340 (-3% vs Feb)

📈 **Net Profit:** $24,535 (+18% vs Feb)

⚠️ **Attention:** You have 3 overdue invoices totaling $8,920. Would you like me to send payment reminders?"

### Detail Mode
**User:** (viewing Invoice #223) "Why is this invoice overdue?"

**Neptune:** "Invoice #223 for Acme Corp ($4,500) was due on March 15th and is now 14 days overdue.

Looking at the history:
- Invoice sent: March 1st
- Reminder sent: March 10th
- No payment received

The customer has paid previous invoices within 7 days on average. This delay is unusual.

Would you like me to:
1. Send another reminder with a stronger tone?
2. Draft a follow-up email?
3. Show this customer's payment history?"

### Forecast Mode
**User:** "Forecast my cash flow for the next 30 days"

**Neptune:** "Based on your historical data, here's your 30-day cash flow forecast:

**Expected Inflows:** $38,500
- Pending invoice payments: $12,400
- Projected Stripe revenue: $18,600
- Projected Shopify orders: $7,500

**Expected Outflows:** $15,200
- Recurring expenses: $8,400
- Upcoming bills: $6,800

**Projected Net Position:** +$23,300

⚠️ Note: You have $8,920 in overdue invoices. If collected, this would add to your inflows.

Want me to break this down by week?"

---

## 9. Error Handling

When finance data is unavailable:

```typescript
// In tool execution
async function executeGetFinanceSummary(args: any, context: ToolContext) {
  try {
    const summary = await getFinanceSummary(context.workspaceId, args.period);
    return { success: true, data: summary };
  } catch (error) {
    if (error.code === 'INTEGRATION_DISCONNECTED') {
      return {
        success: false,
        message: `I can't access your ${error.provider} data because the connection has expired. Would you like to reconnect?`,
        action: 'reconnect',
        provider: error.provider,
      };
    }
    return {
      success: false,
      message: 'I encountered an issue fetching your financial data. Please try again.',
    };
  }
}
```

---

## End of Neptune Assistant Specification























