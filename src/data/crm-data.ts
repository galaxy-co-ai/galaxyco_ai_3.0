import { 
  Phone, 
  Mail, 
  Video, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle, 
  TrendingDown 
} from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  lastContact: string;
  status: "hot" | "warm" | "cold";
  value: string;
  interactions: number;
  aiHealthScore: number;
  aiInsight: string;
  nextAction: string;
  sentiment?: "positive" | "neutral" | "concerned";
  role?: string;
  location?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: "active" | "planning" | "completed";
  dueDate: string;
  progress: number;
  team: string[];
  budget: string;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  stage: "qualified" | "proposal" | "negotiation" | "closed";
  probability: number;
  closingDate: string;
  aiRisk?: "low" | "medium" | "high";
}

export interface InteractionActionItem {
  text: string;
  completed: boolean;
}

export interface Interaction {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  contactId: string;
  contact: string;
  date: string;
  duration?: string;
  summary: string;
  actionItems: InteractionActionItem[];
  status: "completed" | "planned" | "transcribing";
  sentiment?: "positive" | "neutral" | "negative";
}

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    company: "TechCorp Inc",
    email: "sarah.chen@techcorp.com",
    lastContact: "2 hours ago",
    status: "hot",
    value: "$45,000",
    interactions: 12,
    aiHealthScore: 92,
    aiInsight: "Highly engaged, mentioned budget approval. Key decision maker.",
    nextAction: "Send Q4 proposal by Friday",
    sentiment: "positive",
    role: "CTO",
    location: "San Francisco, CA",
    tags: ["Enterprise", "Decision Maker", "Tech"]
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    company: "InnovateLabs",
    email: "m.rodriguez@innovate.io",
    lastContact: "1 day ago",
    status: "warm",
    value: "$28,000",
    interactions: 8,
    aiHealthScore: 76,
    aiInsight: "Interested in API integrations but comparing competitors.",
    nextAction: "Schedule technical demo",
    sentiment: "neutral",
    role: "VP of Engineering",
    location: "Austin, TX",
    tags: ["SaaS", "High Growth"]
  },
  {
    id: "3",
    name: "Emma Thompson",
    company: "Global Systems",
    email: "e.thompson@globalsys.com",
    lastContact: "3 days ago",
    status: "warm",
    value: "$62,000",
    interactions: 15,
    aiHealthScore: 68,
    aiInsight: "Needs legal review on SLA terms. Process slowing down.",
    nextAction: "Forward compliance docs",
    sentiment: "concerned",
    role: "Procurement Director",
    location: "London, UK",
    tags: ["Enterprise", "International"]
  },
  {
    id: "4",
    name: "James Park",
    company: "StartupXYZ",
    email: "james@startup.xyz",
    lastContact: "1 week ago",
    status: "cold",
    value: "$12,000",
    interactions: 4,
    aiHealthScore: 42,
    aiInsight: "No response to last 2 follow-ups. Budget constraints likely.",
    nextAction: "Send nurture campaign",
    sentiment: "neutral",
    role: "Founder",
    location: "New York, NY",
    tags: ["Startup", "Seed Stage"]
  }
];

export const projects: Project[] = [
  {
    id: "1",
    name: "Cloud Migration",
    client: "TechCorp Inc",
    status: "active",
    dueDate: "Nov 15",
    progress: 65,
    team: ["JD", "AL", "RK"],
    budget: "$120k"
  },
  {
    id: "2",
    name: "API Implementation",
    client: "InnovateLabs",
    status: "planning",
    dueDate: "Dec 01",
    progress: 15,
    team: ["JD", "TS"],
    budget: "$45k"
  },
  {
    id: "3",
    name: "Security Audit",
    client: "Global Systems",
    status: "active",
    dueDate: "Oct 30",
    progress: 85,
    team: ["RK", "AL"],
    budget: "$35k"
  }
];

export const deals: Deal[] = [
  {
    id: "1",
    title: "Enterprise License Q4",
    company: "TechCorp Inc",
    value: "$45,000",
    stage: "negotiation",
    probability: 85,
    closingDate: "Oct 31",
    aiRisk: "low"
  },
  {
    id: "2",
    title: "API Platform Access",
    company: "InnovateLabs",
    value: "$28,000",
    stage: "proposal",
    probability: 60,
    closingDate: "Nov 15",
    aiRisk: "medium"
  },
  {
    id: "3",
    title: "Global Rollout",
    company: "Global Systems",
    value: "$62,000",
    stage: "negotiation",
    probability: 75,
    closingDate: "Dec 01",
    aiRisk: "high"
  },
  {
    id: "4",
    title: "Starter Plan",
    company: "StartupXYZ",
    value: "$12,000",
    stage: "qualified",
    probability: 40,
    closingDate: "Nov 30",
    aiRisk: "low"
  }
];

export const interactions: Interaction[] = [
  // Sarah Chen interactions (contactId: "1")
  {
    id: "1",
    type: "call",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Today, 2:30 PM",
    duration: "23 min",
    summary: "Discussed Q4 implementation timeline and budget allocation. Sarah expressed strong interest in expanding the partnership and mentioned their team is ready to move forward pending executive approval.",
    actionItems: [
      { text: "Send proposal by Friday", completed: false },
      { text: "Schedule tech review with team", completed: true }
    ],
    status: "completed",
    sentiment: "positive"
  },
  {
    id: "2",
    type: "email",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Yesterday, 4:15 PM",
    summary: "Received confirmation that the security questionnaire has been approved by their compliance team.",
    actionItems: [
      { text: "Upload countersigned NDA", completed: true }
    ],
    status: "completed",
    sentiment: "positive"
  },
  {
    id: "3",
    type: "meeting",
    contactId: "1",
    contact: "Sarah Chen",
    date: "2 days ago, 11:00 AM",
    duration: "45 min",
    summary: "Quarterly business review. Highlighted 150% ROI from current deployment. Sarah asked for case studies to share with the board.",
    actionItems: [
      { text: "Prepare ROI slide deck", completed: true },
      { text: "Share manufacturing case study", completed: true },
      { text: "Draft expansion contract", completed: false }
    ],
    status: "completed",
    sentiment: "positive"
  },
  {
    id: "4",
    type: "call",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Just now",
    summary: "Transcribing ongoing call...",
    actionItems: [],
    status: "transcribing"
  }
];

