import { Metadata } from "next";
import { VerticalTemplate, type VerticalPageData } from "@/components/vertical/VerticalTemplate";

export const metadata: Metadata = {
  title: "For Sales Teams & SDRs",
  description: "Close more deals by automatically qualifying leads, prioritizing pipeline, and handling outreach busywork — so reps spend time selling, not updating tools.",
};

const salesData: VerticalPageData = {
  badge: "For Sales Teams & SDRs",
  headline: "Focus on the Deals Most Likely to Close",
  subheadline: "GalaxyCo helps sales teams and SDRs close more deals by automatically qualifying leads, prioritizing pipeline, and handling outreach busywork — so reps spend time selling, not updating tools.",
  targetAudience: "Built for small to mid-sized B2B sales teams, SDR teams, and founder-led sales motions.",
  
  problems: [
    {
      title: "Leads aren't prioritized correctly",
      dayToDay: "Reps guessing who to contact first, treating all leads equally.",
      cost: "Low conversion rates and wasted effort.",
    },
    {
      title: "Pipeline visibility is unreliable",
      dayToDay: "Outdated CRM data, inaccurate forecasts, surprise misses.",
      cost: "Poor planning and missed revenue targets.",
    },
    {
      title: "Outreach is repetitive and time-consuming",
      dayToDay: "Manually writing emails, LinkedIn messages, and follow-ups.",
      cost: "Fewer touches and slower deal cycles.",
    },
  ],
  
  solutions: [
    {
      problem: "Unclear lead priority",
      solution: "Scores and ranks leads automatically based on behavior and context.",
      howItWorks: "The system tells reps who to contact next and why, with AI-generated insights.",
      result: "Higher-quality conversations and better win rates.",
    },
    {
      problem: "Messy pipeline data",
      solution: "Keeps deal stages, notes, and next steps up to date automatically.",
      howItWorks: "AI updates the pipeline as work happens — no manual data entry required.",
      result: "Clear visibility and more accurate forecasts.",
    },
    {
      problem: "Outreach overhead",
      solution: "Generates and manages outreach sequences across email and LinkedIn.",
      howItWorks: "AI drafts personalized messages, schedules follow-ups, and reminds reps to send.",
      result: "More touches with less effort.",
    },
  ],
  
  workflow: {
    title: "Turn Leads into Qualified Meetings",
    steps: [
      "Leads enter GalaxyCo from forms, imports, or manual entry",
      "AI scores and prioritizes the leads based on fit and behavior",
      "Personalized outreach sequences are drafted automatically",
      "Pipeline stages update automatically as reps engage",
      "Neptune surfaces daily selling priorities and next-best actions",
    ],
    outcome: "A prioritized pipeline, consistent outreach, and clear daily selling focus.",
  },
  
  features: [
    {
      icon: "Target",
      title: "AI Lead Scoring",
      description: "Automatically rank leads by likelihood to close with AI-powered scoring.",
    },
    {
      icon: "TrendingUp",
      title: "Pipeline Management",
      description: "Visual deal tracking with automatic updates as conversations progress.",
    },
    {
      icon: "MessageSquare",
      title: "Outreach Automation",
      description: "AI-drafted email and LinkedIn sequences personalized for each prospect.",
    },
    {
      icon: "Users",
      title: "CRM that Updates Itself",
      description: "Say goodbye to manual data entry — AI keeps records current automatically.",
    },
    {
      icon: "BarChart3",
      title: "Revenue Forecasting",
      description: "Accurate pipeline visibility and revenue forecasts based on real-time data.",
    },
    {
      icon: "Zap",
      title: "Daily Selling Priorities",
      description: "Neptune AI surfaces your most important actions every morning.",
    },
  ],
  
  testimonial: {
    quote: "GalaxyCo helps our reps focus on deals that actually close instead of busywork.",
    author: "Early Beta User",
    role: "VP Sales, B2B SaaS",
  },
  
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
};

export default function SalesPage() {
  return <VerticalTemplate data={salesData} />;
}
