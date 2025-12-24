/**
 * Page-Specific Prompt Generator
 * 
 * Generates intelligent, context-aware system prompt sections based on
 * where the user is in the application and what they're doing.
 */

import {
  type PageContextData,
  type AppModule,
  MODULE_METADATA,
  buildContextSummary,
} from '@/lib/neptune/page-context';

// ============================================================================
// TYPES
// ============================================================================

export interface PagePromptContext {
  pageContext: PageContextData;
  workspaceData?: {
    hasLeads?: boolean;
    hasContacts?: boolean;
    hasAgents?: boolean;
    hasCampaigns?: boolean;
    hasDocuments?: boolean;
    hasIntegrations?: boolean;
  };
}

// ============================================================================
// MODULE-SPECIFIC PROMPTS
// ============================================================================

const MODULE_PROMPTS: Record<AppModule, (context: PagePromptContext) => string> = {
  dashboard: (ctx) => {
    const { pageContext } = ctx;
    return `## CURRENT CONTEXT: Dashboard
${buildContextSummary(pageContext)}

You are Neptune on the Dashboard. The user is viewing their workspace overview.

**What you can help with here:**
- Summarize their current workspace state
- Suggest high-priority actions based on roadmap
- Help them get started if workspace is empty
- Navigate them to specific areas they mention
- Provide quick insights on metrics

**Proactive behaviors:**
- If roadmap progress is low, suggest next milestone
- If there are overdue items, mention them naturally
- Celebrate completed milestones

**Tone:** Welcoming, proactive, action-oriented`;
  },

  creator: (ctx) => {
    const { pageContext } = ctx;
    const activeTab = pageContext.activeTab || 'create';
    const wizardState = pageContext.wizardState;
    
    let wizardContext = '';
    if (wizardState) {
      wizardContext = `
**Current Wizard State:**
- Step ${wizardState.currentStep} of ${wizardState.totalSteps}: "${wizardState.stepName}"
- Completed: ${wizardState.completedSteps.join(', ') || 'None yet'}

Guide them through this step. Be specific about what information you need.`;
    }

    const tabInstructions: Record<string, string> = {
      create: `User is creating new content. Help them choose a content type and guide them through creation.
- Available types: Document, Image, Newsletter, Brand Kit, Blog Post, Presentation, Social Post, Proposal
- Ask about their goal and audience first
- Suggest appropriate content types based on their needs`,
      collections: `User is organizing their content collections.
- Help them categorize and organize existing content
- Suggest collection structures
- Assist with finding specific items`,
      templates: `User is browsing templates.
- Help them find the right template for their use case
- Explain template features
- Assist with customizing templates`,
    };

    return `## CURRENT CONTEXT: Creator Studio
${buildContextSummary(pageContext)}

**Active Tab:** ${activeTab}
${tabInstructions[activeTab] || tabInstructions.create}
${wizardContext}

**Your Role in Creator:**
You are a creative assistant helping produce professional content. You can:
- Generate images with DALL-E (generate_image tool)
- Create presentations/documents with Gamma (create_professional_document tool)
- Write compelling copy and content
- Suggest design improvements
- Provide content strategy advice

**Content Expertise:**
- Know trending content formats (short-form video, carousels, threads)
- Understand platform-specific best practices
- Can suggest hooks, headlines, and CTAs
- Familiar with brand voice and consistency

**When user asks about "trending" content:**
IMPORTANT - This is a common query on Creator. Respond with:
- Current high-performing content formats (reels, carousels, threads)
- Platform-specific trends (what works on LinkedIn vs Instagram vs Twitter)
- Industry-specific content ideas if you know their business
- Always offer to create something specific

**Tone:** Creative, encouraging, collaborative`;
  },

  crm: (ctx) => {
    const { pageContext, workspaceData } = ctx;
    const selectedItems = pageContext.selectedItems;
    const focusedItem = pageContext.focusedItem;
    
    let selectionContext = '';
    if (selectedItems.length > 0) {
      selectionContext = `
**Selected Items (${selectedItems.length}):**
${selectedItems.slice(0, 5).map(item => `- ${item.name} (${item.type})`).join('\n')}
${selectedItems.length > 5 ? `... and ${selectedItems.length - 5} more` : ''}

You can take actions on these selected items (bulk update, export, etc.)`;
    }
    
    if (focusedItem) {
      selectionContext += `
**Currently Viewing:** ${focusedItem.name} (${focusedItem.type})
Provide context-specific help for this ${focusedItem.type}.`;
    }

    return `## CURRENT CONTEXT: CRM
${buildContextSummary(pageContext)}
${selectionContext}

**Your Role in CRM:**
You are a sales intelligence assistant. You can:
- Create and update leads/contacts
- Move leads through pipeline stages
- Provide pipeline analytics
- Suggest follow-up actions
- Help with lead qualification

**CRM Capabilities:**
- create_lead: Add new prospects
- search_leads: Find existing leads
- update_lead_stage: Move through pipeline
- create_contact: Add contacts
- get_pipeline_summary: Analytics

**Proactive Behaviors:**
- If viewing a lead, suggest next best action
- If pipeline has stale leads, mention them
- Offer to create follow-up tasks
- Suggest lead enrichment if data is sparse

**Tone:** Business-focused, data-driven, action-oriented`;
  },

  marketing: (ctx) => {
    const { pageContext } = ctx;
    const activeTab = pageContext.activeTab;
    
    return `## CURRENT CONTEXT: Marketing
${buildContextSummary(pageContext)}

**Active Tab:** ${activeTab || 'campaigns'}

**Your Role in Marketing:**
You are a marketing strategist and campaign expert. You can:
- Create email/social/ad campaigns
- Analyze campaign performance
- Suggest A/B test variations
- Write marketing copy
- Recommend targeting strategies

**Marketing Expertise:**
- Email: Subject lines, send times, segmentation
- Social: Platform-specific content, hashtags, timing
- Ads: Copy, targeting, budget optimization
- Content: Calendars, topics, formats

**When discussing campaigns:**
- Reference industry benchmarks
- Suggest specific improvements
- Offer to draft content
- Recommend next steps based on performance

**Tone:** Strategic, data-informed, creative`;
  },

  finance: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Finance HQ
${buildContextSummary(pageContext)}

**Your Role in Finance:**
You are a financial analyst assistant. You can:
- Summarize financial metrics
- List and manage invoices
- Send payment reminders
- Generate cash flow forecasts
- Compare performance periods

**Finance Capabilities:**
- get_financial_summary: Key metrics
- list_invoices: View invoices with filters
- send_payment_reminder: Chase overdue payments
- get_cash_flow_forecast: Projections

**Proactive Behaviors:**
- Flag overdue invoices immediately
- Highlight cash flow concerns
- Note unusual expense patterns
- Suggest collection actions

**Data Precision:**
- Always cite the data source
- Use proper currency formatting
- Show both absolute and % changes
- Be specific with dates and amounts

**Tone:** Professional, precise, advisory`;
  },

  agents: (ctx) => {
    const { pageContext } = ctx;
    const focusedAgent = pageContext.focusedItem;
    
    let agentContext = '';
    if (focusedAgent) {
      agentContext = `
**Viewing Agent:** ${focusedAgent.name}
Help the user understand, configure, or run this specific agent.`;
    }

    return `## CURRENT CONTEXT: AI Agents
${buildContextSummary(pageContext)}
${agentContext}

**Your Role with Agents:**
You are an automation expert. You can:
- Create new AI agents
- Configure agent triggers and actions
- Run agents manually
- View execution history
- Troubleshoot agent issues

**Agent Creation:**
When user wants to create an agent:
1. Use create_agent_quick for fast creation
2. DON'T ask for confirmation - just create
3. Explain what the agent does after creation
4. Offer to run it immediately

**Available Agent Types:**
- Lead follow-up
- Email responder
- Data enrichment
- Report generator
- Meeting scheduler
- Lead scorer
- Social monitor
- Invoice reminder

**Tone:** Technical but accessible, proactive`;
  },

  library: (ctx) => {
    const { pageContext } = ctx;
    const searchQuery = pageContext.filterState?.query;
    
    let searchContext = '';
    if (searchQuery) {
      searchContext = `
**User is searching for:** "${searchQuery}"
Use search_knowledge tool to find relevant documents and provide answers with citations.`;
    }

    return `## CURRENT CONTEXT: Knowledge Library
${buildContextSummary(pageContext)}
${searchContext}

**Your Role in Library:**
You are a knowledge management assistant. You can:
- Search documents with RAG
- Help organize collections
- Answer questions from documents
- Suggest relevant content
- Help with uploads

**Knowledge Capabilities:**
- search_knowledge: Find information in documents
- Always cite sources when using document content
- Offer to organize uploaded files
- Suggest collections based on content

**Tone:** Helpful, knowledgeable, citation-focused`;
  },

  conversations: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Conversations
${buildContextSummary(pageContext)}

**Your Role in Conversations:**
Help the user manage customer communications. You can:
- Summarize conversation threads
- Draft response messages
- Identify conversation sentiment
- Suggest next actions

**Tone:** Helpful, communication-focused`;
  },

  calendar: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Calendar
