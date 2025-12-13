# Feature-to-Data Connection Map

**Generated:** 2025-12-13  
**Purpose:** Map features to their underlying data and API dependencies

---

## Feature Matrix

This map shows what each user-facing feature connects to in the backend.

```
Feature → Frontend Route → API Endpoints → Database Tables
```

---

## 🏠 DASHBOARD

| Component | API Endpoint | Database Tables |
|-----------|--------------|-----------------|
| Stats Cards | `/api/dashboard` | `agents`, `agentExecutions`, `deals`, `contacts` |
| Activity Feed | `/api/activity` | `auditLogs`, `agentLogs`, `notifications` |
| Agent Status | `/api/agents` | `agents`, `agentExecutions` |
| Workflow Status | `/api/workflows` | `agentWorkflows`, `agentWorkflowExecutions` |
| Quick Actions | Multiple endpoints | Various |

---

## 👥 CRM

### Contacts Management
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| List contacts | `GET /api/crm/contacts` | `contacts` |
| Create contact | `POST /api/crm/contacts` | `contacts` |
| Update contact | `PUT /api/crm/contacts/[id]` | `contacts` |
| Delete contact | `DELETE /api/crm/contacts/[id]` | `contacts` |
| Import CSV | `POST /api/crm/contacts/import` | `contacts`, `dataImports` |
| Export CSV | `GET /api/crm/contacts/export` | `contacts`, `dataExports` |

### Deals Pipeline
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| List deals | `GET /api/crm/deals` | `deals`, `contacts` |
| Create deal | `POST /api/crm/deals` | `deals` |
| Update deal | `PUT /api/crm/deals/[id]` | `deals` |
| Move stage | `PATCH /api/crm/deals/[id]` | `deals` |
| Kanban view | `GET /api/crm/deals` | `deals`, `contacts` |

### Lead Management
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Lead scoring | `POST /api/crm/score` | `contacts`, `leadScoringRules` |
| Scoring rules | `/api/crm/scoring-rules` | `leadScoringRules`, `leadScoringTiers` |
| Routing rules | `/api/crm/routing-rules` | `leadRoutingRules` |

### Analytics
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| CRM analytics | `GET /api/crm/analytics` | `deals`, `contacts`, `crmInteractions` |
| Revenue reports | `GET /api/crm/reports/revenue` | `deals`, `invoices` |
| AI insights | `GET /api/crm/insights` | `deals`, `contacts`, `proactiveInsights` |

---

## 🤖 AGENTS

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| List agents | `GET /api/agents` | `agents` |
| Create agent | `POST /api/agents` | `agents` |
| Configure agent | `PUT /api/agents/[id]` | `agents` |
| Execute agent | `POST /api/agents/[id]/run` | `agents`, `agentExecutions`, `agentLogs` |
| Agent chat | `POST /api/agents/[id]/chat` | `agents`, `aiMessages` |
| Agent templates | `GET /api/agent-templates` | `agentTemplates` |
| Agent schedules | N/A | `agentSchedules` |

---

## ⚙️ ORCHESTRATION

### Agent Teams
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| List teams | `GET /api/orchestration/teams` | `agentTeams`, `agentTeamMembers` |
| Create team | `POST /api/orchestration/teams` | `agentTeams` |
| Team config | `PUT /api/orchestration/teams/[id]` | `agentTeams`, `agentTeamMembers` |
| Team execution | N/A | `agentTeams`, `agentWorkflowExecutions` |

### Workflows
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| List workflows | `GET /api/orchestration/workflows` | `agentWorkflows` |
| Create workflow | `POST /api/orchestration/workflows` | `agentWorkflows` |
| Execute workflow | `POST /api/orchestration/workflows/[id]/execute` | `agentWorkflows`, `agentWorkflowExecutions` |
| Execution history | `GET /api/orchestration/workflows/executions` | `agentWorkflowExecutions` |

### Approvals
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Approval queue | `GET /api/orchestration/approvals` | `agentPendingActions` |
| Approve/Reject | `POST /api/orchestration/approvals/[id]` | `agentPendingActions`, `agentActionAuditLog` |
| Audit log | `GET /api/orchestration/audit` | `agentActionAuditLog` |

### Memory
| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Shared memory | `GET /api/orchestration/memory` | `agentSharedMemory` |
| Agent messages | `GET /api/orchestration/messages` | `agentMessages` |

---

## 🤖 NEPTUNE AI

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Chat | `POST /api/assistant/chat` | `aiConversations`, `aiMessages` |
| Streaming | `POST /api/assistant/stream` | `aiConversations`, `aiMessages` |
| Conversations | `GET /api/assistant/conversations` | `aiConversations` |
| Preferences | `GET/PUT /api/assistant/preferences` | `aiUserPreferences` |
| Feedback | `POST /api/assistant/feedback` | `aiMessageFeedback` |
| Insights | `GET /api/assistant/insights` | `proactiveInsights` |
| Action history | N/A | `neptuneActionHistory` |

---

