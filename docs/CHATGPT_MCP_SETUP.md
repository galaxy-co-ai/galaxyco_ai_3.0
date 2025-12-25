# Neptune ChatGPT MCP Integration Guide

**Last Updated:** December 25, 2024  
**Status:** Production Ready  
**Protocol Version:** MCP 2024-11-05

---

## Overview

This guide walks you through connecting **Neptune by GalaxyCo** to ChatGPT using the Model Context Protocol (MCP). Once connected, you can manage your entire GalaxyCo workspace directly from ChatGPT conversations.

### What You'll Be Able to Do

- 🔍 **Search** across leads, tasks, and knowledge base
- 📝 **Quick Capture** ideas, leads, and tasks on-the-go
- 👥 **Manage CRM** - create leads, update stages, search contacts
- ✅ **Handle Tasks** - create, list, and track your to-dos
- 📊 **Get Summaries** - workspace overview with pipeline & metrics
- 💡 **Access Knowledge** - search your docs and saved notes
- ✉️ **Draft Emails** - generate professional emails based on context

---

## Prerequisites

### Required
- ✅ ChatGPT Pro, Team, Business, Enterprise, or Edu account
- ✅ Active GalaxyCo workspace at app.galaxyco.ai
- ✅ Workspace admin permissions (for publishing)

### For Testing
- Developer Mode enabled in ChatGPT settings
- OR Admin access to publish custom apps

---

## Setup Methods

Choose your path based on your account type:

### Method 1: Developer Mode (Recommended for Testing)
**Available for:** Pro, Team, Business, Enterprise, Edu  
**Best for:** Testing before rolling out to your team

### Method 2: Published Custom App (Enterprise/Business)
**Available for:** Business, Enterprise, Edu with admin access  
**Best for:** Organization-wide deployment with controlled rollout

---

## Method 1: Developer Mode Setup

### Step 1: Enable Developer Mode

1. Open ChatGPT and go to **Settings** (bottom left)
2. Navigate to **Workspace Settings** → **Permissions & Roles**
3. Find **"Developer mode / Create custom MCP connectors"**
4. Toggle **ON**

> **Note:** Only workspace admins can enable Developer Mode. If you don't see this option, contact your workspace admin.

### Step 2: Create Custom Connector

1. In ChatGPT Settings, go to **Connectors** (or **Apps**)
2. Click **Create** (top right)
3. Fill in the form:

```
Name: Neptune by GalaxyCo
Description: Your AI-powered business workspace - manage CRM, tasks, and knowledge from ChatGPT
Icon: (Optional) Upload Neptune logo from public/assets/brand/logos/neptune_ai_assistant_logo.svg
MCP Server URL: https://app.galaxyco.ai/api/mcp/sse
Authentication: OAuth
```

4. Check **"I understand and want to continue"** (security warning)
5. Click **Create**

### Step 3: Authorize Neptune

After clicking Create, you'll be redirected to GalaxyCo's authorization page:

1. **Sign in** to your GalaxyCo account (if not already)
2. **Review permissions** - Neptune will request access to:
   - Read and write leads/prospects
   - Read and write tasks
   - Read knowledge base items
   - Read workspace summaries
3. Click **Authorize**
4. You'll be redirected back to ChatGPT with a success message

### Step 4: Test the Connection

Start a new chat and select Neptune from the model picker:

1. Click the **model selector** (top of chat)
2. Choose **"Developer Mode"** or **"More >"**
3. Select **"Neptune by GalaxyCo"** from the list
4. Try a test command:

```
Search for leads in my pipeline
```

If you see results, you're all set! 🎉

---

## Method 2: Published Custom App

### For Workspace Admins

After testing with Developer Mode (Method 1), you can publish Neptune for your entire workspace:

1. Go to **Workspace Settings** → **Apps**
2. Click on **Drafts** tab
3. Find **"Neptune by GalaxyCo"**
4. Click **Publish**
5. Review safety warnings (especially for write actions)
6. Confirm publication

Once published, Neptune appears in your workspace's approved apps list. Users can enable it in their personal ChatGPT settings.

### For Team Members

1. Go to ChatGPT **Settings** → **Apps** (or **Connectors**)
2. Find **"Neptune by GalaxyCo"** in the available apps list
3. Click **Enable** or **Connect**
4. Authorize when prompted (OAuth flow)
5. Start using Neptune in your chats!

---

## Usage Examples

### Quick Capture
Capture anything from conversations instantly:

```
Capture: "John Smith from Acme Corp - interested in Enterprise plan"
```

Neptune auto-detects this is a lead and creates it in your CRM.

### Search Everything
```
Search for all tasks due this week
Find leads from Acme Corp
Show me notes about product roadmap
```

### CRM Management
```
Create a lead: Sarah Johnson, sarah@techcorp.com, CTO at TechCorp
Update lead status to "qualified" for John Smith
Search qualified leads
```

### Task Management
```
Create a task: Follow up with Sarah - due tomorrow - high priority
List all my pending tasks
Show completed tasks from this week
```

### Get Insights
```
Give me a workspace summary
Show me my pipeline status
What's my team working on?
```

### Draft Emails
```
Draft a follow-up email to Sarah Johnson about our Enterprise plan
Write a thank you email to John Smith
Create a proposal email for Acme Corp - friendly tone
```

---

## Tool Reference

### Read-Only Tools (No Confirmation Required)

These tools are marked as safe and won't prompt for confirmation:

- `search` - Universal search across workspace
- `fetch` - Get details by ID
- `search_leads` - Search CRM
- `list_tasks` - List tasks with filters
- `get_workspace_summary` - Dashboard overview
- `search_knowledge` - Search knowledge base
- `draft_email` - Generate email text (doesn't send)

### Write Tools (Require Confirmation)

ChatGPT will show a confirmation modal before executing:

- `quick_capture` - Capture notes/leads/tasks
- `create_lead` - Create new CRM lead
- `update_lead` - Update lead stage/notes
- `create_task` - Create new task

> **Tip:** Check "Remember this choice for this conversation" to skip confirmations for the current chat.

---

## Security & Privacy

### Data Access
Neptune can:
- ✅ Read and write to **your workspace only** (multi-tenant isolated)
- ✅ Access data you have permissions for
- ❌ Cannot access other workspaces
- ❌ Cannot access data you don't have permissions for

### OAuth Tokens
- Access tokens expire after **1 hour**
- Refresh tokens last **30 days**
- Tokens are **revocable** at any time from GalaxyCo settings

### Prompt Injection Protection
Be aware that malicious content in your data could potentially trick ChatGPT into unintended actions. Best practices:

- ✅ Review all write actions before confirming
- ✅ Don't authorize Neptune for sensitive workspaces without careful consideration
- ✅ Only enable for trusted team members
- ❌ Don't paste untrusted external content that will be processed

### Revoking Access

To revoke Neptune's access:

1. Go to app.galaxyco.ai → Settings → Connected Apps
2. Find "ChatGPT Neptune"
3. Click **Revoke Access**

Or in ChatGPT:
1. Settings → Connectors/Apps
2. Find Neptune
3. Click **Disconnect**

---

## Troubleshooting

### "Connection failed" or "Unable to connect"

**Check:**
- ✅ You're signed into GalaxyCo at app.galaxyco.ai
- ✅ Your workspace is active (not suspended)
- ✅ Developer Mode is enabled
- ✅ The URL is exactly: `https://app.galaxyco.ai/api/mcp/sse`

**Try:**
1. Disconnect and reconnect Neptune
2. Clear browser cache and retry
3. Use incognito/private browsing mode

### "Authorization failed" or OAuth errors

**Solutions:**
- Log out of GalaxyCo and ChatGPT, then retry
- Check that you have workspace member permissions
- Contact your GalaxyCo workspace admin

### "Tool not found" or "Action not available"

This means the tool list didn't sync properly:

1. In ChatGPT Settings → Connectors
2. Click into Neptune
3. Click **Refresh** button
4. Restart your chat

### Write actions not working

**Check:**
- ✅ You confirmed the action when prompted
- ✅ You have write permissions in your workspace
- ✅ The data format is valid (e.g., valid email for leads)

**Review the error message** - it will specify what went wrong (e.g., "Email required for lead creation")

### Rate limiting

If you see "Too many requests":
- Wait 30 seconds and retry
- Neptune enforces rate limits per workspace:
  - 60 requests per minute
  - 1000 requests per hour

---

## Configuration Reference

### Environment Variables (For Self-Hosted)

If deploying your own instance:

```bash
# OAuth Configuration
MCP_CLIENT_ID="neptune-chatgpt-app"
MCP_CLIENT_SECRET="<32-byte-hex-secret>"  # Generate: openssl rand -hex 32
MCP_JWT_SECRET="<optional-jwt-secret>"    # Falls back to CLERK_SECRET_KEY

# App URLs
NEXT_PUBLIC_APP_URL="https://app.galaxyco.ai"

# Database & Auth (existing)
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_live_..."
```

### OAuth Endpoints

These are automatically configured:

```
Authorization: https://app.galaxyco.ai/api/mcp/auth/authorize
Token:         https://app.galaxyco.ai/api/mcp/auth/token
Discovery:     https://app.galaxyco.ai/.well-known/oauth-authorization-server
MCP Endpoint:  https://app.galaxyco.ai/api/mcp/sse
```

---

## API Specifications

### MCP Protocol Version
- **Version:** 2024-11-05
- **Transport:** JSON-RPC 2.0 over HTTP POST
- **Streaming:** SSE (Server-Sent Events) for real-time updates

### Supported Methods
```json
{
  "initialize": "Handshake and capability exchange",
  "tools/list": "List all available tools",
  "tools/call": "Execute a specific tool",
  "ping": "Health check"
}
```

### OAuth Flow
- **Grant Type:** authorization_code
- **PKCE:** Supported (S256, plain)
- **Scopes:** read, write
- **Token Type:** Bearer (JWT)

---

## Next Steps

### For Developers
- Review the [MCP Server Implementation](../src/app/api/mcp/sse/route.ts)
- Check [Tool Definitions](../src/lib/mcp/tools.ts)
- Explore [Type Definitions](../src/lib/mcp/types.ts)

### For Product Teams
- Test all tools thoroughly in Developer Mode
- Document team workflows using Neptune
- Gather feedback before publishing to workspace

### For Workspace Admins
- Create onboarding guide for your team
- Set up RBAC rules if using Enterprise/Edu
- Monitor usage via GalaxyCo Analytics

---

## Support

### Documentation
- MCP Specification: https://modelcontextprotocol.io/
- OpenAI MCP Guide: https://platform.openai.com/docs/mcp
- GalaxyCo Docs: https://docs.galaxyco.ai

### Contact
- **Email:** hello@galaxyco.ai
- **Support Portal:** app.galaxyco.ai/support
- **Community:** discord.gg/galaxyco

### Report Issues
- Security issues: security@galaxyco.ai
- Bugs: GitHub Issues or Support Portal
- Feature requests: feedback@galaxyco.ai

---

**Built with ❤️ by the GalaxyCo Team**  
*Making AI work for your business*