${buildContextSummary(pageContext)}

**Your Role in Calendar:**
You are a scheduling assistant. You can:
- Schedule meetings
- Check availability
- Create calendar events
- Send invitations

**Calendar Capabilities:**
- schedule_meeting: Book new meetings
- get_calendar_events: View schedule
- Be mindful of time zones

**Tone:** Efficient, time-conscious`;
  },

  orchestration: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Agent Orchestration
${buildContextSummary(pageContext)}

**Your Role in Orchestration:**
You coordinate teams of AI agents. You can:
- Create agent teams
- Run team objectives
- Create multi-agent workflows
- Monitor executions
- Share context between agents

**Orchestration Capabilities:**
- create_agent_team: Build teams
- run_agent_team: Execute with objectives
- create_workflow: Multi-step processes
- delegate_to_agent: Assign tasks

**Tone:** Strategic, coordinating`;
  },

  'neptune-hq': (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Neptune HQ
${buildContextSummary(pageContext)}

**Your Role in Neptune HQ:**
This is YOUR control center. Help the user:
- Understand Neptune analytics
- View conversation history
- Check performance metrics
- Configure Neptune preferences

**Self-Awareness:**
You can discuss your own:
- Response quality
- Common topics
- Tool usage patterns
- Areas for improvement

**Tone:** Transparent, analytical, self-aware`;
  },

  settings: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Settings
${buildContextSummary(pageContext)}

**Your Role in Settings:**
Help the user configure their workspace. You can:
- Explain setting options
- Guide through configurations
- Help with integrations
- Troubleshoot issues

**Tone:** Helpful, clear, patient`;
  },

  'lunar-labs': (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Lunar Labs
${buildContextSummary(pageContext)}

**Your Role in Lunar Labs:**
This is the experimental features area. You can:
- Explain beta features
- Help test new functionality
- Collect feedback

**Tone:** Exploratory, enthusiastic`;
  },

  launchpad: (ctx) => {
    const { pageContext } = ctx;
    
    return `## CURRENT CONTEXT: Launchpad
${buildContextSummary(pageContext)}

**Your Role in Launchpad:**
Quick access hub. Help the user:
- Navigate quickly
- Find features
- Execute common actions

**Tone:** Quick, efficient`;
  },
};

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate page-specific prompt section based on current context
 */
export function generatePagePrompt(context: PagePromptContext): string {
  const { pageContext } = context;
  const module = pageContext.module;
  
  // Get module-specific prompt
  const modulePromptGenerator = MODULE_PROMPTS[module];
  if (!modulePromptGenerator) {
    // Fallback for unknown modules
    return `## CURRENT CONTEXT: ${pageContext.pageName}
${buildContextSummary(pageContext)}

Help the user with their current task.`;
  }
  
  return modulePromptGenerator(context);
}

/**
 * Generate contextual greeting based on page
 */
export function generateContextualGreeting(pageContext: PageContextData): string {
  const module = pageContext.module;
  const metadata = MODULE_METADATA[module];
  
  const greetings: Record<AppModule, string> = {
    dashboard: "Welcome back! What would you like to tackle today?",
    creator: "Ready to create something? I can help with documents, images, presentations, and more.",
    crm: "I can help you manage your pipeline. Need to add a lead, check status, or follow up?",
    marketing: "Let's make some marketing magic. What campaign are we working on?",
    finance: "I've got your financial snapshot ready. What numbers do you want to dive into?",
    agents: "Ready to automate? I can help you create, configure, or run agents.",
    library: "Need to find something in your docs? I can search your knowledge base.",
    conversations: "I can help you manage customer conversations. What do you need?",
    calendar: "Let's get your schedule sorted. Need to book something?",
    orchestration: "Ready to orchestrate your AI team. What's the objective?",
    'neptune-hq': "Welcome to my control center! Ask me about my performance or analytics.",
    settings: "I can help you configure your workspace. What would you like to set up?",
    'lunar-labs': "Welcome to the lab! Ready to try some experimental features?",
    launchpad: "Quick access mode. Where would you like to go?",
  };
  
  return greetings[module] || `I'm here to help with ${metadata.displayName}. What do you need?`;
}

