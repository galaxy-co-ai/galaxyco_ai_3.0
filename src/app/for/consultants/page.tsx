import { Metadata } from "next";
import { VerticalTemplate, type VerticalPageData } from "@/components/vertical/VerticalTemplate";

export const metadata: Metadata = {
  title: "For Consultants & Coaches",
  description: "Manage clients, follow-ups, and delivery effortlessly by letting AI handle the busywork — so you can focus on outcomes, not admin.",
};

const consultantsData: VerticalPageData = {
  badge: "For Consultants & Coaches",
  headline: "Never Forget a Follow-Up Again",
  subheadline: "GalaxyCo helps consultants and coaches manage clients, follow-ups, and delivery effortlessly by letting AI handle the busywork — so you can focus on outcomes, not admin.",
  targetAudience: "Built for independent consultants, coaches, fractional executives, and small advisory firms running multiple clients.",
  
  problems: [
    {
      title: "CRMs are overkill and rarely kept up to date",
      dayToDay: "Notes in notebooks, follow-ups in email, pipelines forgotten.",
      cost: "Missed renewals, weak relationships, and lost referrals.",
    },
    {
      title: "Client knowledge is scattered and not reusable",
      dayToDay: "Re-explaining context every engagement, hunting for past documents.",
      cost: "Slower delivery and less leverage from prior work.",
    },
    {
      title: "Admin work steals time from billable work",
      dayToDay: "Writing proposals, scheduling calls, sending reminders manually.",
      cost: "Lower effective hourly rate and burnout.",
    },
  ],
  
  solutions: [
    {
      problem: "CRM nobody wants to maintain",
      solution: "Keeps client records, notes, and next steps updated automatically.",
      howItWorks: "You talk to clients — GalaxyCo remembers and organizes everything for you.",
      result: "A CRM that stays current without manual data entry.",
    },
    {
      problem: "Lost client knowledge",
      solution: "Builds a living knowledge base for each client engagement.",
      howItWorks: "Every conversation, document, and decision compounds over time in searchable history.",
      result: "Faster onboarding and smarter repeat engagements.",
    },
    {
      problem: "Too much admin work",
      solution: "Automates proposals, documents, scheduling, and follow-ups.",
      howItWorks: "AI drafts proposals, schedules meetings, and reminds you — you just approve.",
      result: "More billable hours with less effort.",
    },
  ],
  
  workflow: {
    title: "Turn a Lead into an Active Client",
    steps: [
      "New lead is added to GalaxyCo from consultation call",
      "AI captures call notes and suggests next steps",
      "Proposal draft is generated automatically based on discussion",
      "Follow-ups and scheduling are handled by AI agents",
      "Client workspace and knowledge base are created upon acceptance",
    ],
    outcome: "An engaged client, clear next steps, and zero forgotten follow-ups.",
  },
  
  features: [
    {
      icon: "Users",
      title: "Effortless CRM",
      description: "Client records that stay updated automatically as you work.",
    },
    {
      icon: "Brain",
      title: "Client Knowledge Base",
      description: "Searchable history of every conversation, document, and decision per client.",
    },
    {
      icon: "FileText",
      title: "Proposal Generation",
      description: "AI drafts professional proposals based on your consultation notes.",
    },
    {
      icon: "Calendar",
      title: "Smart Scheduling",
      description: "Automated meeting scheduling and follow-up reminders.",
    },
    {
      icon: "Clock",
      title: "Time Tracking",
      description: "Track billable time and client engagements automatically.",
    },
    {
      icon: "CheckCircle2",
      title: "Follow-Up Automation",
      description: "Never miss a client check-in or renewal conversation.",
    },
  ],
  
  testimonial: {
    quote: "GalaxyCo gives me hours back every week and I never lose track of client context.",
    author: "Early Beta User",
    role: "Independent Consultant",
  },
  
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
};

export default function ConsultantsPage() {
  return <VerticalTemplate data={consultantsData} />;
}
