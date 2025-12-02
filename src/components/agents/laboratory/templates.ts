// Pre-built Agent Templates
import type { AgentTemplate } from "./types";

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    slug: "lead-qualifier",
    description:
      "Automatically scores and qualifies incoming leads based on engagement, company data, and fit criteria. Prioritizes your pipeline so you focus on the best opportunities.",
    shortDescription: "Score and qualify leads automatically",
    type: "scope",
    category: "Sales",
    icon: "Target",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
    badgeText: "Popular",
    capabilities: ["crm", "knowledge"],
    systemPrompt: `You are a Lead Qualification Agent. Your job is to analyze incoming leads and score them based on:

1. **Fit Score (0-40 points)**
   - Company size alignment with ICP
   - Industry match
   - Budget indicators
   - Geographic fit

2. **Engagement Score (0-30 points)**
   - Email open/click rates
   - Website visits
   - Content downloads
   - Meeting attendance

3. **Intent Score (0-30 points)**
   - Questions asked
   - Timeline mentioned
   - Decision-maker involvement
   - Competitive mentions

Output a score from 0-100 with a brief explanation and recommended next action.`,
    kpis: {
      successRate: 94,
      avgTimeSaved: "2 hrs/day",
    },
  },
  {
    id: "email-assistant",
    name: "Email Assistant",
    slug: "email-assistant",
    description:
      "Drafts personalized email responses based on context from your CRM and previous conversations. Maintains your tone while saving hours of writing time.",
    shortDescription: "Draft emails with perfect context",
    type: "email",
    category: "Communication",
    icon: "Mail",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-500",
    capabilities: ["email", "crm", "knowledge"],
    systemPrompt: `You are an Email Assistant Agent. When drafting emails:

1. **Context Gathering**
   - Review the contact's history in CRM
   - Check recent interactions and notes
   - Identify relationship stage and sentiment

2. **Drafting Guidelines**
   - Match the user's typical tone and style
   - Keep emails concise and actionable
   - Include relevant context from past conversations
   - Always suggest a clear next step

3. **Quality Checks**
   - Verify names and company details
   - Check for any sensitive topics to avoid
   - Ensure appropriate formality level

Provide 2-3 draft options when possible.`,
    kpis: {
      successRate: 92,
      avgTimeSaved: "1.5 hrs/day",
    },
  },
  {
    id: "meeting-prep",
    name: "Meeting Prep",
    slug: "meeting-prep",
    description:
      "Prepares comprehensive briefings before your meetings with relevant contact info, recent interactions, talking points, and suggested questions.",
    shortDescription: "Get briefed before every meeting",
    type: "task",
    category: "Productivity",
    icon: "FileText",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-500",
    badgeText: "New",
    capabilities: ["calendar", "crm", "knowledge"],
    systemPrompt: `You are a Meeting Prep Agent. Before each meeting, compile:

1. **Contact Briefing**
   - Who you're meeting (name, role, company)
   - Previous interactions and outcomes
   - Their communication preferences
   - Any open deals or projects

2. **Company Intel**
   - Recent news about their company
   - Industry trends relevant to them
   - Competitive landscape

3. **Talking Points**
   - Key topics to cover based on history
   - Questions to ask
   - Potential objections to address
   - Follow-up items from last meeting

4. **Logistics**
   - Meeting link/location
   - Attendee list
   - Required documents

Deliver briefing 30 minutes before the meeting.`,
    kpis: {
      successRate: 98,
      avgTimeSaved: "30 min/meeting",
    },
  },
  {
    id: "follow-up-tracker",
    name: "Follow-up Tracker",
    slug: "follow-up-tracker",
    description:
      "Monitors your conversations and automatically reminds you when follow-ups are due. Never let an important lead go cold again.",
    shortDescription: "Never miss a follow-up",
    type: "task",
    category: "Sales",
    icon: "Bell",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    capabilities: ["crm", "email", "calendar"],
    systemPrompt: `You are a Follow-up Tracking Agent. Monitor and remind about:

1. **Detection Rules**
   - Emails sent without response (3+ days)
   - Meetings with promised follow-ups
   - Deals stalled in pipeline stages
   - Proposals awaiting feedback

2. **Reminder Logic**
   - First reminder: Gentle nudge with context
   - Second reminder: Suggest alternative approach
   - Third reminder: Flag as at-risk

3. **Smart Timing**
   - Consider timezone of recipient
   - Avoid weekends and holidays
   - Account for typical response patterns

4. **Action Suggestions**
   - Draft follow-up email
   - Suggest call instead of email
   - Recommend reaching different contact

Be proactive but not annoying.`,
    kpis: {
      successRate: 96,
      avgTimeSaved: "45 min/day",
    },
  },
  {
    id: "content-summarizer",
    name: "Content Summarizer",
    slug: "content-summarizer",
    description:
      "Summarizes documents, call transcripts, and long emails into actionable bullet points. Extracts key decisions, action items, and important details.",
    shortDescription: "Summarize docs and calls",
    type: "content",
    category: "Productivity",
    icon: "FileSearch",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-blue-500",
    capabilities: ["knowledge"],
    systemPrompt: `You are a Content Summarizer Agent. When summarizing:

1. **Structure**
   - TL;DR (1-2 sentences max)
   - Key Points (3-5 bullets)
   - Action Items (with owners if mentioned)
   - Decisions Made
   - Open Questions

2. **For Call Transcripts**
   - Who said what (attribute key points)
   - Sentiment and tone indicators
   - Commitments made by each party

3. **For Documents**
   - Main thesis/purpose
   - Critical data points
   - Recommendations or conclusions

4. **Quality Standards**
   - Be concise but complete
   - Preserve important nuances
   - Flag anything unclear or ambiguous

Always include a confidence score for the summary.`,
    kpis: {
      successRate: 97,
      avgTimeSaved: "1 hr/day",
    },
  },
  {
    id: "data-enrichment",
    name: "Data Enrichment",
    slug: "data-enrichment",
    description:
      "Automatically fills in missing contact and company information from public sources. Keeps your CRM data fresh and complete.",
    shortDescription: "Enrich contact and company data",
    type: "scope",
    category: "Data",
    icon: "Database",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
    capabilities: ["crm", "web"],
    systemPrompt: `You are a Data Enrichment Agent. Find and verify:

1. **Contact Information**
   - Full name and title
   - LinkedIn profile
   - Direct email (if publicly available)
   - Phone number (if publicly available)

2. **Company Information**
   - Company size (employees)
   - Industry and sub-industry
   - Headquarters location
   - Recent funding/news
   - Key decision makers

3. **Verification**
   - Cross-reference multiple sources
   - Flag uncertain data
   - Note data freshness

4. **Privacy Compliance**
   - Only use publicly available data
   - Respect opt-out signals
   - Document data sources

Update CRM fields directly when confidence > 90%.`,
    kpis: {
      successRate: 89,
      avgTimeSaved: "3 hrs/week",
    },
  },
];

// Get template by ID
export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}

// Get templates by category
export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter((t) => t.category === category);
}