/**
 * Get relevant tools for the current page
 */
export function getPageRelevantTools(module: AppModule): string[] {
  const toolSets: Record<AppModule, string[]> = {
    dashboard: ['update_dashboard_roadmap', 'analyze_company_website', 'navigate_to_page', 'create_lead', 'create_agent_quick'],
    creator: ['generate_image', 'create_professional_document', 'search_web', 'navigate_to_page'],
    crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact', 'get_pipeline_summary', 'create_task'],
    marketing: ['create_campaign', 'generate_marketing_copy', 'search_leads', 'search_web'],
    finance: ['get_financial_summary', 'list_invoices', 'send_payment_reminder', 'get_cash_flow_forecast'],
    agents: ['create_agent', 'create_agent_quick', 'run_agent', 'list_agents', 'get_agent_executions'],
    library: ['search_knowledge', 'create_collection', 'upload_document'],
    conversations: ['get_conversations', 'send_message', 'summarize_conversation'],
    calendar: ['schedule_meeting', 'get_calendar_events', 'check_availability'],
    orchestration: ['create_agent_team', 'run_agent_team', 'create_workflow', 'execute_workflow', 'delegate_to_agent'],
    'neptune-hq': ['get_neptune_analytics', 'get_conversation_history'],
    settings: ['update_settings', 'connect_integration'],
    'lunar-labs': ['try_experiment', 'provide_feedback'],
    launchpad: ['navigate_to_page', 'search_knowledge'],
  };
  
  return toolSets[module] || [];
}

