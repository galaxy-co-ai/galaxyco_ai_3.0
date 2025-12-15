import { Metadata } from "next";
import { VerticalTemplate, type VerticalPageData } from "@/components/vertical/VerticalTemplate";

export const metadata: Metadata = {
  title: "For Marketing & Creative Agencies",
  description: "Deliver more client work, faster, by turning content, campaigns, and reporting into AI-powered systems — without increasing headcount.",
};

const agenciesData: VerticalPageData = {
  badge: "For Marketing & Creative Agencies",
  headline: "Deliver More Client Work Without Burning Out",
  subheadline: "GalaxyCo helps agencies deliver more client work, faster, by turning content, campaigns, and reporting into AI-powered systems — without increasing headcount.",
  targetAudience: "Built for agencies managing multiple clients and recurring campaigns, boutique studios, and fractional CMOs.",
  
  problems: [
    {
      title: "Content does not scale",
      dayToDay: "Starting from blank pages repeatedly for every client campaign.",
      cost: "Burnout and slow delivery timelines.",
    },
    {
      title: "Campaign execution is scattered",
      dayToDay: "Spreadsheets, Slack messages, and Notion chaos across multiple client projects.",
      cost: "Missed deadlines and unhappy clients.",
    },
    {
      title: "Manual client reporting",
      dayToDay: "Copy-pasting metrics into decks and manually creating status reports.",
      cost: "Lost billable hours every week.",
    },
  ],
  
  solutions: [
    {
      problem: "Content doesn't scale",
      solution: "AI agents generate first drafts and content starting points for every campaign.",
      howItWorks: "Describe your campaign or content need, and AI creates the foundation you can polish.",
      result: "Faster content delivery with less creative block.",
    },
    {
      problem: "Campaign chaos",
      solution: "Structured client workspaces and repeatable campaign systems.",
      howItWorks: "Each client gets a dedicated workspace with templates, workflows, and centralized tracking.",
      result: "Clear visibility and on-time delivery.",
    },
    {
      problem: "Reporting overhead",
      solution: "Automated client-ready reports generated from campaign data.",
      howItWorks: "System automatically compiles metrics, insights, and summaries into shareable reports.",
      result: "More billable hours, happier clients.",
    },
  ],
  
  workflow: {
    title: "Launch and Report on a Client Campaign",
    steps: [
      "Create a dedicated client workspace in GalaxyCo",
      "AI generates content drafts for the campaign",
      "Execute campaign tasks with workflow tracking",
      "Track progress centrally across all deliverables",
      "Send automated campaign report to client",
    ],
    outcome: "Efficient campaign execution with professional reporting — no manual busywork.",
  },
  
  features: [
    {
      icon: "FileText",
      title: "AI Content Generation",
      description: "Generate blog posts, social copy, email campaigns, and creative briefs in seconds.",
    },
    {
      icon: "Users",
      title: "Client Workspaces",
      description: "Dedicated spaces for each client with all campaigns, content, and conversations.",
    },
    {
      icon: "Rocket",
      title: "Campaign Workflows",
      description: "Track deliverables, deadlines, and approvals in one visual system.",
    },
    {
      icon: "Calendar",
      title: "Content Calendar",
      description: "Plan, schedule, and visualize content across all client campaigns.",
    },
    {
      icon: "BarChart3",
      title: "Automated Reporting",
      description: "Client-ready performance reports generated automatically from campaign data.",
    },
    {
      icon: "Palette",
      title: "Brand Management",
      description: "Store brand guidelines, assets, and voice for consistent client work.",
    },
  ],
  
  testimonial: {
    quote: "We're delivering twice as many campaigns with the same team size.",
    author: "Early Beta User",
    role: "Creative Director, Digital Agency",
  },
  
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
};

export default function AgenciesPage() {
  return <VerticalTemplate data={agenciesData} />;
}
