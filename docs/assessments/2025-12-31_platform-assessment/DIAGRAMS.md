# GalaxyCo.ai 3.0 — Architecture Diagrams (Mermaid)
Date: 2025-12-31

These are “single-page” diagrams per domain (system overview + Neptune + Agents/Orchestration + Blog/Content Engine + Auth/Workspace identity + UX journey + proposed IA).

---

## 1) System Overview (Frontend + Backend + Data + External Services)
```mermaid
flowchart TB
  U[User Browser] -->|HTTP| NX[Next.js App Router]

  subgraph ROUTES[Routes]
    PUB[Public Routes<br/>/ /pricing /features ...<br/>Should include: /blog*]
    APP[Protected App Routes<br/>src/app/(app)/*]
  end

  NX --> PUB
  NX --> APP

  subgraph AUTH[Auth + Route Protection]
    MW[src/middleware.ts<br/>Clerk allowlist/guard]
    CLERK[Clerk Auth + Orgs]
  end

  PUB --> MW
  APP --> MW
  MW --> CLERK

  subgraph API[Next.js API Routes]
    A1[/api/assistant/* (Neptune)/]
    A2[/api/orchestration/* (Teams/Workflows/Approvals)/]
    A3[/api/blog/* (public content + engagement)/]
    A4[/api/admin/* (Mission Control + Article Studio)/]
    A5[/api/search + /api/newsletter/subscribe/]
  end

  NX --> API

  subgraph DB[Neon Postgres (via Drizzle)]
    W[workspaces + workspaceMembers]
    AI[aiConversations + aiMessages]
    ORCH[agents + teams + workflows + approvals + sharedMemory]
    BLOG[blogPosts + blogCategories + engagement tables]
    HQ[neptuneConversations + neptuneSettings (HQ)]
  end

  API --> DB

  subgraph EXT[External Services]
    OAI[OpenAI (gpt-4o)]
    BLOB[Vercel Blob (uploads)]
    TRIG[Trigger.dev (background jobs)]
    PUSH[Pusher (realtime)]
    SEN[Sentry (monitoring)]
  end

  A1 --> OAI
  A1 --> BLOB
  A2 --> TRIG
  NX --> PUSH
  NX --> SEN
```

---

## 2) UX Journey Map (Public → Onboarding → Dashboard Command Center)
```mermaid
flowchart LR
  A[Anonymous User] --> B[/blog]
  B --> C[CTA: Sign Up]
  C --> D[/sign-up/]
  D --> E[/onboarding/]
  E --> F[/dashboard/]

  subgraph DASH[Dashboard Command Center]
    F --> N[Neptune Side Panel<br/>Chat/History/Activity]
    F --> R[Setup Roadmap + Next Best Action]
    F --> S[Workspace State<br/>metrics/tasks/recent activity]
  end

  N -->|tool runs + approvals| OR[Agents/Orchestration]
  OR --> F

  NOTE[/Optional alias: /launchpad → /blog redirect/]
```

---

## 3) Neptune Architecture (UI + Context + APIs + Persistence)
```mermaid
flowchart TB
  subgraph UI[Frontend UI]
    NP[NeptuneProvider<br/>src/contexts/neptune-context.tsx]
    PANEL[NeptuneAssistPanel<br/>src/components/conversations/NeptuneAssistPanel.tsx]
    QA[DynamicQuickActions<br/>src/components/neptune/DynamicQuickActions.tsx]
    PC[Page Context System<br/>src/lib/neptune/page-context.ts]
  end

  NP --> PANEL
  PANEL --> QA
  NP --> PC

  subgraph API[Backend APIs]
    CHAT[/api/assistant/chat (SSE)/]
    HIST[/api/assistant/conversations* /]
    UP[/api/assistant/upload/]
    FB[/api/assistant/feedback/]
    VOICE[/api/assistant/voice/* (referenced)/]
    NCONV[/api/neptune/conversation (dup)/]
  end

  PANEL --> CHAT
  PANEL --> UP
  PANEL --> FB
  PANEL --> VOICE
  NP --> HIST
  NP --> NCONV

  subgraph DB[DB Tables]
    AIC[aiConversations]
    AIM[aiMessages]
    HQC[neptuneConversations (HQ)]
  end

  CHAT --> AIC
  CHAT --> AIM
  NCONV --> AIC
  NCONV --> AIM

  subgraph TOOLING[Tools + Autonomy]
    TOOLS[src/lib/ai/tools/*]
    AUTO[src/lib/ai/autonomy-learning + orchestration autonomy]
  end

  CHAT --> TOOLS
  CHAT --> AUTO

  NOTE[Risk: Multiple UI surfaces exist<br/>/assistant + Floating assistant duplicate logic]
```

---

