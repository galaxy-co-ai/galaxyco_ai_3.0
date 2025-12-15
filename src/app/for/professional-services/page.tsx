import { Metadata } from "next";
import { VerticalTemplate, type VerticalPageData } from "@/components/vertical/VerticalTemplate";

export const metadata: Metadata = {
  title: "For Professional Services",
  description: "Reduce administrative overhead and protect client data by centralizing documents, workflows, and follow-ups in a secure, AI-assisted system.",
};

const professionalServicesData: VerticalPageData = {
  badge: "For Professional Services",
  headline: "Keep Client Records Clean, Secure, and Audit-Ready",
  subheadline: "GalaxyCo helps professional service firms reduce administrative overhead and protect client data by centralizing documents, workflows, and follow-ups in a secure, AI-assisted system — so more time is spent on billable work.",
  targetAudience: "Built for accounting firms, law firms, bookkeeping services, and compliance-focused professional practices.",
  
  problems: [
    {
      title: "Client documents are scattered and hard to manage",
      dayToDay: "Files across email, local folders, cloud drives, and multiple portals.",
      cost: "Lost documents, version confusion, and compliance risk.",
    },
    {
      title: "Administrative work eats into billable hours",
      dayToDay: "Manual follow-ups, status updates, and repetitive paperwork.",
      cost: "Lower margins and longer workdays.",
    },
    {
      title: "Compliance and data security create constant pressure",
      dayToDay: "Worrying about access control, audit trails, and client trust.",
      cost: "Risk exposure and reputational damage.",
    },
  ],
  
  solutions: [
    {
      problem: "Disorganized client documents",
      solution: "Centralizes client documents, conversations, and records in one secure workspace.",
      howItWorks: "Every client has a single, secure source of truth with version control and audit trails.",
      result: "Faster access, fewer mistakes, and cleaner audits.",
    },
    {
      problem: "Excessive admin overhead",
      solution: "Automates reminders, follow-ups, and routine documentation tasks.",
      howItWorks: "AI handles the repeatable steps while you focus on expertise-driven work.",
      result: "More billable hours without extending your workday.",
    },
    {
      problem: "Compliance and security concerns",
      solution: "Provides structured access controls and traceable workflows.",
      howItWorks: "The right people see the right information at the right time with full audit logging.",
      result: "Increased client trust and reduced compliance anxiety.",
    },
  ],
  
  workflow: {
    title: "Manage a Client Engagement from Intake to Service",
    steps: [
      "Create a secure client workspace with proper access controls",
      "Upload and organize client documents with automatic categorization",
      "AI tracks tasks, deadlines, and required follow-ups",
      "Ongoing notes and records are automatically stored with timestamps",
      "Status and documentation ready for review or audit at any time",
    ],
    outcome: "A compliant, well-documented client record with minimal manual effort.",
  },
  
  features: [
    {
      icon: "FolderLock",
      title: "Secure Document Management",
      description: "Bank-level encryption for all client documents with version control and audit trails.",
    },
    {
      icon: "Shield",
      title: "Access Controls",
      description: "Role-based permissions ensure only authorized users access sensitive information.",
    },
    {
      icon: "FileText",
      title: "Client Workspaces",
      description: "Dedicated, organized spaces for each client with all documents and communications.",
    },
    {
      icon: "Clock",
      title: "Task & Deadline Tracking",
      description: "Automated reminders for client deadlines, renewals, and compliance requirements.",
    },
    {
      icon: "CheckCircle2",
      title: "Audit-Ready Records",
      description: "Complete audit trails and timestamped records for compliance and review.",
    },
    {
      icon: "AlertCircle",
      title: "Compliance Monitoring",
      description: "Track compliance requirements and get alerts for upcoming deadlines.",
    },
  ],
  
  testimonial: {
    quote: "GalaxyCo keeps our client records clean and audit-ready without the manual overhead.",
    author: "Early Beta User",
    role: "Partner, Accounting Firm",
  },
  
  ctaPrimary: "Start Free",
  ctaSecondary: "See How It Works",
};

export default function ProfessionalServicesPage() {
  return <VerticalTemplate data={professionalServicesData} />;
}
