import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-error-handler";

// These templates are hardcoded for reliability - they always work
// In the future, can be extended to pull from database for custom templates
const AGENT_TEMPLATES = [
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
    badgeText: "Popular",
    capabilities: ["crm", "knowledge"],
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
    capabilities: ["email", "crm", "knowledge"],
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
    badgeText: "New",
    capabilities: ["calendar", "crm", "knowledge"],
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
    capabilities: ["crm", "email", "calendar"],
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
    capabilities: ["knowledge"],
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
    capabilities: ["crm", "web"],
    kpis: {
      successRate: 89,
      avgTimeSaved: "3 hrs/week",
    },
  },
];

export async function GET() {
  try {
    // Verify authentication
    await getCurrentWorkspace();

    return NextResponse.json({
      templates: AGENT_TEMPLATES,
      count: AGENT_TEMPLATES.length,
    });
  } catch (error) {
    return createErrorResponse(error, "Get agent templates error");
  }
}
