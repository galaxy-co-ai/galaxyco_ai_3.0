# Neptune Autonomy System — User Guide

**Last Updated:** 2025-12-17

---

## 🤖 **What is Neptune Autonomy?**

Neptune learns from your behavior and progressively automates actions you approve regularly. Instead of asking for confirmation every time, Neptune remembers your preferences and executes trusted actions automatically.

**Example:**
- **First time:** "Shall I create this lead for Acme Corp?" → You approve
- **After 5 approvals:** Neptune creates leads automatically without asking ✅

---

## 🎯 **How It Works**

### 1. **Risk-Based Classification**

Neptune categorizes every action into 3 risk levels:

| Risk Level | Behavior | Examples |
|-----------|----------|----------|
| **Low-Risk** 🟢 | Auto-execute immediately | Get pipeline summary, search web, analyze data |
| **Medium-Risk** 🟡 | Ask first, learn over time | Create leads, schedule meetings, generate content |
| **High-Risk** 🔴 | Always ask for confirmation | Send emails, schedule demos |

---

### 2. **Learning Algorithm**

For **medium-risk** actions, Neptune tracks your approvals:

```
Approval 1: 20% confidence → Still asks
Approval 2: 40% confidence → Still asks
Approval 3: 75% confidence → Still asks
Approval 4: 80% confidence → Still asks
Approval 5: 85% confidence → Auto-execute enabled! ✅

From now on: Neptune executes without asking
```

**Key thresholds:**
- **80% confidence** + **5 approvals** = Auto-execution enabled
- **2 rejections within 7 days** = Confidence reset to 0%

---

### 3. **Visual Indicators**

When Neptune auto-executes an action, you'll see a badge:

```
🤖 create lead (85% confident)
```

