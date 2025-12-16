"use client";

import { useState, useEffect } from "react";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, 
  Code2, 
  Shield, 
  Bot,
  Search,
  BookOpen,
  Rocket,
  Zap,
  Key,
  Database,
  Webhook,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Menu,
  X,
  Sparkles
} from "lucide-react";

type UserType = "end-users" | "developers" | "admins" | "ai-agents";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lastUpdated: string;
  status?: "stable" | "beta" | "new";
  topics?: string[];
  details?: string;
}

const userTypeConfig: Record<UserType, { label: string; icon: React.ElementType; description: string }> = {
  "end-users": { 
    label: "End Users", 
    icon: User, 
    description: "Guides for everyday platform usage" 
  },
  "developers": { 
    label: "Developers", 
    icon: Code2, 
    description: "API docs, SDKs, and integrations" 
  },
  "admins": { 
    label: "Admins", 
    icon: Shield, 
    description: "Team management and security" 
  },
  "ai-agents": { 
    label: "AI Agents", 
    icon: Bot, 
    description: "Machine-readable specifications" 
  },
};

const docSections: Record<UserType, DocSection[]> = {
  "end-users": [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      description: "5-minute quickstart guide to using GalaxyCo.ai",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Welcome to GalaxyCo! Here's how to get started in under 5 minutes:\n\n**1. Create Your Account:** Sign up with email or use Google/Microsoft OAuth. You'll be prompted to create your first workspace.\n\n**2. Set Up Your Workspace:** Give your workspace a name (you can change this later). This is where all your agents, contacts, and workflows will live.\n\n**3. Explore the Dashboard:** After signup, you'll land on your dashboard where Neptune AI greets you. The sidebar on the left gives you access to all major features: CRM, Library, Marketing, and more.\n\n**4. Chat with Neptune:** Click on Neptune AI in the sidebar and ask it anything. Try: 'Show me what I can do' or 'Help me create my first contact.' Neptune understands natural language and can guide you through the platform.\n\n**5. Add Your First Contact:** Go to CRM → Leads and click 'Add Lead'. Fill in the basic info. Watch as Neptune automatically suggests next actions and scores the lead.\n\n**6. Try Quick Actions:** On the dashboard, you'll see quick action buttons like 'Help me create my first agent' and 'Upload a document'. These are shortcuts to common tasks.\n\n**Pro Tips:**\n• Use ⌘K (Mac) or Ctrl+K (Windows) to open the command palette from anywhere\n• Neptune learns from your usage - the more you interact, the smarter it gets\n• Check the 'Launchpad' section for guided tutorials\n• Invite team members from Settings → Team Management\n\nYou're now ready to start using GalaxyCo! Explore the other documentation sections to dive deeper into specific features.",
      topics: ["Account Setup", "Workspace Configuration", "First Agent", "Team Invitations", "Quick Tour"]
    },
    {
      id: "core-concepts",
      title: "Core Concepts",
      icon: BookOpen,
      description: "Understanding workflows, agents, and automation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "GalaxyCo is built around three core concepts that work together:\n\n**AI Agents:** Think of agents as specialized AI workers. Each agent has a specific job: scoring leads, drafting content, scheduling follow-ups, etc. Unlike chatbots that just answer questions, our agents take action on your behalf. When a new lead comes in, an agent can automatically research them, score their fit, and draft a personalized follow-up—all without you lifting a finger.\n\n**Workflows:** Workflows connect triggers, conditions, and actions into automated processes. For example: 'When a new contact is added (trigger) AND they're from Enterprise segment (condition), THEN assign to senior sales rep AND send welcome sequence (actions).' You can build workflows visually without code using our Creator studio, or let Neptune AI help you design them.\n\n**Neptune AI Orchestrator:** Neptune is the brain that coordinates everything. It sits above all your agents and workflows, understanding context across your entire workspace. When you ask Neptune 'What should I work on today?', it analyzes your CRM, active workflows, and pending tasks to give you prioritized recommendations. Neptune can also execute workflows, create new agents, and explain what's happening in your workspace.\n\n**How They Work Together:**\n1. You add a new lead to your CRM\n2. An AI agent automatically enriches and scores them\n3. A workflow triggers based on the score\n4. Actions execute: sending email, creating tasks, updating pipeline\n5. Neptune surfaces next steps to you\n\n**Data Models:** Everything in GalaxyCo has a consistent structure. Contacts, Deals, Documents, and Agents all have properties, relationships, and histories. This consistency means agents can work across different parts of your workspace intelligently.\n\n**Integrations:** Connect external tools (Google Calendar, QuickBooks, Shopify) to extend what agents can do. When integrated, agents can read/write data to these tools as part of workflows.",
      topics: ["AI Agents", "Workflows", "Triggers & Actions", "Data Models", "Integrations"]
    },
    {
      id: "neptune-ai",
      title: "Neptune AI Assistant",
      icon: Bot,
      description: "How to interact with and train your AI assistant",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Neptune is your AI business assistant that understands your workspace and takes action on your behalf.\n\n**What Neptune Can Do:**\n• Answer questions about your data ('How many hot leads do I have?')\n• Execute tasks ('Create a contact for John Smith at Acme Corp')\n• Surface insights ('Show me deals that haven't been touched in 7 days')\n• Draft content ('Write a follow-up email for this lead')\n• Explain decisions ('Why did you score this lead as Hot?')\n• Suggest next actions ('What should I prioritize today?')\n\n**How to Use Neptune:**\n\n**Natural Language:** Just type or speak naturally. Neptune understands context. Instead of clicking through menus, ask: 'Add a follow-up task for next Tuesday' or 'Show me my pipeline.'\n\n**Tool Execution:** Neptune has access to tools across your workspace. When you ask it to create a contact or schedule a workflow, it actually executes those actions. You'll see confirmations of what it did.\n\n**Context Awareness:** Neptune remembers your conversation history and understands your workspace data. If you say 'Send them a follow-up,' it knows who 'them' refers to based on your conversation.\n\n**Training Neptune:**\n\n**Upload Documents:** In Library → Knowledge Base, upload your company docs, playbooks, or FAQs. Neptune will learn from these and use them to answer questions specific to your business.\n\n**Provide Feedback:** Use the thumbs up/down on Neptune's responses. This teaches it what good answers look like for your use case.\n\n**Set Context:** Tell Neptune about your business: 'We're a B2B SaaS company selling to mid-market HR teams.' It will use this context in all future interactions.\n\n**Pro Tips:**\n• Neptune works best with specific questions\n• You can always undo or modify what Neptune does\n• Use the 'Explain' button to understand Neptune's reasoning\n• Neptune can be accessed from anywhere with the command palette (⌘K)",
      topics: ["Chat Interface", "Training Neptune", "Custom Instructions", "Knowledge Sources", "Response Tuning"]
    },
    {
      id: "workflows",
      title: "Building Workflows",
      icon: Zap,
      description: "Create and manage automated workflows",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Workflows automate repetitive tasks so you can focus on high-value work.\n\n**Anatomy of a Workflow:**\n\n**Trigger:** What starts the workflow. Examples: new contact added, deal stage changed, time-based (every Monday at 9am), webhook received.\n\n**Conditions:** Rules that determine if the workflow continues. Example: 'IF lead score > 80 AND industry = SaaS'\n\n**Actions:** What happens when conditions are met. Examples: send email, create task, update CRM field, call external API, run AI agent.\n\n**Building Your First Workflow:**\n\n1. Go to Orchestration → Workflows → New Workflow\n2. Choose a trigger (start simple with 'New Contact Created')\n3. Add a condition (optional but recommended)\n4. Add actions - drag and drop from the right panel\n5. Configure each action's settings\n6. Test with sample data\n7. Activate when ready\n\n**Common Workflow Examples:**\n\n**Lead Routing:** When new lead created → IF score > 70 → Assign to senior rep, ELSE assign to junior rep → Send Slack notification\n\n**Follow-Up Automation:** When deal sits in stage for 7 days → Create follow-up task → Send reminder email → Alert manager\n\n**Content Approval:** When document uploaded → Request approval from manager → IF approved → Publish to knowledge base, ELSE notify author\n\n**Best Practices:**\n• Start with one workflow at a time\n• Test thoroughly before activating\n• Use clear naming conventions\n• Add error handling (what if API call fails?)\n• Monitor workflow execution logs\n• Don't over-automate - keep human oversight where needed\n\n**Templates:** We provide pre-built templates for common workflows. Browse templates in the workflow builder to get started faster.\n\n**Testing:** Always test workflows with sample data before activating. Use the 'Test Run' button to simulate execution without actually making changes.",
      topics: ["Visual Builder", "Triggers", "Actions", "Conditions", "Templates", "Testing"]
    },
    {
      id: "crm-basics",
      title: "CRM Essentials",
      icon: Users,
      description: "Managing contacts, deals, and pipelines",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Our CRM is built to work with AI, not against it. Here's what you need to know:\n\n**Contacts & Leads:**\n\n**Adding Contacts:** Click 'Add Lead' and fill in basic info (name, email, company). Neptune AI automatically enriches the contact with additional data like company size, industry, and social profiles.\n\n**Import:** Bulk import from CSV or integrate with your existing tools. Go to CRM → Import to upload a file.\n\n**Organization:** Contacts can be tagged, segmented, and organized into lists. Use filters to create views like 'Enterprise Leads' or 'Customers in California.'\n\n**Deals & Pipeline:**\n\n**Creating Deals:** Every serious opportunity should be a deal. Add a deal from any contact record. Set the value, expected close date, and stage.\n\n**Pipeline Stages:** Default stages are: New → Qualified → Demo → Proposal → Negotiation → Closed Won/Lost. Customize these in CRM Settings.\n\n**Moving Deals:** Drag and drop deals between stages in the Kanban view. AI tracks how long deals sit in each stage and alerts you to stalled opportunities.\n\n**AI Scoring:**\n\nEvery lead gets an AI-generated score (Cold, Warm, Hot) based on:  \n• Company fit (size, industry, location)\n• Engagement signals (email opens, site visits, responses)\n• Historical patterns (similar deals that closed)\n• Timing indicators (budget cycle, hiring activity)\n\nYou can adjust the scoring model in CRM Settings → Lead Scoring to match your criteria.\n\n**Activities & Notes:**\n\nTrack all interactions: calls, emails, meetings, notes. Add an activity from any contact/deal page. AI can auto-transcribe calls and extract action items.\n\n**Next Actions:** Neptune suggests what to do next for each deal: 'Send follow-up', 'Schedule demo', 'Request decision maker intro.' These show up in your daily priorities.\n\n**Reporting:**\n\nBuilt-in reports show: pipeline health, conversion rates by stage, average deal size, sales velocity, lead source performance. Access from CRM → Insights.",
      topics: ["Contacts", "Deals & Pipelines", "Activities", "AI Scoring", "Reporting"]
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: CheckCircle2,
      description: "Tips and patterns for power users",
      lastUpdated: "2025-12-08",
      status: "stable",
      details: "**Data Hygiene:**\n• Keep contact data clean - merge duplicates weekly\n• Use consistent naming conventions for deals and companies\n• Archive old data rather than deleting (you might need it later)\n• Tag contacts liberally - tags make segmentation easier\n• Set up data validation rules to prevent junk data\n\n**Workflow Design:**\n• Start simple - one trigger, one action\n• Add complexity gradually as you learn what works\n• Always include error handling\n• Use clear, descriptive names for workflows\n• Document why workflows exist (future you will thank current you)\n• Review and prune unused workflows quarterly\n\n**Agent Training:**\n• Upload your best docs to the knowledge base first\n• Provide feedback on agent actions (thumbs up/down)\n• Be specific when correcting agents\n• Give agents time to learn - they get better with usage\n• Set clear boundaries (what agents CAN'T do)\n\n**Team Collaboration:**\n• Define roles clearly - who owns what\n• Use @ mentions in notes to notify team members\n• Set up team views in CRM for transparency\n• Have a single source of truth for important data\n• Regular team syncs on what's working/not working\n\n**Performance Tips:**\n• Use keyboard shortcuts (⌘K opens command palette)\n• Set up saved views for frequent filters\n• Batch similar tasks (all follow-ups at once)\n• Let AI handle repetitive work, you focus on decisions\n• Review your daily priorities from Neptune every morning\n\n**Security:**\n• Never share API keys publicly\n• Use role-based permissions for team members\n• Enable 2FA for all users\n• Review audit logs monthly\n• Set up IP allowlists for sensitive workspaces\n\n**Getting Unstuck:**\n• Ask Neptune for help first\n• Check the Troubleshooting docs\n• Use the feedback widget to report issues\n• Email support@galaxyco.ai - we respond within 24 hours",
      topics: ["Workflow Patterns", "Agent Training", "Team Collaboration", "Data Hygiene", "Performance Tips"]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: HelpCircle,
      description: "Common issues and solutions",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "**Common Issues:**\n\n**Q: Neptune isn't responding to my questions**\nA: Check your internet connection. Refresh the page. If it persists, try: Settings → Clear Cache. Neptune requires an active connection to our AI service.\n\n**Q: I can't see contacts I just imported**\nA: Imports process in background. Check CRM → Import History for status. Large imports (500+ contacts) can take 2-3 minutes. Refresh the page after the import completes.\n\n**Q: Workflows aren't triggering**\nA: Check three things: 1) Is the workflow active? (green toggle), 2) Do the trigger conditions match? (test with sample data), 3) Check workflow logs for errors (Orchestration → Logs).\n\n**Q: Lead scores seem wrong**\nA: Scoring improves as Neptune learns your patterns. Provide feedback on scores (thumbs up/down). Adjust scoring criteria in CRM Settings → Lead Scoring. New workspaces need ~50 contacts before scores stabilize.\n\n**Q: Can't upload documents to knowledge base**\nA: Supported formats: PDF, DOC, DOCX, TXT, MD. Max file size: 25MB. Check that file isn't password-protected. Clear browser cache if upload hangs.\n\n**Q: Integration isn't syncing**\nA: Go to Settings → Integrations → [Your Integration] → Test Connection. If it fails, you may need to re-authorize. Some integrations have rate limits - check status.\n\n**Q: Slow performance**\nA: Clear browser cache. Try a different browser (Chrome recommended). Check your internet speed. If workspace is >10,000 contacts, performance may vary - contact support for optimization.\n\n**Q: Lost data or made a mistake**\nA: Most actions can be undone immediately. For data recovery, contact support@galaxyco.ai with details. We keep backups for 30 days.\n\n**Q: How do I delete my account?**\nA: Settings → Account → Delete Account. This is permanent and deletes all data. Export your data first if you want to keep it.\n\n**Still Stuck?**\nEmail support@galaxyco.ai with: 1) What you were trying to do, 2) What happened instead, 3) Screenshots if possible, 4) Your browser/OS. We respond within 24 hours.",
      topics: ["Common Errors", "Connection Issues", "Sync Problems", "Performance", "FAQ"]
    }
  ],
  "developers": [
    {
      id: "api-overview",
      title: "API Overview",
      icon: Code2,
      description: "REST API architecture and capabilities",
      lastUpdated: "2025-12-14",
      status: "new",
      details: "GalaxyCo.ai provides a comprehensive REST API for building integrations, automating workflows, and extending platform capabilities.\n\n**Base URL:**\n```\nhttps://api.galaxyco.ai/v1\n```\n\n**Architecture Principles:**\n\n**RESTful Design:** Standard HTTP methods (GET, POST, PUT, PATCH, DELETE). Predictable resource URLs like `/contacts/{id}` or `/workflows/{id}/execute`.\n\n**JSON Everywhere:** All requests accept JSON payloads. All responses return JSON. Content-Type: application/json is required.\n\n**Idempotency:** PUT and DELETE operations are idempotent. POST operations return idempotency keys to prevent duplicate actions.\n\n**Versioning:**\n\nAPI version is specified in the URL path (`/v1/`, `/v2/`, etc.). Current version: v1. We maintain backward compatibility for at least 12 months after a new version is released.\n\n**Response Format:**\n\nSuccess responses (200-299) return the requested resource or confirmation:\n```json\n{\"data\": {...}, \"meta\": {\"timestamp\": \"2025-12-14T10:00:00Z\"}}\n```\n\nError responses (400-599) include error details:\n```json\n{\"error\": {\"code\": \"invalid_request\", \"message\": \"Missing required field: email\"}}\n```\n\n**Pagination:**\n\nList endpoints support cursor-based pagination:\n- `?limit=50` - Number of results (max 100, default 25)\n- `?cursor=abc123` - Pagination cursor from previous response\n\nResponses include pagination metadata with `next_cursor`.\n\n**Common Capabilities:**\n\n- Full CRUD on Contacts, Deals, Workflows, Documents\n- Execute workflows programmatically\n- Query Neptune AI assistant\n- Subscribe to webhooks for real-time events\n- Upload/download files\n- Manage team members and permissions\n\n**Getting Started:** Generate an API key in Settings → Developers → API Keys. Include it in all requests via `Authorization: Bearer YOUR_KEY` header.",
      topics: ["REST Architecture", "Base URLs", "Versioning", "Response Formats", "Pagination"]
    },
    {
      id: "authentication",
      title: "Authentication",
      icon: Key,
      description: "API keys, OAuth, and security",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "GalaxyCo.ai supports two authentication methods: API Keys for server-to-server integrations and OAuth 2.0 for user-authorized applications.\n\n**API Keys (Recommended for Server-to-Server):**\n\n**Generating Keys:** Go to Settings → Developers → API Keys → Create Key. Name your key (e.g., 'Production Server') and select scopes.\n\n**Using Keys:** Include in Authorization header:\n```\nAuthorization: Bearer gco_live_abc123xyz789\n```\n\n**Key Prefixes:**\n- `gco_live_` - Production keys\n- `gco_test_` - Test/sandbox keys\n\n**Security:** Never commit keys to version control. Rotate keys every 90 days. Delete unused keys immediately.\n\n**OAuth 2.0 (For User-Authorized Apps):**\n\n**Flow:** Standard Authorization Code flow with PKCE for security.\n\n**Setup:**\n1. Register your app in Settings → Developers → OAuth Apps\n2. Get client_id and client_secret\n3. Set redirect_uri (must be HTTPS in production)\n\n**Authorization URL:**\n```\nhttps://app.galaxyco.ai/oauth/authorize?\n  client_id=YOUR_CLIENT_ID\n  &redirect_uri=YOUR_REDIRECT\n  &response_type=code\n  &scope=contacts:read contacts:write\n```\n\n**Token Exchange:** After user approves, exchange auth code for access token:\n```\nPOST https://api.galaxyco.ai/v1/oauth/token\n{\"code\": \"AUTH_CODE\", \"client_id\": \"...\", \"client_secret\": \"...\"}\n```\n\n**Access Tokens:** Valid for 1 hour. Use refresh tokens to get new access tokens without re-prompting users.\n\n**Scopes:**\n- `contacts:read` - Read contacts/deals\n- `contacts:write` - Create/update contacts\n- `workflows:read` - View workflows\n- `workflows:execute` - Run workflows\n- `knowledge:read` - Access knowledge base\n- `admin:all` - Full admin access (use sparingly)\n\n**Best Practices:**\n- Request minimum scopes needed\n- Store tokens encrypted\n- Implement token refresh logic\n- Handle 401 errors by refreshing token",
      topics: ["API Keys", "OAuth 2.0", "Scopes", "Token Management", "Security"]
    },
    {
      id: "api-reference",
      title: "API Reference",
      icon: Database,
      description: "Complete endpoint documentation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Comprehensive API endpoint documentation organized by resource type.\n\n**Contacts API:**\n```\nGET    /v1/contacts          List contacts\nPOST   /v1/contacts          Create contact\nGET    /v1/contacts/{id}     Get contact\nPATCH  /v1/contacts/{id}     Update contact\nDELETE /v1/contacts/{id}     Delete contact\nGET    /v1/contacts/{id}/activities  Get activity history\n```\n\n**Example - Create Contact:**\n```json\nPOST /v1/contacts\n{\n  \"email\": \"john@acme.com\",\n  \"first_name\": \"John\",\n  \"last_name\": \"Smith\",\n  \"company\": \"Acme Corp\",\n  \"tags\": [\"enterprise\", \"hot-lead\"]\n}\n```\n\n**Workflows API:**\n```\nGET    /v1/workflows                List workflows\nPOST   /v1/workflows                Create workflow\nGET    /v1/workflows/{id}           Get workflow details\nPATCH  /v1/workflows/{id}           Update workflow\nDELETE /v1/workflows/{id}           Delete workflow\nPOST   /v1/workflows/{id}/execute   Trigger workflow\nGET    /v1/workflows/{id}/runs      Get execution history\n```\n\n**Neptune AI API:**\n```\nPOST   /v1/neptune/chat       Send message to Neptune\nGET    /v1/neptune/context    Get workspace context\nPOST   /v1/neptune/execute    Execute Neptune command\n```\n\n**Knowledge Base API:**\n```\nGET    /v1/knowledge/documents       List documents\nPOST   /v1/knowledge/documents       Upload document\nGET    /v1/knowledge/documents/{id}  Get document\nDELETE /v1/knowledge/documents/{id}  Delete document\nPOST   /v1/knowledge/search          Search knowledge base\n```\n\n**Webhooks API:**\n```\nGET    /v1/webhooks          List webhooks\nPOST   /v1/webhooks          Create webhook\nDELETE /v1/webhooks/{id}     Delete webhook\n```\n\n**Query Parameters:**\nMost list endpoints support filtering:\n- `?filter[status]=active` - Filter by field\n- `?sort=-created_at` - Sort (prefix with - for descending)\n- `?fields=id,name,email` - Return only specific fields\n\n**Full interactive API reference with live examples:** https://api.galaxyco.ai/docs",
      topics: ["Contacts API", "Workflows API", "Agents API", "Knowledge API", "Webhooks API"]
    },
    {
      id: "webhooks",
      title: "Webhooks & Events",
      icon: Webhook,
      description: "Real-time event notifications",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Webhooks deliver real-time event notifications to your server when things happen in GalaxyCo.ai.\n\n**Setting Up Webhooks:**\n\n1. Go to Settings → Developers → Webhooks\n2. Click Create Webhook\n3. Enter your endpoint URL (must be HTTPS)\n4. Select events to subscribe to\n5. Save and note the signing secret\n\n**Event Types:**\n\n**CRM Events:**\n- `contact.created` - New contact added\n- `contact.updated` - Contact modified\n- `contact.deleted` - Contact removed\n- `deal.stage_changed` - Deal moved to new stage\n- `deal.closed_won` - Deal marked as won\n\n**Workflow Events:**\n- `workflow.started` - Workflow execution began\n- `workflow.completed` - Workflow finished successfully\n- `workflow.failed` - Workflow encountered error\n\n**System Events:**\n- `user.invited` - Team member invited\n- `integration.connected` - New integration added\n\n**Webhook Payload Format:**\n```json\n{\n  \"event\": \"contact.created\",\n  \"timestamp\": \"2025-12-14T10:00:00Z\",\n  \"data\": {\n    \"id\": \"cnt_123\",\n    \"email\": \"john@acme.com\",\n    // ... full contact object\n  },\n  \"workspace_id\": \"ws_abc\"\n}\n```\n\n**Signature Verification:**\n\nEvery webhook includes `X-GalaxyCo-Signature` header. Verify it to ensure the request came from us:\n\n```javascript\nconst crypto = require('crypto');\nconst signature = request.headers['x-galaxyco-signature'];\nconst payload = JSON.stringify(request.body);\nconst expected = crypto\n  .createHmac('sha256', SIGNING_SECRET)\n  .update(payload)\n  .digest('hex');\nif (signature !== expected) throw new Error('Invalid signature');\n```\n\n**Retry Logic:**\nIf your endpoint returns non-2xx status or times out (>10s), we retry with exponential backoff: 1min, 5min, 30min, 2hr, 12hr. After 5 failures, webhook is disabled.\n\n**Best Practices:**\n- Return 200 immediately, process async\n- Implement idempotency (use event ID)\n- Store signing secret securely\n- Log all webhook receipts for debugging",
      topics: ["Event Types", "Webhook Setup", "Signature Verification", "Retry Logic", "Debugging"]
    },
    {
      id: "rate-limits",
      title: "Rate Limits",
      icon: BarChart3,
      description: "API quotas and best practices",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "API rate limits prevent abuse and ensure reliable service for all users.\n\n**Limits by Plan:**\n\n**Starter:** 1,000 requests/hour\n**Professional:** 5,000 requests/hour\n**Enterprise:** 20,000 requests/hour (customizable)\n\n**Limits by Endpoint Type:**\n\n**Read Operations (GET):** Standard rate limit\n**Write Operations (POST/PUT/PATCH):** 50% of standard limit\n**Delete Operations:** 25% of standard limit\n**Bulk Operations:** 10% of standard limit, max 100 items per request\n\n**Rate Limit Headers:**\n\nEvery API response includes rate limit info:\n```\nX-RateLimit-Limit: 5000\nX-RateLimit-Remaining: 4850\nX-RateLimit-Reset: 1702558800\n```\n\n**When You Hit the Limit:**\n\nYou'll receive a 429 Too Many Requests response:\n```json\n{\n  \"error\": {\n    \"code\": \"rate_limit_exceeded\",\n    \"message\": \"Rate limit exceeded. Retry after 120 seconds.\",\n    \"retry_after\": 120\n  }\n}\n```\n\n**Retry-After** header tells you when to retry.\n\n**Optimization Strategies:**\n\n**1. Use Bulk Endpoints:** Instead of creating 100 contacts individually, use bulk create endpoint:\n```\nPOST /v1/contacts/bulk\n{\"contacts\": [...]}\n```\n\n**2. Cache Responses:** Cache data that doesn't change frequently (team members, workflow definitions).\n\n**3. Use Webhooks:** Instead of polling for changes, subscribe to webhooks for real-time updates.\n\n**4. Implement Exponential Backoff:** When you hit a rate limit, wait progressively longer between retries: 1s, 2s, 4s, 8s, etc.\n\n**5. Batch Requests:** Group related operations together during off-peak hours.\n\n**6. Monitor Usage:** Track your rate limit headers to predict when you'll hit limits.\n\n**Need Higher Limits?** Enterprise plans support custom rate limits. Contact sales@galaxyco.ai to discuss your requirements.",
      topics: ["Limits by Endpoint", "Headers", "Retry Strategies", "Bulk Operations", "Optimization"]
    },
    {
      id: "sdks",
      title: "SDKs & Libraries",
      icon: Code2,
      description: "Official client libraries",
      lastUpdated: "2025-12-05",
      status: "beta",
      details: "Official SDKs make integrating with GalaxyCo.ai faster and easier. We handle authentication, retries, and error handling.\n\n**JavaScript/TypeScript SDK:**\n\n**Installation:**\n```bash\nnpm install @galaxyco/sdk\n```\n\n**Quick Start:**\n```typescript\nimport { GalaxyCo } from '@galaxyco/sdk';\n\nconst client = new GalaxyCo({\n  apiKey: process.env.GALAXYCO_API_KEY\n});\n\n// Create a contact\nconst contact = await client.contacts.create({\n  email: 'john@acme.com',\n  firstName: 'John',\n  lastName: 'Smith'\n});\n\n// Execute a workflow\nawait client.workflows.execute('wf_123', {\n  input: { leadId: contact.id }\n});\n```\n\n**Python SDK:**\n\n**Installation:**\n```bash\npip install galaxyco\n```\n\n**Quick Start:**\n```python\nfrom galaxyco import GalaxyCo\n\nclient = GalaxyCo(api_key=os.environ['GALAXYCO_API_KEY'])\n\n# Create a contact\ncontact = client.contacts.create(\n  email='john@acme.com',\n  first_name='John',\n  last_name='Smith'\n)\n\n# List workflows\nworkflows = client.workflows.list(status='active')\n```\n\n**Features:**\n- Automatic retry with exponential backoff\n- Built-in rate limit handling\n- Type-safe (TypeScript) / Type-hinted (Python)\n- Async/await support\n- Pagination helpers\n- Webhook signature verification\n- Comprehensive error types\n\n**Other Languages:**\n\n**Ruby:** `gem install galaxyco` (community-maintained)\n**Go:** `go get github.com/galaxyco/go-sdk` (coming soon)\n**.NET:** NuGet package in development\n\n**SDK Documentation:**\nFull SDK docs with examples: https://docs.galaxyco.ai/sdks\n\n**Contributing:** SDKs are open source! Contributions welcome at github.com/galaxyco",
      topics: ["JavaScript SDK", "Python SDK", "Installation", "Quick Start", "Examples"]
    },
    {
      id: "errors",
      title: "Error Handling",
      icon: AlertCircle,
      description: "Error codes and debugging",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Understand API errors and implement robust error handling.\n\n**Error Response Format:**\n```json\n{\n  \"error\": {\n    \"code\": \"invalid_request\",\n    \"message\": \"Missing required field: email\",\n    \"field\": \"email\",\n    \"request_id\": \"req_abc123\"\n  }\n}\n```\n\n**HTTP Status Codes:**\n\n**400 Bad Request:** Invalid request parameters. Check the error message for details.\n\n**401 Unauthorized:** Invalid or missing API key. Verify your Authorization header.\n\n**403 Forbidden:** Valid credentials but insufficient permissions. Check your API key scopes.\n\n**404 Not Found:** Resource doesn't exist. Verify the ID is correct.\n\n**409 Conflict:** Resource already exists or state conflict. Check if the resource was already created.\n\n**422 Unprocessable Entity:** Request is valid but business logic prevents action (e.g., can't delete contact with active deals).\n\n**429 Too Many Requests:** Rate limit exceeded. Check Retry-After header.\n\n**500 Internal Server Error:** Something went wrong on our end. Include request_id when contacting support.\n\n**503 Service Unavailable:** Temporary downtime, usually during maintenance. Retry with exponential backoff.\n\n**Common Error Codes:**\n\n**invalid_request:** Malformed request. Fix the syntax.\n\n**missing_field:** Required field not provided.\n\n**invalid_field:** Field value doesn't meet validation rules.\n\n**not_found:** Resource ID doesn't exist.\n\n**duplicate:** Resource already exists (e.g., contact with same email).\n\n**rate_limit_exceeded:** Too many requests.\n\n**invalid_credentials:** API key is invalid or expired.\n\n**insufficient_permissions:** Your API key lacks required scopes.\n\n**Error Handling Best Practices:**\n\n```typescript\ntry {\n  const contact = await client.contacts.create(data);\n} catch (error) {\n  if (error.code === 'duplicate') {\n    // Handle duplicate - maybe update instead?\n  } else if (error.status === 429) {\n    // Rate limited - wait and retry\n    await sleep(error.retryAfter * 1000);\n    return retry();\n  } else {\n    // Log error with request_id for support\n    logger.error('API error', { requestId: error.requestId });\n    throw error;\n  }\n}\n```\n\n**Debugging:** Every response includes `X-Request-ID` header. Include this when contacting support.",
      topics: ["Error Codes", "HTTP Status", "Error Objects", "Debugging Tips", "Common Errors"]
    },
    {
      id: "changelog",
      title: "Changelog",
      icon: Clock,
      description: "API version history",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Stay informed about API changes and plan your integration updates.\n\n**Current Version: v1**\n\n**2025-12-14 - v1.3.0 (Latest)**\n- Added Neptune AI chat endpoint (`POST /v1/neptune/chat`)\n- New bulk contact update endpoint\n- Improved rate limit headers with reset timestamp\n- Fixed: Workflow execution webhook payload format\n\n**2025-12-01 - v1.2.0**\n- Added knowledge base API endpoints\n- New webhook events for deal stage changes\n- OAuth 2.0 with PKCE support\n- Enhanced error responses with field-level details\n\n**2025-11-15 - v1.1.0**\n- Webhook signature verification (all webhooks now signed)\n- Pagination cursor improvements\n- Added `fields` query parameter for selective response fields\n- Beta: Bulk operations API\n\n**2025-11-01 - v1.0.0 (Initial Release)**\n- Core REST API launched\n- Contacts, Deals, Workflows, Webhooks APIs\n- API key authentication\n\n**Deprecations:**\n\n**2025-12-01:** `POST /v1/contacts/import` is deprecated in favor of `POST /v1/contacts/bulk`. Old endpoint will be removed in v2 (no earlier than 2026-12-01).\n\n**Migration Guide:** Replace import calls with bulk create. The payload format is identical.\n\n**Breaking Changes (v2 Preview):**\n\nv2 is planned for Q2 2026. Expected changes:\n- Cursor-based pagination required for all list endpoints (no more offset-based)\n- Webhook payload structure changes\n- Some field names standardized (e.g., `created_at` → `createdAt`)\n\nWe'll provide 12 months notice before v2 launch.\n\n**Subscribe to Updates:**\n\nGet notified of API changes: developers@galaxyco.ai\n\nOr watch our changelog: https://api.galaxyco.ai/changelog\n\n**Roadmap (Next 6 Months):**\n- GraphQL API (Q1 2026)\n- Advanced filtering & search\n- Real-time subscriptions via WebSockets\n- File upload API improvements\n- Expanded bulk operations",
      topics: ["Latest Changes", "Breaking Changes", "Deprecations", "Migration Guides", "Roadmap"]
    }
  ],
  "admins": [
    {
      id: "team-management",
      title: "Team Management",
      icon: Users,
      description: "Add, remove, and manage team members",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Manage your team effectively with comprehensive controls for adding, organizing, and managing members.\n\n**Inviting Team Members:**\n\nGo to Settings → Team → Invite Member. Enter email addresses (one per line for bulk invites). Select their role (Admin, Member, or Read-Only). They'll receive an email with a signup link valid for 7 days.\n\n**User Roles:**\n\n**Admin:** Full access including billing, team management, and workspace settings.\n**Member:** Can create/edit contacts, workflows, and documents. Cannot manage billing or invite users.\n**Read-Only:** View-only access to all data. Cannot make changes.\n\n**Organizing Teams:**\n\nCreate teams to group users by department or function (e.g., Sales, Marketing, Support). Teams can have shared access to specific contacts, deals, or workflows. Navigate to Settings → Teams → Create Team.\n\n**Managing Existing Members:**\n\n**Edit Roles:** Click on any team member → Change Role. This takes effect immediately.\n**Deactivate Users:** Instead of removing, deactivate users to preserve their data and activity history. Reactivate anytime.\n**Remove Users:** Permanently remove users from Settings → Team. Their data remains but is reassigned to workspace owner.\n\n**User Profiles:**\n\nEach user has a profile with: name, email, role, last active timestamp, and activity summary. View by clicking on any user in the team list.\n\n**Bulk Actions:**\n\nSelect multiple users to: change roles in bulk, add to teams, send announcements, or export user lists. Use checkboxes in the team list.\n\n**Seat Management:**\n\nYour plan includes a certain number of seats. Current usage shown in Settings → Team. Deactivated users don't count toward your seat limit. Need more seats? Upgrade your plan or contact us for custom pricing.\n\n**Best Practices:**\n• Use read-only access for contractors or external stakeholders\n• Create teams that mirror your org structure\n• Regular audit of active users (quarterly)\n• Use descriptive team names\n• Assign team leads who can manage their team's access",
      topics: ["Invite Users", "Remove Members", "Teams & Groups", "User Profiles", "Bulk Actions"]
    },
    {
      id: "permissions",
      title: "Permissions & Roles",
      icon: Shield,
      description: "Role-based access control",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Control exactly what team members can do with granular role-based permissions.\n\n**Built-in Roles:**\n\n**Workspace Admin:** Full control over everything including billing, team, settings, and all data.\n**Team Admin:** Manage team members and their permissions. Cannot access billing or workspace settings.\n**Member:** Standard access - create/edit contacts, deals, workflows. Cannot manage team or settings.\n**Read-Only:** View all data but cannot make changes. Perfect for stakeholders or auditors.\n\n**Permission Matrix:**\n\nPermissions are organized by resource type:\n\n**Contacts & Deals:**\n- View: See contact/deal data\n- Create: Add new contacts/deals\n- Edit: Modify existing records\n- Delete: Remove records\n- Export: Download data\n\n**Workflows & Agents:**\n- View: See workflow definitions\n- Execute: Trigger workflows\n- Edit: Modify workflow logic\n- Create: Build new workflows\n- Delete: Remove workflows\n\n**Knowledge Base:**\n- Read: Access documents\n- Upload: Add documents\n- Edit: Modify documents\n- Delete: Remove documents\n\n**Settings:**\n- View: See workspace settings\n- Edit: Modify settings\n- Billing: Manage subscriptions\n- Team: Invite/remove users\n- Integrations: Connect external tools\n\n**Custom Roles (Professional & Enterprise):**\n\nCreate custom roles tailored to your needs. Go to Settings → Roles → Create Custom Role.\n\nExample custom roles:\n• 'Sales Rep' - Full CRM access, limited workflow edit\n• 'Marketing Manager' - Workflow creation, read-only CRM\n• 'Support Agent' - Contact view/edit, no delete\n\n**Resource-Level Permissions:**\n\nFine-tune access at the resource level. Set permissions on specific workflows, contact lists, or documents. Navigate to the resource → Share → Manage Access.\n\n**Permission Inheritance:**\n\nTeam permissions inherit to all members. If a team has 'Edit' access to a workflow, all team members get that access. Individual user permissions override team permissions.",
      topics: ["Built-in Roles", "Custom Roles", "Permission Matrix", "Resource Access", "Inheritance"]
    },
    {
      id: "security",
      title: "Security Configuration",
      icon: Key,
      description: "SSO, 2FA, and security policies",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Secure your workspace with enterprise-grade security controls.\n\n**Single Sign-On (SSO):**\n\nAvailable on Enterprise plans. Supports SAML 2.0 and OAuth 2.0 providers:\n• Okta\n• Azure AD / Microsoft Entra\n• Google Workspace\n• OneLogin\n• Custom SAML providers\n\n**Setup:** Settings → Security → SSO. Follow the provider-specific guide. Test with a pilot user before enforcing for all users.\n\n**Two-Factor Authentication (2FA):**\n\nAdd extra layer of security. Supports:\n• Authenticator apps (Google Authenticator, Authy)\n• SMS codes\n• Hardware keys (YubiKey)\n\n**User 2FA:** Each user enables 2FA in their profile settings.\n**Admin Enforcement:** Settings → Security → Require 2FA. Set grace period (7, 14, or 30 days) for users to enable.\n\n**Session Management:**\n\n**Session Timeout:** Set how long users stay logged in (1 hour to 30 days). Default: 7 days.\n**Concurrent Sessions:** Limit how many devices a user can be logged in on simultaneously. Default: 5.\n**Force Logout:** Immediately log out all users (useful if credentials compromised).\n\nConfigure in Settings → Security → Sessions.\n\n**IP Allowlisting:**\n\nRestrict access to specific IP addresses or ranges. Enable in Settings → Security → IP Allowlist. Add IPs in CIDR notation (e.g., 203.0.113.0/24). Users outside allowlist are blocked.\n\n**Password Policies:**\n\nEnforce strong passwords:\n• Minimum length (8-32 characters)\n• Require uppercase, lowercase, numbers, symbols\n• Password expiration (30, 60, 90 days, or never)\n• Prevent reuse of last N passwords\n• Block common passwords\n\nSettings → Security → Password Policy.\n\n**Additional Security:**\n• Audit logs track all security events\n• Failed login alerts\n• API key rotation reminders\n• Data encryption at rest and in transit (AES-256)",
      topics: ["SSO Setup", "2FA Enforcement", "Session Management", "IP Allowlists", "Password Policies"]
    },
    {
      id: "billing",
      title: "Billing & Usage",
      icon: BarChart3,
      description: "Monitor usage and manage subscriptions",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Manage your subscription, track usage, and control costs.\n\n**Usage Dashboard:**\n\nSettings → Billing → Usage shows real-time metrics:\n• Active users / seat limit\n• API requests (current month)\n• Storage used / limit\n• Workflow executions\n• AI credits consumed\n\nUsage resets monthly on your billing date.\n\n**Subscription Plans:**\n\n**Starter:** $49/mo - 5 seats, 10K contacts, 1K workflow runs/mo\n**Professional:** $149/mo - 15 seats, 50K contacts, 10K workflow runs/mo\n**Enterprise:** Custom - Unlimited seats, contacts, and runs\n\n**Upgrade/Downgrade:** Settings → Billing → Change Plan. Upgrades take effect immediately. Downgrades at next billing cycle.\n\n**Managing Payment Methods:**\n\nAdd/update credit cards in Settings → Billing → Payment Methods. We accept Visa, Mastercard, Amex, and ACH transfers (Enterprise only). Update card before expiration to avoid service interruption.\n\n**Invoices:**\n\nAccess all invoices in Settings → Billing → Invoices. Download as PDF. Invoices include:\n• Subscription charges\n• Overage fees (if applicable)\n• Tax breakdown\n• Payment method used\n\nInvoices sent via email on billing date.\n\n**Overages:**\n\nIf you exceed plan limits:\n• **Seats:** $10 per extra seat/month (prorated)\n• **API Requests:** $5 per 1,000 additional requests\n• **Storage:** $2 per GB over limit\n• **Workflow Runs:** $0.01 per additional run\n\nOverages billed monthly. Monitor usage to avoid surprises.\n\n**Cost Optimization Tips:**\n• Deactivate unused users to free up seats\n• Archive old workflows to reduce executions\n• Use bulk API operations to reduce request count\n• Clean up unused documents to free storage\n• Review usage monthly and adjust plan accordingly\n\n**Billing Support:**\nQuestions about billing? Email billing@galaxyco.ai or chat with us in Settings → Billing → Contact Support.",
      topics: ["Usage Dashboard", "Subscription Plans", "Invoices", "Payment Methods", "Cost Optimization"]
    },
    {
      id: "audit-logs",
      title: "Audit Logs",
      icon: FileText,
      description: "Track all system activities",
      lastUpdated: "2025-12-08",
      status: "beta",
      details: "Comprehensive activity tracking for security, compliance, and debugging.\n\n**What Gets Logged:**\n\n**User Actions:**\n• Login/logout events\n• Failed login attempts\n• Password changes\n• 2FA enable/disable\n\n**Data Changes:**\n• Contact/deal created, updated, deleted\n• Workflow modified or executed\n• Document uploaded or removed\n• Settings changed\n\n**Team Actions:**\n• User invited or removed\n• Role changes\n• Permission updates\n\n**API Activity:**\n• API key created or revoked\n• API requests (with endpoints and status codes)\n• Webhook deliveries\n\n**Accessing Audit Logs:**\n\nSettings → Security → Audit Logs. Available on Professional and Enterprise plans.\n\n**Log Entry Format:**\nEach log entry includes:\n• Timestamp (UTC)\n• User who performed action\n• Action type\n• Resource affected\n• Before/after values (for updates)\n• IP address\n• User agent\n\n**Search & Filter:**\n\nFilter logs by:\n• Date range\n• User\n• Action type\n• Resource type\n• Outcome (success/failure)\n\nSearch supports text queries across all fields.\n\n**Export Logs:**\n\nExport filtered logs as CSV or JSON for external analysis. Settings → Audit Logs → Export. Useful for compliance reporting or security investigations.\n\n**Retention:**\n\n**Professional:** 90-day retention\n**Enterprise:** 1-year retention (customizable up to 7 years)\n\nOlder logs are automatically archived and can be retrieved upon request.\n\n**Common Use Cases:**\n• Compliance audits (SOC 2, GDPR, HIPAA)\n• Security investigations\n• Debugging workflow issues\n• Tracking data changes\n• User activity monitoring\n\n**Alerts:**\nSet up alerts for suspicious activity (Professional & Enterprise). Configure in Settings → Security → Alerts. Examples: multiple failed logins, bulk data exports, permission changes.",
      topics: ["Activity Logs", "User Actions", "Export Logs", "Retention", "Search & Filter"]
    },
    {
      id: "advanced-settings",
      title: "Advanced Settings",
      icon: Settings,
      description: "System configuration and customization",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Advanced configuration options for customizing your workspace.\n\n**Workspace Settings:**\n\n**General:**\n• Workspace name and icon\n• Default timezone\n• Date/time format\n• Language (English, Spanish, French, German)\n• Currency for deals\n\n**Notifications:**\n• Email digest frequency (daily, weekly, never)\n• Slack integration for alerts\n• In-app notification preferences\n• Mobile push notifications\n\n**Defaults:**\n\nSet default values for new records:\n• Contact owner (creator, round-robin, specific user)\n• Deal pipeline and stage\n• Lead source\n• Tags\n\nNavigate to Settings → Defaults.\n\n**Custom Fields:**\n\nAdd custom fields to contacts, deals, or workflows:\n1. Settings → Custom Fields → Add Field\n2. Choose field type: text, number, date, dropdown, checkbox\n3. Set if required or optional\n4. Appears on all relevant forms\n\n**Integrations:**\n\nManage connected tools in Settings → Integrations. Available integrations:\n• CRMs: Salesforce, HubSpot\n• Calendar: Google Calendar, Outlook\n• Communication: Slack, Teams\n• Accounting: QuickBooks, Xero\n• E-commerce: Shopify, Stripe\n\n**Data Retention:**\n\nControl how long data is kept:\n• Deleted items: 30 days in trash before permanent deletion\n• Completed workflows: 90 days of execution logs\n• Audit logs: 90 days (Professional), 1 year (Enterprise)\n• Archived contacts: Never deleted automatically\n\n**Feature Flags (Enterprise):**\n\nEnable/disable features for controlled rollouts:\n• Beta features preview\n• Experimental AI models\n• New UI components\n\nSettings → Advanced → Feature Flags.\n\n**API & Webhooks:**\n• Generate API keys\n• Configure webhooks\n• Set rate limits\n• View API usage\n\nSettings → Developers.",
      topics: ["Workspace Settings", "Defaults", "Integrations", "Data Retention", "Feature Flags"]
    },
    {
      id: "compliance",
      title: "Compliance",
      icon: Shield,
      description: "GDPR, SOC 2, and data protection",
      lastUpdated: "2025-12-01",
      status: "stable",
      details: "GalaxyCo.ai meets stringent compliance standards to protect your data.\n\n**Certifications:**\n\n**SOC 2 Type II:** Annual audit of security, availability, processing integrity, confidentiality, and privacy controls. Report available upon request to Enterprise customers.\n\n**GDPR Compliant:** Full compliance with EU General Data Protection Regulation. Data processing agreements available.\n\n**CCPA Compliant:** California Consumer Privacy Act requirements met for US customers.\n\n**ISO 27001** (In Progress): Expected Q2 2026.\n\n**GDPR Features:**\n\n**Data Subject Rights:**\n• Right to access: Export user data\n• Right to erasure: Permanently delete user data\n• Right to rectification: Update incorrect data\n• Right to data portability: Download data in JSON format\n\nProcess requests in Settings → Privacy → Data Subject Requests.\n\n**Consent Management:** Track and manage user consent for data processing. Cookie consent banners available.\n\n**Data Residency:**\n\nChoose where your data is stored (Enterprise only):\n• US (Virginia)\n• EU (Frankfurt)\n• UK (London)\n• Canada (Montreal)\n• Australia (Sydney)\n\nData never leaves your chosen region.\n\n**Data Export:**\n\nExport all workspace data anytime. Settings → Data → Export Workspace. Includes:\n• All contacts, deals, workflows\n• Documents and knowledge base\n• User and team data\n• Audit logs\n\nDelivered as JSON files.\n\n**Data Processing Agreement (DPA):**\n\nDPA available for all customers. Includes:\n• Data processing terms\n• Sub-processor list\n• Security measures\n• Liability terms\n\nRequest DPA: legal@galaxyco.ai\n\n**Security Measures:**\n• Encryption at rest (AES-256)\n• Encryption in transit (TLS 1.3)\n• Regular penetration testing\n• Employee background checks\n• 24/7 security monitoring\n• Incident response plan\n\n**Subprocessors:**\nFull list of subprocessors (hosting, email, etc.) available at galaxyco.ai/subprocessors.",
      topics: ["GDPR", "SOC 2", "Data Residency", "Data Export", "DPA"]
    }
  ],
  "ai-agents": [
    {
      id: "platform-overview",
      title: "Platform Overview",
      icon: Database,
      description: "Complete capabilities and constraints",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Machine-readable specifications for AI agents integrating with GalaxyCo.ai.\n\n**Platform Capabilities:**\n\n**Core Functions:**\n• CRM operations (contacts, deals, activities)\n• Workflow creation and execution\n• Knowledge base management\n• Neptune AI orchestration\n• Real-time webhook events\n• Team and permission management\n\n**Supported Operations:**\n• CRUD on all resources\n• Complex queries with filtering, sorting, pagination\n• Bulk operations (max 100 items)\n• File uploads (max 25MB)\n• Transactional workflows\n• Async job processing\n\n**Architecture:**\n\n**API Style:** RESTful with JSON payloads\n**Base URL:** https://api.galaxyco.ai/v1\n**Authentication:** Bearer token (API keys or OAuth 2.0)\n**Rate Limiting:** Token bucket algorithm, per-endpoint limits\n**Pagination:** Cursor-based, max 100 items per page\n**Webhooks:** Event-driven with signature verification\n**Idempotency:** Supported via Idempotency-Key header\n\n**Rate Limits:**\n\n**By Plan:**\n• Starter: 1K req/hr\n• Professional: 5K req/hr\n• Enterprise: 20K req/hr (customizable)\n\n**By Operation Type:**\n• GET: Full rate limit\n• POST/PUT/PATCH: 50% of rate limit\n• DELETE: 25% of rate limit\n• Bulk: 10% of rate limit\n\n**Data Access:**\n\n**Read Access:** All resources accessible via API with proper scopes\n**Write Access:** All mutations supported with validation\n**Search:** Full-text search on contacts, deals, documents\n**Filtering:** Support for complex boolean queries\n**Relationships:** Nested resource loading available\n\n**Operational Constraints:**\n\n**Hard Limits:**\n• Max payload size: 10MB\n• Max bulk operations: 100 items\n• Max webhook payload: 1MB\n• Workflow timeout: 5 minutes\n• API response timeout: 30 seconds\n\n**Soft Limits:**\n• Contacts per workspace: 1M (Enterprise)\n• Workflows per workspace: 1000\n• Concurrent workflow executions: 100\n\n**Data Types:**\n• Timestamps: ISO 8601 UTC\n• IDs: Prefixed strings (cnt_, wf_, doc_)\n• Currency: ISO 4217 codes\n• Enums: Predefined string values\n\n**Error Handling:**\n• Standard HTTP status codes\n• Structured error objects with codes\n• Request IDs for debugging",
      topics: ["Capabilities", "Architecture", "Rate Limits", "Data Access", "Constraints"]
    },
    {
      id: "data-models",
      title: "Data Models",
      icon: Database,
      description: "Entity schemas and relationships",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Comprehensive data schemas for all platform entities.\n\n**Contact Schema:**\n```json\n{\n  \"id\": \"cnt_abc123\",\n  \"email\": \"string (required, unique)\",\n  \"first_name\": \"string\",\n  \"last_name\": \"string\",\n  \"company\": \"string\",\n  \"title\": \"string\",\n  \"phone\": \"string\",\n  \"score\": \"enum[cold, warm, hot]\",\n  \"tags\": \"array[string]\",\n  \"custom_fields\": \"object\",\n  \"created_at\": \"ISO 8601\",\n  \"updated_at\": \"ISO 8601\",\n  \"owner_id\": \"string (user ID)\"\n}\n```\n\n**Deal Schema:**\n```json\n{\n  \"id\": \"deal_abc123\",\n  \"name\": \"string (required)\",\n  \"contact_id\": \"string (required)\",\n  \"value\": \"number\",\n  \"currency\": \"ISO 4217 code\",\n  \"stage\": \"string\",\n  \"probability\": \"number (0-100)\",\n  \"expected_close_date\": \"ISO 8601 date\",\n  \"status\": \"enum[open, won, lost]\",\n  \"created_at\": \"ISO 8601\",\n  \"owner_id\": \"string\"\n}\n```\n\n**Workflow Schema:**\n```json\n{\n  \"id\": \"wf_abc123\",\n  \"name\": \"string (required)\",\n  \"description\": \"string\",\n  \"trigger\": {\n    \"type\": \"enum[event, schedule, webhook]\",\n    \"config\": \"object\"\n  },\n  \"conditions\": \"array[condition]\",\n  \"actions\": \"array[action]\",\n  \"active\": \"boolean\",\n  \"created_at\": \"ISO 8601\",\n  \"updated_at\": \"ISO 8601\"\n}\n```\n\n**Agent Schema:**\n```json\n{\n  \"id\": \"agent_abc123\",\n  \"name\": \"string\",\n  \"type\": \"enum[scoring, enrichment, content, custom]\",\n  \"ai_provider\": \"enum[openai, anthropic, custom]\",\n  \"model\": \"string\",\n  \"instructions\": \"string\",\n  \"inputs\": \"array[string]\",\n  \"outputs\": \"array[string]\",\n  \"active\": \"boolean\"\n}\n```\n\n**Document Schema:**\n```json\n{\n  \"id\": \"doc_abc123\",\n  \"name\": \"string\",\n  \"content\": \"string\",\n  \"type\": \"enum[pdf, docx, txt, md]\",\n  \"size_bytes\": \"number\",\n  \"tags\": \"array[string]\",\n  \"created_at\": \"ISO 8601\",\n  \"uploaded_by\": \"string (user ID)\"\n}\n```\n\n**Relationships:**\n\n• Contact → Deals (one-to-many)\n• Contact → Activities (one-to-many)\n• Deal → Contact (many-to-one)\n• Workflow → Actions (one-to-many)\n• Agent → Workflows (many-to-many)\n\n**Custom Fields:**\nAll entities support custom fields via `custom_fields` object. Keys are field names, values match field type (string, number, boolean, date, array).",
      topics: ["Contacts Schema", "Workflows Schema", "Agents Schema", "Relationships", "Custom Fields"]
    },
    {
      id: "use-case-taxonomy",
      title: "Use Case Taxonomy",
      icon: BookOpen,
      description: "Categorized use cases and patterns",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Categorized use cases with recommended implementation patterns for AI agents.\n\n**CRM Use Cases:**\n\n**Lead Management:**\n• Auto-enrich contacts from email/company domain\n• Score leads based on fit criteria\n• Route leads to appropriate sales rep\n• De-duplicate and merge contacts\n\nPattern: Event-driven workflow triggered on contact.created\n\n**Deal Management:**\n• Track deal progression through pipeline\n• Predict deal close probability\n• Alert on stalled deals\n• Generate deal summaries\n\nPattern: Scheduled workflow checking deal.updated_at\n\n**Activity Tracking:**\n• Log emails, calls, meetings\n• Extract action items from transcripts\n• Suggest next best actions\n• Generate activity summaries\n\nPattern: Real-time via API on activity completion\n\n**Automation Patterns:**\n\n**Event-Driven:**\nTrigger: Webhook or platform event\nUse when: Real-time response required\nExample: New contact → Enrich → Score → Route\n\n**Scheduled:**\nTrigger: Time-based (cron)\nUse when: Batch processing acceptable\nExample: Daily report generation at 9am\n\n**Request-Response:**\nTrigger: Explicit API call\nUse when: On-demand execution needed\nExample: User clicks 'Generate Summary'\n\n**Hybrid:**\nTrigger: Combination of above\nUse when: Complex multi-stage processes\nExample: Event triggers workflow, workflow schedules follow-ups\n\n**Integration Scenarios:**\n\n**Bidirectional Sync:**\nSync data between GalaxyCo and external CRM (Salesforce, HubSpot). Use webhooks + API calls.\n\n**Enrichment:**\nFetch additional data from external sources (Clearbit, LinkedIn). Use API + background jobs.\n\n**Notification:**\nSend alerts to Slack, Teams, email. Use webhooks → external service.\n\n**Reporting:**\nPush data to BI tools (Tableau, Looker). Use scheduled export + API.\n\n**Best Practices:**\n• Use idempotency keys for writes\n• Implement exponential backoff for retries\n• Cache frequently accessed data\n• Batch operations when possible\n• Monitor rate limits proactively\n\n**Anti-Patterns:**\n• Polling instead of webhooks\n• Individual API calls instead of bulk\n• Ignoring error codes\n• Hard-coding IDs or assumptions\n• Over-requesting data (fetch only needed fields)",
      topics: ["CRM Use Cases", "Automation Patterns", "Integration Scenarios", "Best Practices", "Anti-Patterns"]
    },
    {
      id: "api-specs",
      title: "API Specifications",
      icon: Code2,
      description: "OpenAPI/Swagger documentation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Machine-readable specifications for automated tooling and code generation.\n\n**OpenAPI 3.1 Specification:**\n\nFull API spec available at: https://api.galaxyco.ai/openapi.json\n\nIncludes:\n• All endpoints with parameters\n• Request/response schemas\n• Authentication requirements\n• Error responses\n• Examples for all operations\n\n**Interactive Documentation:**\n\nExplore API interactively: https://api.galaxyco.ai/docs\n\nSwagger UI features:\n• Try API calls directly from browser\n• See real request/response examples\n• Authentication playground\n• Response schema viewer\n\n**Code Generation:**\n\nGenerate client code from OpenAPI spec:\n\n```bash\n# JavaScript/TypeScript\nnpx openapi-generator-cli generate \\\n  -i https://api.galaxyco.ai/openapi.json \\\n  -g typescript-fetch \\\n  -o ./generated-client\n\n# Python\nopenapi-generator generate \\\n  -i https://api.galaxyco.ai/openapi.json \\\n  -g python \\\n  -o ./generated-client\n```\n\nSupported generators: JavaScript, TypeScript, Python, Go, Ruby, Java, C#, PHP, and more.\n\n**Postman Collection:**\n\nImport into Postman: https://api.galaxyco.ai/postman.json\n\nIncludes:\n• Pre-configured authentication\n• Environment variables\n• Sample requests for all endpoints\n• Test scripts\n\n**Official SDKs:**\n\nWe provide and maintain official SDKs:\n\n**JavaScript/TypeScript:**\n```bash\nnpm install @galaxyco/sdk\n```\n\n**Python:**\n```bash\npip install galaxyco\n```\n\nSDKs include:\n• Type-safe interfaces\n• Auto-retry logic\n• Rate limit handling\n• Comprehensive error types\n• Pagination helpers\n• Webhook verification\n\n**Schema Validation:**\n\nAll requests validated against JSON Schema. Validation errors return 400 with detailed field-level errors.\n\n**Versioning:**\n\nAPI version in URL (/v1/). Spec includes version info. We maintain backward compatibility for 12 months.",
      topics: ["OpenAPI Spec", "Swagger UI", "Code Generation", "Postman Collection", "SDKs"]
    },
    {
      id: "integration-patterns",
      title: "Integration Patterns",
      icon: Webhook,
      description: "Common integration architectures",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Reference architectures for common integration patterns.\n\n**Event-Driven Architecture:**\n\n**Flow:** GalaxyCo → Webhook → Your Service → Process → API Call Back\n\n**Best for:** Real-time reactions (new contact → enrich)\n**Latency:** <1s\n**Reliability:** High (retries + idempotency)\n\n**Implementation:**\n1. Register webhook in GalaxyCo\n2. Implement endpoint to receive events\n3. Return 200 immediately\n4. Process async in background\n5. Call API to update GalaxyCo\n\n**Request-Response Pattern:**\n\n**Flow:** Your Service → API Call → GalaxyCo → Response → Process\n\n**Best for:** On-demand queries (show contact details)\n**Latency:** <500ms\n**Reliability:** Depends on API availability\n\n**Implementation:**\n1. Call API with proper auth\n2. Handle response\n3. Implement retry logic\n4. Cache when appropriate\n\n**Batch Processing:**\n\n**Flow:** Schedule → Fetch Data → Process Bulk → Bulk Update\n\n**Best for:** Periodic updates (nightly scoring)\n**Latency:** Minutes to hours\n**Reliability:** High (can retry entire batch)\n\n**Implementation:**\n1. Use cron or scheduler\n2. Fetch data via API (paginated)\n3. Process in batches of 100\n4. Use bulk endpoints\n5. Track progress/failures\n\n**Real-Time Sync (Bidirectional):**\n\n**Flow:** System A ↔ Webhooks + API ↔ System B\n\n**Best for:** Keeping two systems in sync (GalaxyCo ↔ Salesforce)\n**Latency:** <5s\n**Reliability:** Medium (requires conflict resolution)\n\n**Implementation:**\n1. Webhooks in both directions\n2. Dedupe logic (track sync IDs)\n3. Conflict resolution strategy\n4. Exponential backoff\n5. Dead letter queue for failures\n\n**Hybrid Pattern:**\n\n**Flow:** Webhook triggers workflow → Workflow schedules follow-ups → API polls status\n\n**Best for:** Complex multi-stage processes\n**Latency:** Varies by stage\n**Reliability:** High (each stage isolated)\n\n**Implementation:**\n1. Event triggers initial workflow\n2. Workflow uses multiple patterns\n3. State machine tracks progress\n4. Monitoring at each stage\n\n**Reliability Patterns:**\n\n• Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s\n• Circuit breaker: Stop after N failures\n• Idempotency: Use Idempotency-Key header\n• Dead letter queue: Store failed events\n• Monitoring: Track success/failure rates",
      topics: ["Event-Driven", "Request-Response", "Batch Processing", "Real-Time Sync", "Hybrid"]
    },
    {
      id: "performance",
      title: "Performance Benchmarks",
      icon: Zap,
      description: "Response times and throughput",
      lastUpdated: "2025-12-10",
      status: "stable",
      details: "Performance characteristics and optimization guidelines.\n\n**API Response Times (P95):**\n\n**Read Operations:**\n• GET /contacts/{id}: 50ms\n• GET /contacts (list): 150ms\n• GET /workflows/{id}: 40ms\n• Search queries: 200ms\n\n**Write Operations:**\n• POST /contacts: 120ms\n• PATCH /contacts/{id}: 80ms\n• DELETE /contacts/{id}: 60ms\n• Bulk operations: 500ms (for 100 items)\n\n**Workflow Execution:**\n• Simple workflow (1-2 actions): 300ms\n• Complex workflow (5+ actions): 2s\n• AI agent execution: 3-10s (depending on model)\n\n**Throughput:**\n\n**Per Plan:**\n• Starter: 1K requests/hour = ~0.3 req/s\n• Professional: 5K requests/hour = ~1.4 req/s\n• Enterprise: 20K requests/hour = ~5.5 req/s\n\n**Burst Capacity:**\nShort bursts (10s) can exceed rate limit by 2x. Sustained load must stay within limit.\n\n**Concurrency:**\n\n**API Calls:** No explicit limit. Rate limit is shared across all concurrent requests.\n**Workflow Executions:** Max 100 concurrent per workspace.\n**Webhook Deliveries:** Max 50 concurrent per endpoint.\n\n**Optimization Guidelines:**\n\n**Reduce Latency:**\n1. Use field selection (?fields=id,name,email)\n2. Enable HTTP/2 for connection reuse\n3. Cache frequently accessed data\n4. Use CDN for static content\n5. Call APIs from same region as data\n\n**Increase Throughput:**\n1. Use bulk endpoints instead of loops\n2. Parallelize independent requests\n3. Batch updates into fewer API calls\n4. Use webhooks instead of polling\n5. Implement request deduplication\n\n**Optimize Workflows:**\n1. Minimize number of actions\n2. Use conditions to skip unnecessary steps\n3. Avoid nested workflow calls\n4. Cache workflow results\n5. Use async execution for non-critical paths\n\n**Monitoring:**\n\n**Key Metrics to Track:**\n• API response time (P50, P95, P99)\n• Error rate by endpoint\n• Rate limit utilization\n• Workflow execution time\n• Webhook delivery success rate\n\n**Alerting Thresholds:**\n• P95 latency >2x baseline\n• Error rate >5%\n• Rate limit >80% utilization\n• Workflow failures >10%\n\n**Available via:** Status page (status.galaxyco.ai) and API metrics endpoint.",
      topics: ["Latency", "Throughput", "Concurrency", "Optimization", "Monitoring"]
    },
    {
      id: "limitations",
      title: "Limitations",
      icon: AlertCircle,
      description: "Known constraints and boundaries",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Known limitations and constraints to design around.\n\n**API Limits:**\n\n**Rate Limits:** Enforced per plan (1K-20K req/hr). No way to temporarily exceed.\n**Payload Size:** Max 10MB per request. Use file upload endpoint for larger files.\n**Bulk Operations:** Max 100 items per request. No exceptions.\n**Timeout:** All API calls timeout after 30s. Long-running operations return 202 with job ID.\n**Concurrency:** Max 100 concurrent workflow executions per workspace.\n\n**Data Constraints:**\n\n**String Fields:** Max 10,000 characters (except for document content).\n**Arrays:** Max 1,000 items per array field.\n**Custom Fields:** Max 50 custom fields per entity type.\n**Tags:** Max 100 tags per contact/deal.\n**Relationships:** No cascading deletes. Must handle related records manually.\n\n**Search Limitations:**\n• Full-text search limited to 100K documents\n• Search results max 1,000 items\n• No fuzzy matching (exact or prefix only)\n• Search indexes updated every 5 minutes (eventual consistency)\n\n**Workflow Limitations:**\n• Max 50 actions per workflow\n• No loops or recursion\n• Workflow execution timeout: 5 minutes\n• Cannot call external webhooks directly (use API action)\n• No conditional branching beyond simple IF/ELSE\n\n**Known Issues:**\n\n**Beta Features:**\n• Audit logs: 5-minute delay in availability\n• Webhook retries: Max 5 attempts (no manual retry)\n• Bulk delete: No undo functionality\n\n**Regional Limitations:**\n• Data residency only on Enterprise plan\n• Some AI models not available in all regions\n• Webhook delivery may be slower to certain regions\n\n**Integration Limitations:**\n• External API calls from workflows: Max 10s timeout\n• OAuth refresh tokens expire after 90 days of inactivity\n• SSO limited to SAML 2.0 and OAuth 2.0\n\n**Workarounds:**\n\n**Large Payloads:** Split into multiple requests or use file upload.\n**Complex Workflows:** Chain multiple workflows via webhooks.\n**Search Limits:** Use filters instead of full-text search when possible.\n**Rate Limits:** Implement queuing system in your application.\n**Timeouts:** For long operations, use async pattern: POST to create job, GET to poll status.\n\n**Upcoming Improvements:**\n• GraphQL API (Q1 2026)\n• Increased rate limits for all plans (Q2 2026)\n• Workflow debugging tools (Q2 2026)\n• Real-time search (Q3 2026)",
      topics: ["API Limits", "Data Constraints", "Feature Gaps", "Known Issues", "Workarounds"]
    }
  ]
};