## 4) Agents + Orchestration Architecture
```mermaid
flowchart TB
  subgraph UI[Frontend UI]
    MYA[/activity (My Agents)/]
    ORCHUI[/orchestration (Advanced)/]
    TABS[MyAgentsDashboard tabs<br/>teams/workflows/etc]
  end

  MYA --> TABS
  ORCHUI -->|teams/workflows/approvals| TABS

  subgraph API[Backend APIs]
    AG[/api/agents + /api/activity/]
    OT[/api/orchestration/teams*/]
    OW[/api/orchestration/workflows*/]
    OA[/api/orchestration/approvals*/]
    OM[/api/orchestration/memory/]
    OMSG[/api/orchestration/messages/]
    OAUD[/api/orchestration/audit + metrics/]
  end

  MYA --> AG
  TABS --> OT
  TABS --> OW
  ORCHUI --> OA

  subgraph DOMAIN[Domain Layer]
    ORCH[AgentOrchestrator]
    WE[WorkflowEngine]
    TE[TeamExecutor]
    AS[AutonomyService]
  end

  OT --> ORCH
  OW --> WE
  OT --> TE
  OA --> AS

  subgraph JOBS[Background Jobs]
    TR1[Trigger: team-executor]
    TR2[Trigger: workflow-executor-orchestration]
  end

  ORCH --> TR1
  WE --> TR2

  subgraph DB[DB Tables]
    AGT[agents]
    TEAMS[agentTeams + agentTeamMembers]
    WF[agentWorkflows + executions + versions]
    APPR[agentPendingActions + auditLog]
    MEM[agentSharedMemory]
    MSG[agentMessages]
  end

  API --> DB
```

---

## 5) Blog + Content Engine Architecture
```mermaid
flowchart TB
  subgraph PUBLIC[Public Blog UI]
    BLOG[/blog/* routes/]
    BLAYOUT[Blog Layout + Search UI]
  end

  subgraph ADMIN[Admin Authoring]
    MC[/Mission Control: admin posts/]
    STUDIO[Article Studio UI]
    HIT[Topic Ideas / Hit List]
    CHECK[Pre-Publish Checklist]
  end

  subgraph API[APIs]
    BP[/api/blog/posts (public list)/]
    BE[/api/blog/engagement (auth)/]
    AP[/api/admin/posts (admin)/]
    AT[/api/admin/topics (admin)/]
    SEARCH[/api/search (used by blog layout)/]
    NEWS[/api/newsletter/subscribe (used by blog layout)/]
  end

  subgraph JOBS[Content Jobs]
    DISC[Trigger: content-source-discovery (weekly)]
  end

  subgraph DB[DB Tables]
    POSTS[blogPosts + blogCategories]
    ENG[blogReadingProgress + blogBookmarks + blogReactions]
    TOP[topicIdeas]
    SRC[contentSources]
  end

  BLOG --> BP
  BLOG --> SEARCH
  BLOG --> NEWS
  BLOG --> BE

  MC --> AP
  STUDIO --> AT
  STUDIO --> AP
  CHECK --> AP

  DISC --> SRC
  DISC --> TOP

  API --> DB

  NOTE[Critical: middleware must allow /blog and required public APIs]
```

---

## 6) Auth + Workspace Identity Map (Clerk Org → Workspace)
```mermaid
flowchart TB
  C[Clerk auth()] -->|userId| U[DB users table]
  C -->|orgId (optional)| ORG[Clerk Organization]

  subgraph WS[getCurrentWorkspace()]
    MAP[If orgId: workspace slug = org-{orgId}]
    WDB[Find/Create workspace in DB]
    MEM[Ensure workspaceMembers record exists]
  end

  ORG --> MAP
  MAP --> WDB
  U --> MEM
  WDB --> MEM

  MEM --> WID[workspaceId (UUID)]

  NOTE[Rule: all data access must be filtered by workspaceId consistently]
```

---

## 7) Navigation / IA (Proposed: conversion-first + progressive disclosure)
```mermaid
flowchart TB
  subgraph PUBLIC[Public]
    HOME[/]
    PRICING[/pricing]
    FEATURES[/features]
    BLOG[/blog]
  end

  subgraph APP[App (Protected)]
    DASH[/dashboard (command center)]
    ONB[/onboarding]
    CORE[Core Modules]
    ADV[Advanced Modules (progressive)]
  end

  DASH --> CORE
  DASH --> NEP[Neptune Panel (persistent)]

  subgraph CORE[Core Modules (Day 0-7)]
    CREATOR[/creator]
    CRM[/crm]
    LIB[/library]
    AGENTS[/activity (My Agents)]
  end

  subgraph ADV[Advanced Modules (after milestones)]
    ORCH[/orchestration]
    FIN[/finance]
    MKT[/marketing]
    HQ[/neptune-hq]
  end

  BLOG -->|CTA| ONB
  ONB --> DASH
```

---

## 8) Neptune Surface Consolidation (Today → Target)
```mermaid
flowchart LR
  subgraph TODAY[Today]
    D1[Dashboard uses NeptuneAssistPanel]
    A1[/assistant page (duplicate streaming logic)]
    F1[FloatingAIAssistant (local state + JSON expectation)]
  end

  subgraph TARGET[Target]
    SINGLE[One Neptune system:
NeptuneProvider + NeptuneAssistPanel
used everywhere]
    MODES[Modes:
Side Panel (default)
Fullscreen (focus)
History/Activity tabs]
  end

  TODAY --> TARGET
  SINGLE --> MODES
```
