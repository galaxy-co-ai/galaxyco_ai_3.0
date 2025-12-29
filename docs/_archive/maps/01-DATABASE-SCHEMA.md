# Database Schema Map

**Generated:** 2025-12-13  
**Source:** `src/db/schema.ts` (7,231 lines)  
**Total Tables:** 85+ tables  
**Architecture:** Multi-tenant with workspace isolation

---

## Quick Reference: Table Count by Domain

| Domain | Tables | Description |
|--------|--------|-------------|
| Core/Auth | 4 | Workspaces, users, members, API keys |
| Agents | 6 | Agent configs, templates, executions |
| Orchestration | 8 | Teams, workflows, memory, approvals |
| Knowledge | 4 | Collections, items, tags |
| AI/Neptune | 8 | Conversations, preferences, insights |
| CRM | 6 | Contacts, deals, prospects, interactions |
| Finance | 2 | Invoices, expenses |
| Marketing | 9 | Campaigns, segments, automation |
| Communications | 9 | Conversations, messages, phone numbers |
| Content/Blog | 16 | Posts, topics, sources, analytics |
| Creator Studio | 4 | Items, collections, templates |
| Workflows (Grid) | 7 | Visual workflow builder |
| Admin/System | 8 | Feedback, webhooks, analytics |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    %% =====================
    %% CORE MULTI-TENANT
    %% =====================
    
    workspaces ||--o{ users : "has members"
    workspaces ||--o{ workspaceMembers : "has"
    users ||--o{ workspaceMembers : "belongs to"
    workspaces ||--o{ workspaceApiKeys : "has"

    %% =====================
    %% AGENTS
    %% =====================
    
    workspaces ||--o{ agents : "has"
    agents ||--o{ agentExecutions : "has"
    agents ||--o{ agentSchedules : "has"
    agents ||--o{ agentLogs : "has"

    %% =====================
    %% ORCHESTRATION
    %% =====================
    
    workspaces ||--o{ agentTeams : "has"
    agentTeams ||--o{ agentTeamMembers : "has"
    agents ||--o{ agentTeamMembers : "member of"
    workspaces ||--o{ agentWorkflows : "has"
    agentWorkflows ||--o{ agentWorkflowExecutions : "has"
    workspaces ||--o{ agentSharedMemory : "has"
    workspaces ||--o{ agentMessages : "has"

    %% =====================
    %% CRM
    %% =====================
    
    workspaces ||--o{ contacts : "has"
    workspaces ||--o{ deals : "has"
    contacts ||--o{ deals : "associated with"
    contacts ||--o{ crmInteractions : "has"
    workspaces ||--o{ prospects : "has"
    workspaces ||--o{ customers : "has"

    %% =====================
    %% COMMUNICATIONS
    %% =====================
    
    workspaces ||--o{ conversations : "has"
    conversations ||--o{ conversationMessages : "has"
    conversations ||--o{ conversationParticipants : "has"
    workspaces ||--o{ workspacePhoneNumbers : "has"

    %% =====================
    %% CONTENT/BLOG
    %% =====================
    
    workspaces ||--o{ blogPosts : "has"
    blogPosts }o--o{ blogCategories : "categorized"
    blogPosts }o--o{ blogTags : "tagged"
    workspaces ||--o{ topicIdeas : "has"
    workspaces ||--o{ contentSources : "has"


---

## Detailed Tables by Domain

### 1. CORE/MULTI-TENANT

```
┌─────────────────────────────────────────────────────────────────┐
│                        workspaces                               │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ name, slug (unique)                                             │
│ clerkOrganizationId                                             │
│ subscriptionTier (free/starter/professional/enterprise)         │
│ stripeCustomerId, stripeSubscriptionId                          │
│ settings (JSONB: branding, features, notifications)             │
│ encryptedApiKeys (JSONB: openai, anthropic, google)             │
│ isActive, createdAt, updatedAt                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          users                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ clerkUserId (unique)                                            │
│ email, firstName, lastName, avatarUrl                           │
│ preferences (JSONB: theme, timezone, notifications)             │
│ lastLoginAt, createdAt, updatedAt                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     workspaceMembers                            │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ workspaceId (FK → workspaces)                                   │
│ userId (FK → users)                                             │
│ role (owner/admin/member/viewer)                                │
│ permissions (JSONB: agents, packs, billing, members)            │
│ invitedBy (FK → users), joinedAt, isActive                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     workspaceApiKeys                            │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ workspaceId (FK → workspaces)                                   │
│ provider, name                                                  │
│ encryptedKey, iv, authTag (AES-256-GCM)                         │
│ isActive, lastUsedAt, createdBy (FK → users)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2. AGENTS

```
┌─────────────────────────────────────────────────────────────────┐
│                          agents                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ workspaceId (FK → workspaces) ⚠️ REQUIRED                       │
│ name, description                                               │
│ type (scope/call/email/note/task/content/custom/...)            │
│ status (draft/active/paused/archived)                           │
│ config (JSONB: aiProvider, model, systemPrompt, tools)          │
│ sourcePackId, isCustom, createdBy (FK → users)                  │
│ executionCount, lastExecutedAt                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      agentTemplates                             │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ name, slug (unique), description, shortDescription              │
│ category, type, iconUrl, coverImageUrl, badgeText               │
│ config (JSONB: model, systemPrompt, tools, triggers)            │
│ kpis (JSONB: successRate, avgTimeSaved, accuracy)               │
│ installCount, rating, reviewCount                               │
│ installs24h, installs7d, installs30d, trendingScore             │
│ isPublished, isFeatured, publishedAt                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        agentPacks                               │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ name, slug (unique), description, category                      │
│ agentTemplates (JSONB array of configs)                         │
│ authorId, authorName, iconUrl, coverImageUrl, tags              │
│ pricingType (free/one-time/subscription), price                 │
│ installCount, rating, reviewCount, isPublished                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      agentExecutions                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, agentId (FK), triggeredBy (FK → users)             │
│ status (pending/running/completed/failed/cancelled)             │
│ input, output, error (JSONB)                                    │
│ durationMs, tokensUsed, cost                                    │
│ startedAt, completedAt                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       agentSchedules                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, agentId (FK)                                       │
│ triggerType (manual/scheduled/webhook)                          │
│ cron, timezone, webhookUrl, webhookSecret                       │
│ enabled, nextRunAt, lastRunAt, lastRunStatus                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         agentLogs                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, agentId, tenantId, userId                          │
│ inputSummary, outputSummary                                     │
│ duration, success, provider, model                              │
│ error, metadata, timestamp                                      │
└─────────────────────────────────────────────────────────────────┘
```


### 3. ORCHESTRATION (Multi-Agent Coordination)

```
┌─────────────────────────────────────────────────────────────────┐
│                        agentTeams                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, department (sales/marketing/support/operations/...)       │
│ description, coordinatorAgentId (FK → agents)                   │
│ config (JSONB: autonomyLevel, approvalRequired, workingHours)   │
│ status (active/paused/archived)                                 │
│ totalExecutions, successfulExecutions, lastActiveAt             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     agentTeamMembers                            │
├─────────────────────────────────────────────────────────────────┤
│ teamId (FK → agentTeams), agentId (FK → agents)                 │
│ role (coordinator/specialist/support)                           │
│ priority (execution order)                                      │
│ config (JSONB: specializations, fallbackFor)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       agentMessages                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ fromAgentId, toAgentId, teamId (FKs)                            │
│ messageType (task/result/context/handoff/status/query)          │
│ content (JSONB: subject, body, data, priority)                  │
│ parentMessageId, threadId                                       │
│ status (pending/delivered/read/processed)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      agentWorkflows                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, teamId (FKs)                                       │
│ name, description, category                                     │
│ triggerType (manual/event/schedule/agent_request)               │
│ triggerConfig (JSONB: eventType, cron, conditions)              │
│ steps (JSONB array: id, name, agentId, action, inputs)          │
│ status (active/paused/archived/draft)                           │
│ totalExecutions, successfulExecutions, avgDurationMs            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  agentWorkflowExecutions                        │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, workflowId (FKs)                                   │
│ status (running/completed/failed/paused/cancelled)              │
│ currentStepId, currentStepIndex                                 │
│ stepResults (JSONB map: stepId → result)                        │
│ context (JSONB: shared between steps)                           │
│ triggeredBy, triggerType, triggerData                           │
│ durationMs, totalSteps, completedSteps                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     agentSharedMemory                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, teamId, agentId (FKs)                              │
│ memoryTier (short_term/medium_term/long_term)                   │
│ category (context/pattern/preference/knowledge/relationship)    │
│ key, value (JSONB)                                              │
│ metadata (JSONB: source, confidence, lastAccessed)              │
│ importance (0-100), expiresAt                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    agentPendingActions                          │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, agentId, teamId (FKs)                              │
│ actionType, riskLevel (low/medium/high/critical)                │
│ title, description, details (JSONB)                             │
│ status (pending/approved/rejected/expired)                      │
│ requestedAt, expiresAt, reviewedBy, reviewedAt                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   agentActionAuditLog                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, agentId, teamId (FKs)                              │
│ actionType, actionDetails (JSONB)                               │
│ success, error                                                  │
│ triggeredBy (user/schedule/workflow/agent)                      │
│ executedAt, durationMs                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4. CRM

```
┌─────────────────────────────────────────────────────────────────┐
│                         contacts                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK), ownerId (FK → users)                          │
│ firstName, lastName, email, phone                               │
│ company, jobTitle, source, status (lead/active/inactive/...)    │
│ tags (text array), customFields (JSONB)                         │
│ lastContactedAt, leadScore                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          deals                                  │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK), contactId (FK → contacts)                     │
│ name, value, currency                                           │
│ stage (qualification/discovery/proposal/negotiation/closed_*)   │
│ priority (low/medium/high/critical)                             │
│ probability, expectedCloseDate, actualCloseDate                 │
│ ownerId (FK → users), source, notes                             │
│ lostReason, customFields (JSONB)                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       crmInteractions                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, contactId (FKs)                                    │
│ type (call/email/meeting/note/task/sms/whatsapp/linkedin)       │
│ direction (inbound/outbound)                                    │
│ subject, content, outcome                                       │
│ duration, scheduledAt, completedAt                              │
│ agentId (FK), userId (FK)                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        prospects                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK), contactId (FK)                                │
│ stage (new/contacted/qualified/proposal/negotiation/won/lost)   │
│ value, probability, expectedCloseDate                           │
│ ownerId (FK → users), source, notes                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        customers                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, email, phone, company                                     │
│ status (lead/active/inactive/churned)                           │
│ assignedTo (FK → users), tags, notes                            │
│ lifetimeValue, lastOrderAt                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        projects                                 │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, customerId (FKs)                                   │
│ name, description                                               │
│ status (planning/in_progress/on_hold/completed/cancelled)       │
│ budget, startDate, endDate, actualEndDate                       │
│ managerId (FK → users)                                          │
└─────────────────────────────────────────────────────────────────┘
```


### 5. FINANCE

```
┌─────────────────────────────────────────────────────────────────┐
│                         invoices                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, customerId, projectId (FKs)                        │
│ invoiceNumber, amount, currency, tax                            │
│ status (draft/sent/paid/overdue/cancelled)                      │
│ dueDate, paidAt, notes, lineItems (JSONB)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         expenses                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, projectId (FKs), submittedBy (FK → users)          │
│ description, amount, currency                                   │
│ category (travel/meals/software/hardware/marketing/...)         │
│ status (pending/approved/rejected/reimbursed)                   │
│ date, receipt (URL), vendor                                     │
│ approvedBy (FK), approvedAt                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 6. MARKETING

```
┌─────────────────────────────────────────────────────────────────┐
│                     marketingChannels                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, type (email/social/ads/content/seo/affiliate)             │
│ status (active/paused/archived)                                 │
│ config (JSONB: credentials, settings)                           │
│ budget, spent, metrics (JSONB)                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         campaigns                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, channelId, segmentId (FKs)                         │
│ name, type, subject, content (JSONB)                            │
│ status (draft/scheduled/active/paused/completed)                │
│ scheduledAt, sentAt, completedAt                                │
│ budget, spent, metrics (JSONB: sent, delivered, opened, etc)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    campaignRecipients                           │
├─────────────────────────────────────────────────────────────────┤
│ campaignId, contactId (FKs)                                     │
│ status (pending/sent/delivered/opened/clicked/bounced/...)      │
│ sentAt, deliveredAt, openedAt, clickedAt                        │
│ errorMessage                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         segments                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, description                                               │
│ rules (JSONB: field, operator, value)                           │
│ contactCount, lastCalculatedAt                                  │
│ isActive                                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     automationRules                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, description                                               │
│ triggerType (lead_created/deal_stage_changed/email_opened/...)  │
│ triggerConfig (JSONB)                                           │
│ actionType (send_email/create_task/update_field/...)            │
│ actionConfig (JSONB)                                            │
│ status (active/paused/draft/archived)                           │
│ executionCount, lastExecutedAt                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    leadScoringRules                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, field, operator, value, points                            │
│ type (demographic/behavioral/engagement)                        │
│ isActive, priority                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    leadRoutingRules                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, conditions (JSONB), assignTo (FK → users)                 │
│ roundRobin (bool), roundRobinUsers (JSONB)                      │
│ isActive, priority                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 7. COMMUNICATIONS

```
┌─────────────────────────────────────────────────────────────────┐
│                       conversations                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, contactId (FKs)                                    │
│ channel (email/sms/call/whatsapp/social/live_chat)              │
│ status (active/archived/closed/spam)                            │
│ subject, lastMessageAt, messageCount                            │
│ assignedTo (FK → users), tags                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  conversationMessages                           │
├─────────────────────────────────────────────────────────────────┤
│ conversationId (FK)                                             │
│ direction (inbound/outbound)                                    │
│ content, contentType                                            │
│ senderType (contact/user/agent/system)                          │
│ senderId, metadata (JSONB)                                      │
│ isRead, readAt, deliveredAt                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 conversationParticipants                        │
├─────────────────────────────────────────────────────────────────┤
│ conversationId, userId (FKs)                                    │
│ role (owner/participant/observer)                               │
│ lastReadAt, notificationsEnabled                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  workspacePhoneNumbers                          │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ phoneNumber, friendlyName                                       │
│ provider (signalwire/twilio)                                    │
│ capabilities (JSONB: voice, sms, mms)                           │
│ status, monthlyPrice                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       teamChannels                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ name, type (general/direct/group/announcement)                  │
│ description, isPrivate                                          │
│ lastMessageAt, memberCount                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┤
│                       teamMessages                              │
├─────────────────────────────────────────────────────────────────┤
│ channelId, senderId (FKs)                                       │
│ content, contentType, attachments (JSONB)                       │
│ parentMessageId, threadCount                                    │
│ isPinned, isEdited, editedAt                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       notifications                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ type (info/success/warning/error/mention/assignment/reminder)   │
│ title, message, link                                            │
│ data (JSONB), isRead, readAt                                    │
└─────────────────────────────────────────────────────────────────┘
```


### 8. AI / NEPTUNE ASSISTANT

```
┌─────────────────────────────────────────────────────────────────┐
│                      aiConversations                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ title, model                                                    │
│ context (JSONB: page, entity, userData)                         │
│ messageCount, lastMessageAt                                     │
│ isArchived, isPinned                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        aiMessages                               │
├─────────────────────────────────────────────────────────────────┤
│ conversationId (FK)                                             │
│ role (user/assistant/system)                                    │
│ content, model                                                  │
│ tokens (JSONB: prompt, completion)                              │
│ metadata (JSONB: context, tools, functionCalls)                 │
│ responseTimeMs                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     aiUserPreferences                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ preferences (JSONB: tone, context, shortcuts)                   │
│ shortcuts (JSONB array: command, action)                        │
│ recentSearches (text array), favoriteAgents (text array)        │
│ learningData (JSONB)                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    neptuneActionHistory                         │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ actionType, target                                              │
│ input, output (JSONB)                                           │
│ success, error, durationMs                                      │
│ aiModel, tokensUsed                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     proactiveInsights                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ type (opportunity/warning/recommendation/milestone)             │
│ title, description, priority                                    │
│ data (JSONB), actions (JSONB)                                   │
│ status (pending/seen/acted/dismissed), expiresAt                │
└─────────────────────────────────────────────────────────────────┘
```

### 9. KNOWLEDGE BASE

```
┌─────────────────────────────────────────────────────────────────┐
│                   knowledgeCollections                          │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ name, description                                               │
│ isDefault, isPublic, itemCount                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      knowledgeItems                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, collectionId, createdBy (FKs)                      │
│ name, type (document/url/image/text)                            │
│ content, sourceUrl, mimeType, fileSize                          │
│ status (processing/ready/failed)                                │
│ vectorId (for embedding lookup)                                 │
│ metadata (JSONB: extractedText, summary, entities)              │
│ lastIndexedAt                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      knowledgeTags                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, color, itemCount                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    knowledgeItemTags                            │
├─────────────────────────────────────────────────────────────────┤
│ itemId (FK → knowledgeItems)                                    │
│ tagId (FK → knowledgeTags)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 10. CONTENT / BLOG / LAUNCHPAD

```
┌─────────────────────────────────────────────────────────────────┐
│                         blogPosts                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, categoryId, authorId (FKs)                         │
│ title, slug (unique), excerpt, content                          │
│ contentType (article/tool-spotlight)                            │
│ status (draft/published/scheduled/archived)                     │
│ publishedAt, scheduledAt                                        │
│ featuredImageUrl, readingTime                                   │
│ seoTitle, seoDescription, seoKeywords                           │
│ viewCount, likeCount, commentCount                              │
│ isFeatured, isHeroPost                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        topicIdeas                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ title, description, angle, targetAudience                       │
│ status (saved/in_progress/published/archived)                   │
│ generatedBy (ai/user), sourceData (JSONB)                       │
│ searchVolume, competitionLevel                                  │
│ priority, layoutTemplate                                        │
│ outline (JSONB), sources (JSONB array)                          │
│ workingDraft (JSONB), publishedPostId                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       contentSources                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, addedBy (FKs)                                      │
│ name, url, type (news/research/competitor/inspiration/...)      │
│ status (active/suggested/rejected/archived)                     │
│ description, frequency                                          │
│ aiAnalysis (JSONB), lastCheckedAt, articlesFound                │
│ relevanceScore, qualityScore                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      articleAnalytics                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, postId (FKs)                                       │
│ date, views, uniqueVisitors, avgTimeOnPage                      │
│ bounceRate, scrollDepth, socialShares                           │
│ trafficSources (JSONB), deviceBreakdown (JSONB)                 │
│ conversionCount, conversionRate                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         useCases                                │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ title, slug, description                                        │
│ category (b2b_saas/b2c_app/agency/enterprise/...)               │
│ status (draft/complete/published/archived)                      │
│ persona (JSONB), problemStatement, solutionOverview             │
│ features (JSONB array), implementationSteps (JSONB array)       │
│ expectedOutcomes (JSONB), metrics (JSONB)                       │
│ relatedAgentIds, relatedWorkflowIds                             │
│ testimonial (JSONB), publishedAt                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        alertBadges                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ type (trend/opportunity/warning/milestone/suggestion)           │
│ status (unread/read/dismissed/actioned)                         │
│ title, message, data (JSONB), actions (JSONB)                   │
│ priority, expiresAt                                             │
└─────────────────────────────────────────────────────────────────┘
```


### 11. CREATOR STUDIO

```
┌─────────────────────────────────────────────────────────────────┐
│                       creatorItems                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ title, type, content (JSONB)                                    │
│ status (draft/published), isPublic                              │
│ viewCount, shareCount                                           │
│ settings (JSONB: style, permissions)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    creatorCollections                           │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ name, description, isPublic                                     │
│ itemCount                                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     creatorTemplates                            │
├─────────────────────────────────────────────────────────────────┤
│ name, description, category                                     │
│ content (JSONB), previewImageUrl                                │
│ isPublic, usageCount                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     sharedDocuments                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, creatorItemId, createdBy (FKs)                     │
│ shareToken (unique), permission (view/comment)                  │
│ password (hashed), expiresAt                                    │
│ viewCount, isActive                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 12. GALAXY GRIDS (Visual Workflow Builder)

```
┌─────────────────────────────────────────────────────────────────┐
│                        galaxyGrids                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ name, description                                               │
│ status (draft/published/archived)                               │
│ triggerType, triggerConfig (JSONB)                              │
│ settings (JSONB: timeout, retryPolicy, errorHandling)           │
│ version, publishedAt                                            │
│ executionCount, successRate, avgDuration                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        gridNodes                                │
├─────────────────────────────────────────────────────────────────┤
│ gridId (FK → galaxyGrids)                                       │
│ nodeId (unique within grid), type                               │
│ (trigger/action/condition/loop/ai/webhook/delay/transform/...)  │
│ label, description                                              │
│ config (JSONB: params, inputs, outputs)                         │
│ position (JSONB: x, y), dimensions (JSONB: width, height)       │
│ status (idle/pending/running/success/error/skipped)             │
│ isEnabled, executionOrder                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        gridEdges                                │
├─────────────────────────────────────────────────────────────────┤
│ gridId (FK → galaxyGrids)                                       │
│ edgeId (unique), sourceNodeId, targetNodeId                     │
│ type (default/conditional/loop/error)                           │
│ label, config (JSONB: condition, priority)                      │
│ isEnabled                                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       gridExecutions                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, gridId (FKs)                                       │
│ status (pending/running/completed/failed/cancelled)             │
│ triggerType, triggerData (JSONB)                                │
│ context (JSONB), result (JSONB), error (JSONB)                  │
│ startedAt, completedAt, durationMs                              │
│ nodesExecuted, nodesSucceeded, nodesFailed                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      executionSteps                             │
├─────────────────────────────────────────────────────────────────┤
│ executionId (FK → gridExecutions)                               │
│ nodeId, nodeName, nodeType                                      │
│ status (pending/running/completed/failed/skipped)               │
│ input, output, error (JSONB)                                    │
│ startedAt, completedAt, durationMs                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       gridTemplates                             │
├─────────────────────────────────────────────────────────────────┤
│ name, slug (unique), description, category                      │
│ nodes (JSONB), edges (JSONB)                                    │
│ settings (JSONB), previewImageUrl                               │
│ isPublished, isFeatured, usageCount                             │
└─────────────────────────────────────────────────────────────────┘
```

### 13. ADMIN / SYSTEM

```
┌─────────────────────────────────────────────────────────────────┐
│                     platformFeedback                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ type (bug/suggestion/general/feature_request)                   │
│ status (new/in_review/planned/in_progress/done/closed/wont_fix) │
│ title, description, url, userAgent                              │
│ sentiment (very_negative → very_positive)                       │
│ priority, assignedTo (FK), category                             │
│ screenshot, metadata (JSONB)                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       todoHqSprints                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, description                                               │
│ status (planned/in_progress/completed/cancelled)                │
│ startDate, endDate                                              │
│ goals (text array), sortOrder                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        todoHqEpics                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ name, description                                               │
│ status (not_started/in_progress/completed/on_hold)              │
│ targetCompletionPercent, tags (text array)                      │
│ sortOrder                                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        todoHqTasks                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, epicId, sprintId (FKs)                             │
│ title, description                                              │
│ status (todo/in_progress/done/cancelled)                        │
│ priority (low/medium/high/urgent)                               │
│ sortOrder, tags (text array), notes                             │
│ dueDate, completedAt                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          webhooks                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, createdBy (FKs)                                    │
│ name, url, events (text array)                                  │
│ secret (HMAC signing key)                                       │
│ isActive, lastTriggeredAt                                       │
│ successCount, failureCount                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      webhookDeliveries                          │
├─────────────────────────────────────────────────────────────────┤
│ webhookId (FK)                                                  │
│ event, payload (JSONB)                                          │
│ responseStatus, responseBody                                    │
│ success, attempts, lastAttemptAt                                │
│ error                                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         auditLogs                               │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId (FKs)                                       │
│ action, entityType, entityId                                    │
│ changes (JSONB: before, after)                                  │
│ ipAddress, userAgent                                            │
│ metadata (JSONB)                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        integrations                             │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId (FK)                                                │
│ provider (google/microsoft/slack/salesforce/hubspot/...)        │
│ status (active/inactive/error/expired)                          │
│ config (JSONB)                                                  │
│ scopes (text array), lastSyncAt                                 │
│ errorMessage, retryCount                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        oauthTokens                              │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, integrationId (FKs)                                │
│ accessToken, refreshToken (encrypted)                           │
│ expiresAt, scopes (text array)                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      analyticsEvents                            │
├─────────────────────────────────────────────────────────────────┤
│ workspaceId, userId, sessionId                                  │
│ event, page, referrer, userAgent                                │
│ data (JSONB), timestamp                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Security Notes

⚠️ **MULTI-TENANT SECURITY RULE (4kR94Z3XhqK4C54vwDDwnq):**
- ALL queries MUST include `workspaceId` filter in WHERE clauses
- NEVER expose data across tenant boundaries
- Validate `workspaceId` matches authenticated user's tenant
- Encrypted fields use AES-256-GCM

---

*Generated from schema.ts — update this map when schema changes significantly.*