const quickLinks = [
  { label: "API Reference", href: "#api-reference", icon: Code2 },
  { label: "Changelog", href: "#changelog", icon: Clock },
  { label: "Contact Support", href: "/contact", icon: HelpCircle },
];

const statusConfig = {
  stable: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  beta: { bg: "bg-nebula-violet/10", text: "text-nebula-violet", border: "border-nebula-violet/20" },
  new: { bg: "bg-nebula-teal/10", text: "text-nebula-teal", border: "border-nebula-teal/20" },
};

export default function DocsPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("end-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const currentSections = docSections[userType];
  const filteredSections = searchQuery
    ? currentSections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentSections;

  // Close sidebar on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentConfig = userTypeConfig[userType];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      {/* Minimal Hero Section */}
      <section className="relative pt-[73px] overflow-hidden">
        {/* Dark nebula background */}
        <div className="absolute inset-0 bg-gradient-to-b from-nebula-void via-nebula-deep to-nebula-dark" />
        
        {/* Subtle nebula accents */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-nebula-violet/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-nebula-teal/8 rounded-full blur-[80px]" />
        
        {/* Hero content */}
        <div className="relative z-10 px-6 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-nebula-frost tracking-widest mb-4 uppercase">
              Documentation
            </h1>
            <p className="text-lg sm:text-xl text-nebula-frost/60 max-w-2xl mx-auto">
              Everything you need to build, integrate, and scale with GalaxyCo.ai
            </p>
          </motion.div>
        </div>
        
        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Subtle nebula background for content area */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ top: "300px" }}>
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-nebula-violet/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[500px] bg-nebula-teal/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="flex min-h-[calc(100vh-300px)]">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 lg:hidden h-12 w-12 rounded-full bg-nebula-dark text-nebula-frost shadow-lg flex items-center justify-center border border-nebula-frost/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-nebula-void/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen w-72 lg:w-64 xl:w-72
            bg-background/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
            border-r border-border/50 lg:border-0
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            pt-0
          `}
        >
          <div className="h-full overflow-y-auto py-6 px-4 lg:px-6">
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Type Pills */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Documentation
              </span>
              {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
                const config = userTypeConfig[type];
                const Icon = config.icon;
                const isActive = userType === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setUserType(type);
                      setActiveSection(null);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive 
                        ? "bg-nebula-dark text-nebula-frost shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive 
                        ? "bg-gradient-to-br from-nebula-teal to-nebula-violet" 
                        : "bg-muted"
                      }
                    `}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-nebula-frost" : "text-muted-foreground"}`} />
                    </div>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Section Links */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                {currentConfig.label} Docs
              </span>
              {currentSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      transition-all duration-150
                      ${isActive 
                        ? "bg-nebula-teal/10 text-nebula-teal font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                    {section.status === "new" && (
                      <span className="ml-auto text-[10px] font-semibold text-nebula-teal bg-nebula-teal/10 px-1.5 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Quick Links */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Quick Links
              </span>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-150"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 min-w-0 lg:pl-0">
          {/* Subtle nebula background for content area */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-1/4 w-[600px] h-[400px] bg-nebula-violet/[0.03] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] bg-nebula-teal/[0.02] rounded-full blur-[100px]" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft focus-visible:ring-nebula-teal/30"
                  aria-label="Search documentation"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">K</kbd>
                </div>
              </div>
            </motion.div>

            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-nebula-teal to-nebula-violet flex items-center justify-center">
                  <CurrentIcon className="h-5 w-5 text-nebula-frost" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{currentConfig.label}</h1>
                  <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Doc Cards - Expandable */}
            <div className="space-y-3">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                const status = section.status ? statusConfig[section.status] : null;
                const isExpanded = activeSection === section.id;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div className={`
                      relative rounded-2xl bg-card/60 backdrop-blur-sm border transition-all duration-300 shadow-soft
                      ${isExpanded 
                        ? "border-nebula-teal/40 bg-card/80 shadow-soft-hover" 
                        : "border-border/50 hover:border-nebula-teal/30 hover:bg-card/80 hover:shadow-soft-hover"
                      }
                    `}>
                      {/* Nebula glow */}
                      <div className={`
                        absolute inset-0 rounded-2xl bg-gradient-to-r from-nebula-teal/5 to-nebula-violet/5 transition-opacity duration-300
                        ${isExpanded ? "opacity-100" : "opacity-0"}
                      `} />
                      
                      {/* Header - Clickable */}
                      <button
                        onClick={() => setActiveSection(isExpanded ? null : section.id)}
                        className="w-full group"
                        aria-expanded={isExpanded}
                        aria-controls={`doc-content-${section.id}`}
                      >
                        <div className="relative flex items-center gap-4 p-4 sm:p-5 text-left">
                          {/* Icon */}
                          <div className={`
                            relative h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                            ${isExpanded 
                              ? "bg-gradient-to-br from-nebula-teal/20 to-nebula-violet/20" 
                              : "bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-nebula-teal/20 group-hover:to-nebula-violet/20"
                            }
                          `}>
                            <Icon className={`h-6 w-6 transition-colors ${isExpanded ? "text-nebula-teal" : "text-muted-foreground group-hover:text-nebula-teal"}`} />
                          </div>

                          {/* Content */}
                          <div className="relative flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold transition-colors ${isExpanded ? "text-nebula-teal" : "text-foreground group-hover:text-nebula-teal"}`}>
                                {section.title}
                              </h3>
                              {status && (
                                <Badge className={`${status.bg} ${status.text} ${status.border} border text-[10px] px-1.5 py-0`}>
                                  {section.status === "stable" ? "Stable" : section.status === "beta" ? "Beta" : "New"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {section.description}
                            </p>
                          </div>

                          {/* Arrow - rotates when expanded */}
                          <ChevronRight className={`
                            relative h-5 w-5 transition-all flex-shrink-0
                            ${isExpanded 
                              ? "text-nebula-teal rotate-90" 
                              : "text-muted-foreground/50 group-hover:text-nebula-teal group-hover:translate-x-1"
                            }
                          `} />
                        </div>
                      </button>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            id={`doc-content-${section.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="relative px-4 sm:px-5 pb-5 pt-0">
                              {/* Divider */}
                              <div className="h-px bg-border/50 mb-4" />
                              
                              {/* Details */}
                              {section.details && (
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                  {section.details}
                                </p>
                              )}
                              
                              {/* Topics */}
                              {section.topics && section.topics.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Topics Covered
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {section.topics.map((topic: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-nebula-teal/10 text-nebula-teal text-xs font-medium border border-nebula-teal/20"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Coming Soon Note */}
                              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Full content coming soon • Updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* No results */}
            {filteredSections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  No documentation matches "{searchQuery}"
                </p>
              </motion.div>
            )}

            {/* Coming Soon CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nebula-dark to-nebula-void p-8 text-nebula-frost">
                {/* Nebula accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-violet/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-nebula-teal/20 rounded-full blur-[60px]" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-nebula-frost/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-7 w-7 text-nebula-teal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Full Documentation Coming Soon</h3>
                    <p className="text-nebula-frost/70 text-sm">
                      We're actively writing comprehensive guides. Get started with the platform while we expand our docs.
                    </p>
                  </div>
                  <Button
                    onClick={handleEnterApp}
                    className="bg-nebula-frost text-nebula-void hover:bg-nebula-frost/90"
                  >
                    Start Building
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Footer spacing */}
            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}