This shows:
- **🤖** = Auto-executed (you weren't asked)
- **Tool name** = What action was taken
- **Confidence** = How certain Neptune is (based on your past approvals)

---

## 📊 **Current Tool Classifications**

### Low-Risk Tools (Auto-Execute Immediately) 🟢

**Analytics & Reporting:**
- `get_pipeline_summary` — Your sales pipeline
- `get_campaign_stats` — Marketing metrics
- `get_finance_summary` — Financial overview
- `forecast_revenue` — Revenue predictions
- `get_team_performance` — Team metrics

**Search & Retrieval:**
- `search_leads` — Find leads in CRM
- `search_knowledge` — Search knowledge base
- `search_web` — Internet search
- `list_agents` — Show your agents

**Analysis:**
- `analyze_company_website` — Website analysis
- `analyze_competitor` — Competitive analysis
- `auto_qualify_lead` — Lead scoring

**Total:** 42 low-risk tools

---

### Medium-Risk Tools (Learn Over Time) 🟡

**CRM Operations:**
- `create_lead` — Add new lead
- `create_contact` — Add new contact
- `update_lead_stage` — Move lead through pipeline
- `create_deal` — Create deal

**Agent & Automation:**
- `create_agent` — Create AI agent
- `run_agent` — Execute agent
- `create_workflow` — Build workflow
- `execute_workflow` — Run workflow

**Marketing:**
- `create_campaign` — Start campaign
- `generate_image` — Create image (DALL-E)
- `generate_marketing_copy` — Write ad copy
- `post_to_social_media` — Post to Twitter

**Content:**
- `create_document` — Save document
- `generate_pdf` — Export PDF
- `create_professional_document` — Generate presentation

**Total:** 50 medium-risk tools

---

### High-Risk Tools (Always Confirm) 🔴

**External Communication:**
- `send_email` — Send email message
- `send_invoice_reminder` — Email invoice reminder
- `send_payment_reminders` — Email payment reminders

**Customer-Facing:**
- `schedule_demo` — Schedule demo with customer

**Total:** 4 high-risk tools

---

## ⚙️ **Managing Your Preferences**

### Viewing Your Autonomy Status

Currently, autonomy preferences are stored automatically. To see your settings:

1. Open Neptune chat
2. Ask: **"Show me my autonomy settings"**
3. Neptune will display:
   - Tools you've enabled auto-execution for
   - Confidence scores per tool
   - Number of approvals/rejections

### Disabling Auto-Execution

If Neptune auto-executes something you don't want:

1. **Reject the action** when it happens
2. After **2 rejections within 7 days**, auto-execution will be disabled
3. You can also ask: **"Stop auto-executing [tool name]"**

### Resetting Learning

To reset all learned preferences:

Ask Neptune: **"Reset my autonomy preferences"**

⚠️ This will reset all confidence scores to 0% and Neptune will start asking for confirmation again.

---

## 🧪 **Examples**

### Example 1: Lead Creation Flow

**First Time:**
```
You: "Create a lead for John Smith at Acme Corp"
Neptune: "I can create this lead for you. Shall I proceed?"
You: "Yes"
Neptune: ✅ Created lead "John Smith" (Approval 1/5)
```

**Fifth Time:**
```
You: "Create a lead for Jane Doe at Widget Co"
Neptune: ✅ Created lead "Jane Doe"
         🤖 create lead (85% confident)
```

---

### Example 2: Analytics (Auto-Execute Immediately)

```
You: "What's my sales pipeline?"
Neptune: ✅ You have 23 leads: 8 new, 5 contacted, 3 qualified...
         🤖 get pipeline summary (90% confident)
```

No approval needed — low-risk action!

---

### Example 3: High-Risk (Always Ask)

```
You: "Send invoice reminder to Acme Corp"
Neptune: "I can send an invoice reminder email to Acme Corp. 
         This will send an external email. Confirm?"
You: "Yes"
Neptune: ✅ Sent invoice reminder
```

Neptune will **always ask** for email-sending actions.

---

## 🎯 **Benefits**

### Faster Workflows
- No repetitive "Yes, do that" clicks
- Multi-step actions execute automatically
- Parallel tool execution (multiple actions simultaneously)

### Personalized to You
- Different users can have different preferences
- Neptune learns from **your** approvals, not others'
- Workspace-specific settings

### Safe & Reversible
- High-risk actions always require confirmation
- 2 rejections disable auto-execution
- Old rejections decay after 30 days

---

## 🔍 **Advanced Features**

### Parallel Execution

Neptune can auto-execute **multiple independent actions simultaneously**:

```
You: "Get my pipeline and search for competitor info on Acme Corp"

Neptune executes in parallel:
- search_web (for competitor info)
- get_pipeline_summary

Result: 50% faster than sequential execution ✅
```

### Confidence Decay

If you haven't used a tool in 30+ days and had old rejections:
- Rejection impact decreases over time
- Confidence may increase automatically
- Fresh start for tools you rarely use

### Confidence Boost

If you approve an action 3+ times with zero rejections:
- Confidence gets +15% boost
- Faster path to auto-execution
- Rewards consistent approval patterns

---

## ❓ **FAQ**

### Q: Can I see which tools are auto-executing?
**A:** Yes! Look for the 🤖 badges in Neptune's responses.

### Q: Will Neptune ever send emails without asking?
**A:** No. `send_email` and related tools are **high-risk** and always require confirmation.

### Q: What if I reject an auto-executed action?
**A:** After 2 rejections within 7 days, auto-execution is disabled for that tool.

### Q: Can I speed up the learning?
**A:** The 5-approval threshold is fixed for safety, but consistent approvals with zero rejections get a +15% confidence boost.

### Q: Are my preferences shared with other users?
**A:** No. Each user in each workspace has separate preferences.

### Q: Can I manually enable auto-execution?
**A:** Not currently. The system requires 5 approvals to ensure safety. This may be added in a future update.

---

## 🚀 **What's Next?**

Coming soon:
- **Settings Panel** — Visual dashboard to manage auto-execution per tool
- **Confidence Display** — See confidence scores in real-time
- **Batch Approval** — Approve multiple actions at once
- **Proactive Insights** — Neptune suggests optimizations based on your patterns

---

## 📎 **Related Documentation**

- **Neptune Overview** — `/docs/user-guides/NEPTUNE_GETTING_STARTED.md`
- **Tool Reference** — Complete list of all 101 Neptune tools
- **Developer Docs** — `/docs/audit/NEPTUNE_AUTONOMY_ANALYSIS.md`

---

**Questions?** Ask Neptune: "How does your autonomy system work?"
