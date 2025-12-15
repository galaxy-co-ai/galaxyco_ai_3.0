import { Metadata } from "next";
import { VerticalTemplate, type VerticalPageData } from "@/components/vertical/VerticalTemplate";

export const metadata: Metadata = {
  title: "For B2B SaaS & Tech Startups",
  description: "Generate, qualify, and close more revenue by automating RevOps and GTM workflows with AI — without hiring more SDRs or stitching together five tools.",
};

const saasData: VerticalPageData = {
  badge: "For B2B SaaS & Tech Startups",
  headline: "Scale Revenue Without Scaling Headcount",
  subheadline: "GalaxyCo helps B2B SaaS teams generate, qualify, and close more revenue by automating RevOps and GTM workflows with AI — without hiring more SDRs or stitching together five tools.",
  targetAudience: "Built for Seed to Series B B2B SaaS startups with small sales, marketing, or founder-led GTM teams.",
  
  problems: [
    {
      title: "Revenue operations are fragmented across too many tools",
      dayToDay: "CRM in one place, outreach in another, notes in Notion, follow-ups in Slack, and no single source of truth.",
      cost: "Missed leads, poor attribution, slow decision-making, and tool fatigue.",
    },
    {
      title: "Leads don't get followed up fast or consistently enough",
      dayToDay: "Inbound leads sit untouched, outbound follow-ups slip, and reps work off memory instead of systems.",
      cost: "Lower conversion rates, lost pipeline, and wasted marketing spend.",
    },
    {
      title: "Scaling outbound requires hiring SDRs too early",
      dayToDay: "Founders or AEs manually prospecting, writing repetitive emails, and updating CRM instead of closing.",
      cost: "Burnout, slow growth, and premature headcount costs.",
    },
  ],
  
  solutions: [
    {
      problem: "Fragmented RevOps",
      solution: "Centralizes CRM, workflows, agents, and GTM context into one AI-native system.",
      howItWorks: "GalaxyCo becomes the operational brain — contacts, deals, conversations, and actions all live together.",
      result: "Clear pipeline visibility and less context switching.",
    },
    {
      problem: "Slow or inconsistent follow-up",
      solution: "Uses AI agents to score leads, trigger follow-ups, and surface next-best actions.",
      howItWorks: "When a lead comes in, the system knows what to do next — and does it for you.",
      result: "Faster response times and higher lead-to-meeting conversion.",
    },
    {
      problem: "Needing more SDRs to scale",
      solution: "Automates repetitive GTM tasks traditionally handled by SDRs.",
      howItWorks: "AI agents research, qualify, draft outreach, and keep CRM updated so humans focus on closing.",
      result: "Scale outbound motion without scaling headcount.",
    },
  ],
  
  workflow: {
    title: "Turn a New Lead into a Qualified Opportunity",
    steps: [
      "A new lead enters GalaxyCo (form fill, import, or manual entry)",
      "An AI agent enriches and scores the lead automatically",
      "The agent drafts and schedules a personalized follow-up",
      "Deal and notes are created in the pipeline automatically",
      "Neptune surfaces next actions to the founder or AE",
    ],
    outcome: "A clean pipeline, qualified leads, and clear next steps — without manual busywork.",
  },
  
  features: [
    {
      icon: "Target",
      title: "AI Lead Scoring",
      description: "Automatically score and prioritize leads based on behavior, fit, and engagement signals.",
    },
    {
      icon: "Workflow",
      title: "Deal Pipeline",
      description: "Visual pipeline management with automated stage progression and deal tracking.",
    },
    {
      icon: "Zap",
      title: "AI-Assisted Follow-ups",
      description: "Neptune drafts personalized outreach and schedules follow-ups automatically.",
    },
    {
      icon: "Users",
      title: "Unified CRM",
      description: "All contacts, deals, and conversations in one place with full context.",
    },
    {
      icon: "BarChart3",
      title: "RevOps Insights",
      description: "Real-time visibility into pipeline health, conversion rates, and team performance.",
    },
    {
      icon: "TrendingUp",
      title: "Workflow Automation",
      description: "Automate repetitive GTM tasks and let AI agents handle the busywork.",
    },
  ],
  
  testimonial: {
    quote: "GalaxyCo replaced three tools for us and saved our team 15+ hours per week.",
    author: "Early Beta User",
    role: "Founder, B2B SaaS Startup",
  },
  
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
};

export default function SaaSPage() {
  return <VerticalTemplate data={saasData} />;
}