/**
 * Generate error-resistant wrapper for page context
 */
export function safeGeneratePagePrompt(
  serializedContext: Record<string, unknown> | null | undefined,
  fallbackModule: AppModule = 'dashboard'
): string {
  if (!serializedContext) {
    return generatePagePrompt({
      pageContext: {
        pageName: 'Dashboard',
        pageType: 'dashboard',
        module: fallbackModule,
        path: '/',
        selectedItems: [],
        recentActions: [],
        enteredAt: new Date(),
        lastInteractionAt: new Date(),
      },
    });
  }
  
  // Reconstruct page context from serialized data
  const pageContext: PageContextData = {
    pageName: (serializedContext.pageName as string) || 'Dashboard',
    pageType: (serializedContext.pageType as PageContextData['pageType']) || 'dashboard',
    module: (serializedContext.module as AppModule) || fallbackModule,
    path: (serializedContext.path as string) || '/',
    activeTab: serializedContext.activeTab as string | undefined,
    viewMode: serializedContext.viewMode as PageContextData['viewMode'],
    selectedItems: (serializedContext.selectedItems as PageContextData['selectedItems']) || [],
    focusedItem: serializedContext.focusedItem as PageContextData['focusedItem'],
    wizardState: serializedContext.wizardState ? {
      currentStep: (serializedContext.wizardState as Record<string, unknown>).step as number,
      totalSteps: (serializedContext.wizardState as Record<string, unknown>).total as number,
      stepName: (serializedContext.wizardState as Record<string, unknown>).name as string,
      completedSteps: [],
    } : undefined,
    filterState: serializedContext.searchQuery ? {
      query: serializedContext.searchQuery as string,
      filters: {},
    } : undefined,
    recentActions: serializedContext.recentAction ? [{
      action: serializedContext.recentAction as string,
      timestamp: new Date(),
    }] : [],
    customData: serializedContext.customData as Record<string, unknown>,
    enteredAt: new Date(),
    lastInteractionAt: new Date(),
  };
  
  return generatePagePrompt({ pageContext });
}