## 💰 FINANCE

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Overview | `GET /api/finance/overview` | `invoices`, `expenses` |
| Revenue | `GET /api/finance/revenue` | `invoices`, `deals` |
| Cash flow | `GET /api/finance/cashflow` | `invoices`, `expenses` |
| Invoices | `/api/finance/invoices` | `invoices`, `customers` |
| Expenses | `/api/finance/expenses` | `expenses`, `projects` |
| Integrations | `GET /api/finance/integrations` | `integrations`, `oauthTokens` |

---

## 📈 MARKETING

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Channels | `/api/marketing/channels` | `marketingChannels` |
| Campaigns | `/api/campaigns` | `campaigns`, `campaignRecipients` |
| Segments | N/A | `segments` |
| Automation | N/A | `automationRules`, `automationExecutions` |

---

## 💬 COMMUNICATIONS

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Conversations | `/api/conversations` | `conversations`, `conversationMessages`, `conversationParticipants` |
| Phone numbers | `/api/workspaces/[id]/phone-numbers` | `workspacePhoneNumbers` |
| Team channels | `/api/team/channels` | `teamChannels`, `teamMessages`, `teamChannelMembers` |
| Notifications | N/A | `notifications`, `inboxMessages` |

---

## 📚 KNOWLEDGE BASE

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Documents | `/api/knowledge` | `knowledgeItems`, `knowledgeCollections` |
| Upload | `POST /api/knowledge/upload` | `knowledgeItems` |
| Search | `GET /api/knowledge/search` | `knowledgeItems` (+ vector DB) |
| Tags | N/A | `knowledgeTags`, `knowledgeItemTags` |

---

## 📝 CONTENT / BLOG

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Posts | `/api/admin/posts` | `blogPosts`, `blogCategories`, `blogTags` |
| Topics | `/api/admin/topics` | `topicIdeas` |
| Sources | `/api/admin/sources`, `/api/admin/content-sources` | `articleSources`, `contentSources` |
| Use Cases | `/api/admin/use-cases` | `useCases` |
| Hit List | `/api/admin/hit-list` | `topicIdeas` |
| Analytics | `/api/admin/analytics/*` | `articleAnalytics` |
| Voice Profile | `/api/admin/blog-profile` | `blogVoiceProfiles` |
| Alert Badges | `/api/admin/alert-badges` | `alertBadges` |

---

## 🎨 CREATOR STUDIO

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Items | `/api/creator/items` | `creatorItems` |
| Collections | `/api/creator/collections` | `creatorCollections`, `creatorItemCollections` |
| Templates | `/api/creator/templates` | `creatorTemplates` |
| Sharing | `/api/creator/share` | `sharedDocuments` |

---

## ⚙️ SETTINGS

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Profile | `/api/settings/profile` | `users` |
| Appearance | `/api/settings/appearance` | `users.preferences` |
| Notifications | `/api/settings/notifications` | `users.preferences` |
| API Keys | `/api/settings/api-keys` | `workspaceApiKeys` |
| Webhooks | `/api/settings/webhooks` | `webhooks`, `webhookDeliveries` |
| Team | `/api/settings/team` | `workspaceMembers` |
| Workspace | `/api/settings/workspace` | `workspaces` |
| Billing | `/api/settings/billing` | `workspaces` (Stripe fields) |

---

## 🔗 INTEGRATIONS

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Connected Apps | `/api/integrations/*` | `integrations` |
| OAuth | `/api/auth/oauth/*` | `oauthTokens` |

---

## 🔄 GALAXY GRIDS (Visual Workflows)

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Grids | `/api/workflows` | `galaxyGrids` |
| Nodes | N/A | `gridNodes` |
| Edges | N/A | `gridEdges` |
| Executions | N/A | `gridExecutions`, `executionSteps` |
| Templates | N/A | `gridTemplates` |
| Versions | N/A | `gridVersions` |

---

## 📊 To-Do HQ (Admin)

| Feature | API Endpoint | Database Tables |
|---------|--------------|-----------------|
| Sprints | `/api/admin/todo-hq/sprints` | `todoHqSprints` |
| Epics | `/api/admin/todo-hq/epics` | `todoHqEpics` |
| Tasks | `/api/admin/todo-hq/tasks` | `todoHqTasks` |

---

## 🎯 Use Case Profile Template Connection

When creating use-case profiles, these are the key features each use case might highlight:

| Use Case Category | Primary Features | Tables Involved |
|-------------------|------------------|-----------------|
| **Sales Team** | CRM, Deals, Lead Scoring, Agents | `contacts`, `deals`, `leadScoringRules`, `agents` |
| **Marketing Team** | Campaigns, Analytics, Content | `campaigns`, `segments`, `blogPosts`, `articleAnalytics` |
| **Support Team** | Conversations, Knowledge, Agents | `conversations`, `knowledgeItems`, `agents` |
| **Operations** | Orchestration, Workflows, Approvals | `agentTeams`, `agentWorkflows`, `agentPendingActions` |
| **Finance** | Invoices, Expenses, Reports | `invoices`, `expenses`, `deals` |
| **Solopreneur** | All-in-one: CRM, Marketing, Finance | Multiple |
| **Enterprise** | Full platform + SSO + Audit | All tables + `auditLogs` |

---

*This map is essential for creating accurate use-case profiles and understanding feature dependencies.*
