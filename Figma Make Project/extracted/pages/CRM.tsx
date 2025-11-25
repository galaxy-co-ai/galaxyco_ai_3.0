import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  Video,
  FileText,
  CheckCircle2,
  Circle,
  MoreVertical,
  Play,
  Pause,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Sparkles,
  AlertCircle,
  TrendingDown,
  Zap,
  Target,
  Briefcase,
  Users,
  Flag,
  ListTodo,
  Activity,
  FolderOpen,
  Edit
} from "lucide-react";

interface Contact {
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
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: "active" | "planning" | "completed";
  progress: number;
  dueDate: string;
  team: string[];
  budget: string;
  spent: string;
  description: string;
  startDate: string;
  tasks: {
    id: string;
    title: string;
    status: "completed" | "in-progress" | "pending";
    assignee: string;
    dueDate: string;
  }[];
  milestones: {
    id: string;
    title: string;
    date: string;
    completed: boolean;
  }[];
  updates: {
    id: string;
    author: string;
    date: string;
    content: string;
  }[];
}

interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  stage: "discovery" | "proposal" | "negotiation" | "closed";
  probability: number;
  closeDate: string;
  aiRisk?: "low" | "medium" | "high";
}

interface Interaction {
  id: string;
  type: "call" | "email" | "meeting";
  contactId: string;
  contact: string;
  date: string;
  duration?: string;
  summary: string;
  actionItems: { text: string; completed: boolean; }[];
  status: "transcribing" | "completed";
  sentiment?: "positive" | "neutral" | "negative";
  transcript?: string;
}

const contacts: Contact[] = [
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
    aiInsight: "Highly engaged, mentioned budget approval",
    nextAction: "Send Q4 proposal by Friday",
    sentiment: "positive"
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    company: "InnovateLabs",
    email: "m.rodriguez@innovatelabs.com",
    lastContact: "Yesterday",
    status: "warm",
    value: "$28,000",
    interactions: 8,
    aiHealthScore: 76,
    aiInsight: "Interested in API integrations",
    nextAction: "Share technical documentation",
    sentiment: "neutral"
  },
  {
    id: "3",
    name: "Emma Thompson",
    company: "Global Systems",
    email: "emma.t@globalsys.com",
    lastContact: "3 days ago",
    status: "warm",
    value: "$62,000",
    interactions: 15,
    aiHealthScore: 68,
    aiInsight: "Needs legal review on SLA terms",
    nextAction: "Schedule call for Thursday",
    sentiment: "concerned"
  },
  {
    id: "4",
    name: "James Park",
    company: "StartupXYZ",
    email: "james@startupxyz.io",
    lastContact: "1 week ago",
    status: "cold",
    value: "$15,000",
    interactions: 4,
    aiHealthScore: 42,
    aiInsight: "No response to last 2 follow-ups",
    nextAction: "Re-engage with value proposition",
    sentiment: "neutral"
  }
];

const projects: Project[] = [
  {
    id: "1",
    name: "TechCorp Implementation",
    client: "TechCorp Inc",
    status: "active",
    progress: 65,
    dueDate: "Dec 15, 2025",
    startDate: "Oct 1, 2025",
    team: ["SC", "MR"],
    budget: "$45,000",
    spent: "$29,250",
    description: "Full-scale implementation of GalaxyCo.ai platform including AI Assistant, Knowledge Base, and CRM integration for TechCorp's 150+ employees.",
    tasks: [
      {
        id: "1",
        title: "Complete data migration from legacy CRM",
        status: "completed",
        assignee: "SC",
        dueDate: "Nov 1, 2025"
      },
      {
        id: "2",
        title: "Set up AI agent workflows for sales team",
        status: "in-progress",
        assignee: "MR",
        dueDate: "Nov 10, 2025"
      },
      {
        id: "3",
        title: "Configure knowledge base structure",
        status: "in-progress",
        assignee: "SC",
        dueDate: "Nov 15, 2025"
      },
      {
        id: "4",
        title: "User training sessions (3 sessions)",
        status: "pending",
        assignee: "MR",
        dueDate: "Dec 1, 2025"
      },
      {
        id: "5",
        title: "Final testing and QA",
        status: "pending",
        assignee: "SC",
        dueDate: "Dec 10, 2025"
      }
    ],
    milestones: [
      {
        id: "1",
        title: "Kickoff Meeting",
        date: "Oct 1, 2025",
        completed: true
      },
      {
        id: "2",
        title: "Data Migration Complete",
        date: "Nov 1, 2025",
        completed: true
      },
      {
        id: "3",
        title: "Core Features Deployed",
        date: "Nov 15, 2025",
        completed: false
      },
      {
        id: "4",
        title: "Training Complete",
        date: "Dec 1, 2025",
        completed: false
      },
      {
        id: "5",
        title: "Go-Live",
        date: "Dec 15, 2025",
        completed: false
      }
    ],
    updates: [
      {
        id: "1",
        author: "Sarah Chen",
        date: "Today, 3:00 PM",
        content: "Data migration completed successfully. All 5,000+ customer records transferred with zero data loss. Team is pleased with the results."
      },
      {
        id: "2",
        author: "Michael Rodriguez",
        date: "Yesterday, 11:30 AM",
        content: "Started configuring AI workflows for the sales team. Initial feedback is very positive - they're excited about the automation capabilities."
      },
      {
        id: "3",
        author: "Sarah Chen",
        date: "2 days ago, 4:15 PM",
        content: "Completed initial setup and configuration. Platform is ready for data migration phase."
      }
    ]
  },
  {
    id: "2",
    name: "InnovateLabs Integration",
    client: "InnovateLabs",
    status: "planning",
    progress: 20,
    dueDate: "Jan 30, 2026",
    startDate: "Nov 15, 2025",
    team: ["MR"],
    budget: "$28,000",
    spent: "$5,600",
    description: "API integration project to connect GalaxyCo.ai with InnovateLabs' existing tech stack including Salesforce, Slack, and custom internal tools.",
    tasks: [
      {
        id: "1",
        title: "API documentation review",
        status: "completed",
        assignee: "MR",
        dueDate: "Nov 10, 2025"
      },
      {
        id: "2",
        title: "Architecture design and approval",
        status: "in-progress",
        assignee: "MR",
        dueDate: "Nov 20, 2025"
      },
      {
        id: "3",
        title: "Salesforce integration development",
        status: "pending",
        assignee: "MR",
        dueDate: "Dec 15, 2025"
      },
      {
        id: "4",
        title: "Slack bot integration",
        status: "pending",
        assignee: "MR",
        dueDate: "Jan 10, 2026"
      }
    ],
    milestones: [
      {
        id: "1",
        title: "Project Kickoff",
        date: "Nov 15, 2025",
        completed: false
      },
      {
        id: "2",
        title: "Architecture Approved",
        date: "Nov 20, 2025",
        completed: false
      },
      {
        id: "3",
        title: "Salesforce Integration Live",
        date: "Dec 20, 2025",
        completed: false
      },
      {
        id: "4",
        title: "Full Integration Complete",
        date: "Jan 30, 2026",
        completed: false
      }
    ],
    updates: [
      {
        id: "1",
        author: "Michael Rodriguez",
        date: "Today, 10:00 AM",
        content: "Meeting with InnovateLabs tech team went well. They're eager to get started and have all API docs ready."
      }
    ]
  },
  {
    id: "3",
    name: "Global Systems Rollout",
    client: "Global Systems",
    status: "active",
    progress: 85,
    dueDate: "Nov 20, 2025",
    startDate: "Sep 1, 2025",
    team: ["ET", "JP"],
    budget: "$62,000",
    spent: "$52,700",
    description: "Enterprise rollout of GalaxyCo.ai across Global Systems' 5 regional offices with custom workflows and multi-language support.",
    tasks: [
      {
        id: "1",
        title: "Deploy to North America office",
        status: "completed",
        assignee: "ET",
        dueDate: "Sep 15, 2025"
      },
      {
        id: "2",
        title: "Deploy to Europe office",
        status: "completed",
        assignee: "JP",
        dueDate: "Oct 1, 2025"
      },
      {
        id: "3",
        title: "Deploy to Asia-Pacific offices",
        status: "completed",
        assignee: "ET",
        dueDate: "Oct 20, 2025"
      },
      {
        id: "4",
        title: "Finalize SLA documentation",
        status: "in-progress",
        assignee: "ET",
        dueDate: "Nov 15, 2025"
      },
      {
        id: "5",
        title: "Final sign-off and handover",
        status: "pending",
        assignee: "JP",
        dueDate: "Nov 20, 2025"
      }
    ],
    milestones: [
      {
        id: "1",
        title: "Contract Signed",
        date: "Sep 1, 2025",
        completed: true
      },
      {
        id: "2",
        title: "Phase 1 Rollout Complete",
        date: "Sep 15, 2025",
        completed: true
      },
      {
        id: "3",
        title: "Phase 2 Rollout Complete",
        date: "Oct 1, 2025",
        completed: true
      },
      {
        id: "4",
        title: "All Regions Deployed",
        date: "Oct 20, 2025",
        completed: true
      },
      {
        id: "5",
        title: "Project Complete",
        date: "Nov 20, 2025",
        completed: false
      }
    ],
    updates: [
      {
        id: "1",
        author: "Emma Thompson",
        date: "Yesterday, 4:15 PM",
        content: "Working on final SLA revisions with their legal team. Should have everything finalized by Thursday."
      },
      {
        id: "2",
        author: "James Park",
        date: "3 days ago, 2:00 PM",
        content: "Asia-Pacific deployment completed successfully. All regional teams are now live on the platform."
      },
      {
        id: "3",
        author: "Emma Thompson",
        date: "1 week ago, 10:00 AM",
        content: "Europe office deployment went smoothly. Positive feedback from the teams there."
      }
    ]
  }
];

const deals: Deal[] = [
  {
    id: "1",
    title: "Enterprise License",
    company: "TechCorp Inc",
    value: "$45,000",
    stage: "negotiation",
    probability: 85,
    closeDate: "Nov 30, 2025",
    aiRisk: "low"
  },
  {
    id: "2",
    title: "API Integration Package",
    company: "InnovateLabs",
    value: "$28,000",
    stage: "proposal",
    probability: 60,
    closeDate: "Dec 15, 2025",
    aiRisk: "medium"
  },
  {
    id: "3",
    title: "Custom Development",
    company: "Global Systems",
    value: "$62,000",
    stage: "negotiation",
    probability: 70,
    closeDate: "Dec 1, 2025",
    aiRisk: "medium"
  }
];

const interactions: Interaction[] = [
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
      { text: "Schedule technical demo for next week", completed: false },
      { text: "Connect with their CTO", completed: true }
    ],
    status: "completed",
    sentiment: "positive",
    transcript: "Full transcript available..."
  },
  {
    id: "2",
    type: "email",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Yesterday, 9:15 AM",
    summary: "Sarah requested additional information about our enterprise security features and compliance certifications for their legal team review.",
    actionItems: [
      { text: "Send SOC 2 compliance documentation", completed: true },
      { text: "Prepare security whitepaper", completed: false }
    ],
    status: "completed",
    sentiment: "neutral"
  },
  {
    id: "3",
    type: "meeting",
    contactId: "1",
    contact: "Sarah Chen",
    date: "3 days ago, 3:00 PM",
    duration: "45 min",
    summary: "Initial discovery call. Discussed their current pain points with manual workflow processes and explored how our AI agents could help automate repetitive tasks.",
    actionItems: [
      { text: "Send product demo recording", completed: true },
      { text: "Share case studies from similar companies", completed: true }
    ],
    status: "completed",
    sentiment: "positive"
  },
  {
    id: "4",
    type: "call",
    contactId: "1",
    contact: "Sarah Chen",
    date: "1 week ago, 11:30 AM",
    duration: "15 min",
    summary: "Quick introductory call. Sarah mentioned TechCorp is actively looking for AI solutions to improve team productivity.",
    actionItems: [
      { text: "Schedule full product demo", completed: true }
    ],
    status: "completed",
    sentiment: "positive"
  },
  
  // Michael Rodriguez interactions (contactId: "2")
  {
    id: "5",
    type: "meeting",
    contactId: "2",
    contact: "Michael Rodriguez",
    date: "Today, 10:00 AM",
    duration: "45 min",
    summary: "Product roadmap review meeting. Discussed feature priorities and integration requirements with their existing tech stack.",
    actionItems: [
      { text: "Share API documentation", completed: false },
      { text: "Provide pricing for enterprise tier", completed: false }
    ],
    status: "transcribing",
    sentiment: "neutral"
  },
  {
    id: "6",
    type: "email",
    contactId: "2",
    contact: "Michael Rodriguez",
    date: "2 days ago, 2:00 PM",
    summary: "Michael asked about our API rate limits and webhook capabilities for real-time data sync.",
    actionItems: [
      { text: "Schedule technical deep-dive call", completed: true }
    ],
    status: "completed",
    sentiment: "neutral"
  },
  
  // Emma Thompson interactions (contactId: "3")
  {
    id: "7",
    type: "email",
    contactId: "3",
    contact: "Emma Thompson",
    date: "Yesterday, 4:15 PM",
    summary: "Follow-up on contract negotiations. Emma requested revisions to SLA terms, specifically around uptime guarantees and support response times.",
    actionItems: [
      { text: "Review SLA with legal team", completed: false },
      { text: "Schedule call for Thursday", completed: false }
    ],
    status: "completed",
    sentiment: "neutral"
  },
  {
    id: "8",
    type: "call",
    contactId: "3",
    contact: "Emma Thompson",
    date: "5 days ago, 1:00 PM",
    duration: "30 min",
    summary: "Contract review call. Emma's legal team raised concerns about data residency requirements and requested clarifications.",
    actionItems: [
      { text: "Provide data residency documentation", completed: true },
      { text: "Connect with their legal counsel", completed: false }
    ],
    status: "completed",
    sentiment: "neutral"
  },
  
  // James Park interactions (contactId: "4")
  {
    id: "9",
    type: "email",
    contactId: "4",
    contact: "James Park",
    date: "1 week ago, 10:00 AM",
    summary: "Sent follow-up email with pricing information and implementation timeline. No response yet.",
    actionItems: [
      { text: "Wait for response", completed: false },
      { text: "Follow up next week if no reply", completed: false }
    ],
    status: "completed",
    sentiment: "neutral"
  },
  {
    id: "10",
    type: "call",
    contactId: "4",
    contact: "James Park",
    date: "2 weeks ago, 4:30 PM",
    duration: "20 min",
    summary: "Initial outreach call. James seemed interested but mentioned budget constraints for this quarter.",
    actionItems: [
      { text: "Send proposal with flexible payment terms", completed: true }
    ],
    status: "completed",
    sentiment: "neutral"
  }
];

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");
  const [selectedContact, setSelectedContact] = useState<string | null>("1");
  const [selectedProject, setSelectedProject] = useState<string | null>("1");
  const [selectedDeal, setSelectedDeal] = useState<string | null>("1");
  const [contactsOverviewSearch, setContactsOverviewSearch] = useState("");
  const [contactsStatusFilter, setContactsStatusFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [contactsSentimentFilter, setContactsSentimentFilter] = useState<"all" | "positive" | "neutral" | "concerned">("all");
  const [interactionActionItems, setInteractionActionItems] = useState<Record<string, boolean[]>>(
    interactions.reduce((acc, interaction) => {
      acc[interaction.id] = interaction.actionItems.map(item => item.completed);
      return acc;
    }, {} as Record<string, boolean[]>)
  );

  const toggleActionItem = (interactionId: string, itemIndex: number) => {
    setInteractionActionItems(prev => ({
      ...prev,
      [interactionId]: prev[interactionId].map((completed, idx) => 
        idx === itemIndex ? !completed : completed
      )
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warm": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "cold": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call": return Phone;
      case "email": return Mail;
      case "meeting": return Video;
      default: return MessageSquare;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return { icon: TrendingUp, color: "text-green-500" };
      case "concerned": return { icon: AlertCircle, color: "text-orange-500" };
      default: return { icon: TrendingDown, color: "text-muted-foreground" };
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getAvatarGradient = (contactId: string) => {
    const gradients = [
      { bg: "from-blue-500 via-blue-600 to-cyan-600", ring: "ring-blue-400/50", shadow: "shadow-blue-500/20" },
      { bg: "from-purple-500 via-purple-600 to-pink-600", ring: "ring-purple-400/50", shadow: "shadow-purple-500/20" },
      { bg: "from-orange-500 via-orange-600 to-red-600", ring: "ring-orange-400/50", shadow: "shadow-orange-500/20" },
      { bg: "from-green-500 via-green-600 to-emerald-600", ring: "ring-green-400/50", shadow: "shadow-green-500/20" },
      { bg: "from-pink-500 via-pink-600 to-rose-600", ring: "ring-pink-400/50", shadow: "shadow-pink-500/20" },
      { bg: "from-cyan-500 via-cyan-600 to-teal-600", ring: "ring-cyan-400/50", shadow: "shadow-cyan-500/20" }
    ];
    const index = parseInt(contactId) - 1;
    return gradients[index % gradients.length];
  };

  const transcribingCount = interactions.filter(i => i.status === "transcribing").length;
  const [aiActivityExpanded, setAiActivityExpanded] = useState(true);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto pb-32">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl mb-2">AI-Native CRM</h1>
            <p className="text-muted-foreground">
              Auto-transcribe and organize calls, meetings, and emails with AI-powered insights
            </p>
          </div>

          {/* AI Activity Banner */}
          {transcribingCount > 0 && (
            <Card className="p-3 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-blue-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm relative">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">AI is working: </span>
                    Transcribing {transcribingCount} {transcribingCount === 1 ? 'interaction' : 'interactions'} and extracting action items
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-0 shadow-sm h-6">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Card className="px-3 py-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs text-muted-foreground leading-none">Contacts</span>
                  </div>
                  <span className="leading-none">248</span>
                </div>
                <span className="flex items-center gap-0.5 text-green-600 text-xs flex-shrink-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +12%
                </span>
              </div>
            </Card>

            <Card className="px-3 py-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-muted-foreground leading-none">Pipeline</span>
                  </div>
                  <span className="leading-none">$1.2M</span>
                </div>
                <span className="flex items-center gap-0.5 text-green-600 text-xs flex-shrink-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +8%
                </span>
              </div>
            </Card>

            <Card className="px-3 py-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs text-muted-foreground leading-none">This Week</span>
                  </div>
                  <span className="leading-none">38</span>
                </div>
                <span className="flex items-center gap-0.5 text-green-600 text-xs flex-shrink-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +24%
                </span>
              </div>
            </Card>

            <Card className="px-3 py-2 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-xs text-muted-foreground leading-none">Hot Leads</span>
                  </div>
                  <span className="leading-none">12</span>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs h-5 px-1.5 flex-shrink-0">
                  Active
                </Badge>
              </div>
            </Card>

            <Card className="px-3 py-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                    <span className="text-xs text-muted-foreground leading-none">Avg Response</span>
                  </div>
                  <span className="leading-none">2.4h</span>
                </div>
                <span className="flex items-center gap-0.5 text-green-600 text-xs flex-shrink-0">
                  <TrendingDown className="h-2.5 w-2.5" />
                  -15%
                </span>
              </div>
            </Card>

            <Card className="px-3 py-2 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-cyan-600" />
                    <span className="text-xs text-muted-foreground leading-none">Win Rate</span>
                  </div>
                  <span className="leading-none">68%</span>
                </div>
                <span className="flex items-center gap-0.5 text-green-600 text-xs flex-shrink-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  +5%
                </span>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar with Tabs */}
        <Card className="lg:col-span-1 p-0 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-0 rounded-2xl overflow-hidden">
          {/* Tab Bar */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={activeTab === "contacts" ? "default" : "ghost"}
                size="sm"
                className="h-8 flex-1"
                onClick={() => {
                  setActiveTab("contacts");
                  setSelectedContact(null);
                }}
              >
                <User className="h-4 w-4 mr-1.5" />
                Contacts
              </Button>
              <Button
                variant={activeTab === "projects" ? "default" : "ghost"}
                size="sm"
                className="h-8 flex-1"
                onClick={() => setActiveTab("projects")}
              >
                <Briefcase className="h-4 w-4 mr-1.5" />
                Projects
              </Button>
              <Button
                variant={activeTab === "sales" ? "default" : "ghost"}
                size="sm"
                className="h-8 flex-1"
                onClick={() => setActiveTab("sales")}
              >
                <Target className="h-4 w-4 mr-1.5" />
                Sales
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* Contacts View */}
            {activeTab === "contacts" && (
              <div className="p-2">
                {contacts.map((contact) => {
                  const sentimentData = getSentimentIcon(contact.sentiment);
                  const SentimentIcon = sentimentData.icon;
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact.id)}
                      className={`w-full p-3 rounded-xl transition-all text-left mb-2 ${
                        selectedContact === contact.id 
                          ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] scale-[1.02]" 
                          : "hover:bg-white/50 hover:shadow-[0_2px_10px_rgb(0,0,0,0.04)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {(() => {
                          const avatarStyle = getAvatarGradient(contact.id);
                          return (
                            <div className="relative group/avatar">
                              <Avatar className={`h-10 w-10 ring-2 ${avatarStyle.ring} shadow-lg ${avatarStyle.shadow} transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:shadow-xl`}>
                                <AvatarFallback className={`bg-gradient-to-br ${avatarStyle.bg} text-white font-semibold`}>
                                  {contact.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              {/* Status indicator */}
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                                contact.status === 'hot' ? 'bg-red-500' : 
                                contact.status === 'warm' ? 'bg-orange-500' : 
                                'bg-blue-400'
                              }`} />
                            </div>
                          );
                        })()}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate">{contact.name}</p>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 ${getHealthScoreColor(contact.aiHealthScore)}`}>
                                    <Sparkles className="h-3 w-3" />
                                    <span className="text-xs">{contact.aiHealthScore}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-full py-1 px-3">
                                  AI Health Score
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {contact.company}
                          </p>
                          
                          {/* AI Insight */}
                          <div className="mt-2 flex items-start gap-1.5 bg-purple-500/5 rounded-lg px-2 py-1.5 border-0">
                            <Zap className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {contact.aiInsight}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(contact.status)}`}>
                              {contact.status}
                            </Badge>
                            <p className="text-xs">{contact.value}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Projects View */}
            {activeTab === "projects" && (
              <div className="p-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full p-3 rounded-xl transition-all text-left mb-2 ${
                      selectedProject === project.id 
                        ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] scale-[1.02]" 
                        : "hover:bg-white/50 hover:shadow-[0_2px_10px_rgb(0,0,0,0.04)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {project.client}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          project.status === "active" 
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : project.status === "planning"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                        }`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">Due {project.dueDate}</p>
                      <div className="flex -space-x-2">
                        {project.team.map((member, idx) => {
                          const teamGradients = [
                            "from-blue-500 via-blue-600 to-cyan-600",
                            "from-purple-500 via-purple-600 to-pink-600",
                            "from-orange-500 via-orange-600 to-red-600",
                            "from-green-500 via-green-600 to-emerald-600"
                          ];
                          return (
                            <Avatar 
                              key={idx} 
                              className={`h-6 w-6 border-2 border-white shadow-md ring-1 ring-gray-200 hover:scale-110 transition-transform hover:z-10 cursor-pointer`}
                            >
                              <AvatarFallback className={`bg-gradient-to-br ${teamGradients[idx % teamGradients.length]} text-white text-[10px] font-semibold`}>
                                {member}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sales View */}
            {activeTab === "sales" && (
              <div className="p-2">
                {deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal.id)}
                    className={`w-full p-3 rounded-xl transition-all text-left mb-2 ${
                      selectedDeal === deal.id 
                        ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] scale-[1.02]" 
                        : "hover:bg-white/50 hover:shadow-[0_2px_10px_rgb(0,0,0,0.04)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{deal.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {deal.company}
                        </p>
                      </div>
                      <p className="shrink-0">{deal.value}</p>
                    </div>
                    
                    {/* AI Risk Assessment */}
                    {deal.aiRisk && (
                      <div className="mb-2">
                        <Badge variant="outline" className={`text-xs ${getRiskColor(deal.aiRisk)}`}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          {deal.aiRisk} risk
                        </Badge>
                      </div>
                    )}
                    
                    {/* Probability Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{deal.stage}</span>
                        <span>{deal.probability}% likely</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            deal.probability >= 70 
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                          }`}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">Close: {deal.closeDate}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Add Button */}
          <div className="p-3 border-t border-border">
            <Button size="sm" className="w-full h-8 shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add {activeTab === "contacts" ? "Contact" : activeTab === "projects" ? "Project" : "Deal"}
            </Button>
          </div>
        </Card>

        {/* Contact Details & Interactions OR Project Details */}
        <Card className="lg:col-span-2 p-0 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-0 rounded-2xl overflow-hidden">
          {activeTab === "contacts" && selectedContact && (() => {
            const contact = contacts.find(c => c.id === selectedContact);
            if (!contact) return null;

            const contactInteractions = interactions.filter(i => i.contactId === selectedContact);
            const sentimentData = getSentimentIcon(contact.sentiment);
            const SentimentIcon = sentimentData.icon;

            return (
              <>
                {/* Contact Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const avatarStyle = getAvatarGradient(contact.id);
                      return (
                        <div className="relative">
                          <Avatar className={`h-16 w-16 ring-4 ${avatarStyle.ring} shadow-2xl ${avatarStyle.shadow}`}>
                            <AvatarFallback className={`bg-gradient-to-br ${avatarStyle.bg} text-white text-xl font-bold`}>
                              {contact.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {/* Status indicator */}
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white shadow-md ${
                            contact.status === 'hot' ? 'bg-red-500' : 
                            contact.status === 'warm' ? 'bg-orange-500' : 
                            'bg-blue-400'
                          }`} />
                        </div>
                      );
                    })()}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2>{contact.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{contact.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getStatusColor(contact.status)} rounded-full border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)]`}>
                            {contact.status}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.06)] ${getHealthScoreColor(contact.aiHealthScore)}`}>
                                <Sparkles className="h-4 w-4" />
                                <span>{contact.aiHealthScore}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-full py-1 px-3 shadow-[0_4px_12px_rgb(0,0,0,0.1)] border-0">
                              AI Health Score
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Contact Actions */}
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Mail className="h-4 w-4 mr-1.5" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Phone className="h-4 w-4 mr-1.5" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Insights Section */}
                  <div className="grid gap-3 mt-4 sm:grid-cols-2">
                    <div className="p-3 bg-purple-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">AI Insight</p>
                          <p className="text-sm">{contact.aiInsight}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Next Action</p>
                          <p className="text-sm">{contact.nextAction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Deal Value</p>
                        <p className="text-sm">{contact.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Interactions</p>
                        <p className="text-sm">{contact.interactions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Contact</p>
                        <p className="text-sm">{contact.lastContact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SentimentIcon className={`h-4 w-4 ${sentimentData.color}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Sentiment</p>
                        <p className="text-sm capitalize">{contact.sentiment || "neutral"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactions Feed */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3>Interaction History ({contactInteractions.length})</h3>
                    <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Log Interaction
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {contactInteractions.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No interactions yet</p>
                      </div>
                    ) : (
                      contactInteractions.map((interaction) => {
                        const Icon = getInteractionIcon(interaction.type);
                        
                        return (
                          <Card key={interaction.id} className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Header */}
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <p className="capitalize">{interaction.type}</p>
                                      {interaction.status === "transcribing" && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5" />
                                          Transcribing
                                        </Badge>
                                      )}
                                      {interaction.sentiment && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            interaction.sentiment === "positive" 
                                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                                              : interaction.sentiment === "negative"
                                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                          }`}
                                        >
                                          {interaction.sentiment}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{interaction.date}</span>
                                    {interaction.duration && (
                                      <>
                                        <span>•</span>
                                        <span>{interaction.duration}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-muted/30 rounded-xl p-3 border-0">
                                  <p className="text-sm text-muted-foreground">
                                    {interaction.summary}
                                  </p>
                                </div>

                                {/* Action Items */}
                                {interaction.actionItems.length > 0 && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Action Items
                                    </p>
                                    <div className="space-y-2">
                                      {interaction.actionItems.map((item, index) => {
                                        const isCompleted = interactionActionItems[interaction.id]?.[index] ?? item.completed;
                                        return (
                                          <div 
                                            key={index} 
                                            className="flex items-start gap-2 group cursor-pointer hover:bg-muted/30 rounded-lg p-1.5 -ml-1.5 transition-colors"
                                            onClick={() => toggleActionItem(interaction.id, index)}
                                          >
                                            {isCompleted ? (
                                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            ) : (
                                              <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                                            )}
                                            <p className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                              {item.text}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Transcript Badge */}
                                {interaction.status === "completed" && (
                                  <div>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                      <FileText className="h-3 w-3 mr-1.5" />
                                      View Full Transcript
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}

          {/* Contacts Overview - when no contact is selected */}
          {activeTab === "contacts" && !selectedContact && (() => {
            const filteredContacts = contacts.filter(contact => {
              const matchesSearch = 
                contact.name.toLowerCase().includes(contactsOverviewSearch.toLowerCase()) ||
                contact.company.toLowerCase().includes(contactsOverviewSearch.toLowerCase()) ||
                contact.email.toLowerCase().includes(contactsOverviewSearch.toLowerCase());
              
              const matchesStatus = contactsStatusFilter === "all" || contact.status === contactsStatusFilter;
              const matchesSentiment = contactsSentimentFilter === "all" || contact.sentiment === contactsSentimentFilter;
              
              return matchesSearch && matchesStatus && matchesSentiment;
            });

            return (
              <>
                {/* Floating Toolbar */}
                <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search contacts by name, company, or email..."
                          value={contactsOverviewSearch}
                          onChange={(e) => setContactsOverviewSearch(e.target.value)}
                          className="pl-9 h-9 shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-9 px-3 bg-white shadow-sm">
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        Filters
                      </Badge>
                      
                      <Button
                        variant={contactsStatusFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className="h-9"
                        onClick={() => setContactsStatusFilter("all")}
                      >
                        All
                      </Button>
                      <Button
                        variant={contactsStatusFilter === "hot" ? "default" : "outline"}
                        size="sm"
                        className="h-9"
                        onClick={() => setContactsStatusFilter("hot")}
                      >
                        <Flag className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                        Hot
                      </Button>
                      <Button
                        variant={contactsStatusFilter === "warm" ? "default" : "outline"}
                        size="sm"
                        className="h-9"
                        onClick={() => setContactsStatusFilter("warm")}
                      >
                        <Flag className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                        Warm
                      </Button>
                      <Button
                        variant={contactsStatusFilter === "cold" ? "default" : "outline"}
                        size="sm"
                        className="h-9"
                        onClick={() => setContactsStatusFilter("cold")}
                      >
                        <Flag className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Cold
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Sentiment:</span>
                    <Button
                      variant={contactsSentimentFilter === "all" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setContactsSentimentFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={contactsSentimentFilter === "positive" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setContactsSentimentFilter("positive")}
                    >
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      Positive
                    </Button>
                    <Button
                      variant={contactsSentimentFilter === "neutral" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setContactsSentimentFilter("neutral")}
                    >
                      Neutral
                    </Button>
                    <Button
                      variant={contactsSentimentFilter === "concerned" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setContactsSentimentFilter("concerned")}
                    >
                      <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />
                      Concerned
                    </Button>
                    
                    {(contactsStatusFilter !== "all" || contactsSentimentFilter !== "all" || contactsOverviewSearch) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs ml-auto"
                        onClick={() => {
                          setContactsStatusFilter("all");
                          setContactsSentimentFilter("all");
                          setContactsOverviewSearch("");
                        }}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contacts Grid */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredContacts.length} of {contacts.length} contacts
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredContacts.map((contact) => {
                        const sentimentData = getSentimentIcon(contact.sentiment);
                        const SentimentIcon = sentimentData.icon;
                        
                        return (
                          <Card
                            key={contact.id}
                            className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer"
                            onClick={() => setSelectedContact(contact.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                                  {contact.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm truncate">{contact.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Badge variant="outline" className={`${getStatusColor(contact.status)} rounded-full border-0 text-xs h-6 px-2`}>
                                      {contact.status}
                                    </Badge>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-sm ${getHealthScoreColor(contact.aiHealthScore)}`}>
                                          <Sparkles className="h-3 w-3" />
                                          <span className="text-xs">{contact.aiHealthScore}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="rounded-full py-1 px-3 shadow-[0_4px_12px_rgb(0,0,0,0.1)] border-0">
                                        AI Health Score
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Value</p>
                                    <p className="text-xs">{contact.value}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interactions</p>
                                    <p className="text-xs">{contact.interactions}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Sentiment</p>
                                    <div className="flex items-center gap-1">
                                      <SentimentIcon className={`h-3 w-3 ${sentimentData.color}`} />
                                      <p className="text-xs capitalize">{contact.sentiment || "neutral"}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <p className="text-xs text-muted-foreground line-clamp-2">{contact.aiInsight}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {filteredContacts.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No contacts found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}

          {/* Project Details */}
          {activeTab === "projects" && selectedProject && (() => {
            const project = projects.find(p => p.id === selectedProject);
            if (!project) return null;

            const completedTasks = project.tasks.filter(t => t.status === "completed").length;
            const completedMilestones = project.milestones.filter(m => m.completed).length;

            return (
              <>
                {/* Project Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2>{project.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{project.client}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`rounded-full border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)] ${
                              project.status === "active" 
                                ? "bg-green-500/10 text-green-500"
                                : project.status === "planning"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-gray-500/10 text-gray-500"
                            }`}
                          >
                            {project.status}
                          </Badge>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.06)]">
                            <span className="text-sm">{project.progress}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Edit className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Users className="h-4 w-4 mr-1.5" />
                          Team
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <FolderOpen className="h-4 w-4 mr-1.5" />
                          Files
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mt-4">
                    {project.description}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-blue-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                      <p className="text-lg">{project.budget}</p>
                    </div>
                    
                    <div className="p-3 bg-orange-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-orange-500" />
                        <p className="text-xs text-muted-foreground">Spent</p>
                      </div>
                      <p className="text-lg">{project.spent}</p>
                    </div>
                    
                    <div className="p-3 bg-green-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-muted-foreground">Start Date</p>
                      </div>
                      <p className="text-sm">{project.startDate}</p>
                    </div>
                    
                    <div className="p-3 bg-red-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-muted-foreground">Due Date</p>
                      </div>
                      <p className="text-sm">{project.dueDate}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm">Overall Progress</p>
                      <p className="text-sm text-muted-foreground">{project.progress}%</p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tabs for Project Details */}
                <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
                  <div className="px-6 pt-4 border-b border-border">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="tasks">
                        <ListTodo className="h-4 w-4 mr-1.5" />
                        Tasks ({completedTasks}/{project.tasks.length})
                      </TabsTrigger>
                      <TabsTrigger value="milestones">
                        <Flag className="h-4 w-4 mr-1.5" />
                        Milestones ({completedMilestones}/{project.milestones.length})
                      </TabsTrigger>
                      <TabsTrigger value="updates">
                        <Activity className="h-4 w-4 mr-1.5" />
                        Updates ({project.updates.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1">
                    {/* Tasks Tab */}
                    <TabsContent value="tasks" className="p-4 space-y-3 mt-0">
                      {project.tasks.map((task) => (
                        <Card key={task.id} className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                              task.status === "completed"
                                ? "bg-green-500"
                                : task.status === "in-progress"
                                ? "bg-blue-500"
                                : "bg-muted"
                            }`}>
                              {task.status === "completed" && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                              {task.status === "in-progress" && (
                                <Clock className="h-3 w-3 text-white" />
                              )}
                              {task.status === "pending" && (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={task.status === "completed" ? "line-through text-muted-foreground" : ""}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{task.assignee}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due {task.dueDate}</span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs rounded-full border-0 ${
                                    task.status === "completed"
                                      ? "bg-green-500/10 text-green-500"
                                      : task.status === "in-progress"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : "bg-gray-500/10 text-gray-500"
                                  }`}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>

                    {/* Milestones Tab */}
                    <TabsContent value="milestones" className="p-4 space-y-3 mt-0">
                      {project.milestones.map((milestone, index) => (
                        <Card key={milestone.id} className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                milestone.completed
                                  ? "bg-green-500"
                                  : "bg-muted"
                              }`}>
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                ) : (
                                  <Flag className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              {index < project.milestones.length - 1 && (
                                <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 ${
                                  milestone.completed ? "bg-green-500/30" : "bg-muted"
                                }`} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={milestone.completed ? "" : "text-muted-foreground"}>
                                {milestone.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{milestone.date}</span>
                                {milestone.completed && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-0 text-xs rounded-full">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>

                    {/* Updates Tab */}
                    <TabsContent value="updates" className="p-4 space-y-3 mt-0">
                      {project.updates.map((update) => (
                        <Card key={update.id} className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                                {update.author.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p>{update.author}</p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{update.date}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{update.content}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </>
            );
          })()}

          {/* Deal Details */}
          {activeTab === "sales" && selectedDeal && (() => {
            const deal = deals.find(d => d.id === selectedDeal);
            if (!deal) return null;

            return (
              <>
                {/* Deal Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2>{deal.title}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{deal.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="rounded-full border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)] bg-green-500/10 text-green-500 capitalize"
                          >
                            {deal.stage}
                          </Badge>
                          {deal.aiRisk && (
                            <Badge 
                              variant="outline" 
                              className={`rounded-full border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)] ${getRiskColor(deal.aiRisk)}`}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {deal.aiRisk} risk
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Edit className="h-4 w-4 mr-1.5" />
                          Edit Deal
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <User className="h-4 w-4 mr-1.5" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
                          <Activity className="h-4 w-4 mr-1.5" />
                          Activity
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-green-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <p className="text-xs text-muted-foreground">Deal Value</p>
                      </div>
                      <p className="text-2xl">{deal.value}</p>
                    </div>
                    
                    <div className="p-4 bg-blue-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-5 w-5 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Win Probability</p>
                      </div>
                      <p className="text-2xl">{deal.probability}%</p>
                    </div>
                    
                    <div className="p-4 bg-purple-500/5 rounded-xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <p className="text-xs text-muted-foreground">Expected Close</p>
                      </div>
                      <p className="text-lg">{deal.closeDate}</p>
                    </div>
                  </div>
                  
                  {/* Probability Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm">Win Probability</p>
                      <p className="text-sm text-muted-foreground">{deal.probability}%</p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          deal.probability >= 70 
                            ? "bg-gradient-to-r from-green-500 to-emerald-600"
                            : "bg-gradient-to-r from-yellow-500 to-orange-600"
                        }`}
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Deal Pipeline Stages */}
                <div className="p-6 border-b border-border">
                  <h3 className="mb-4">Deal Pipeline</h3>
                  <div className="relative">
                    <div className="flex justify-between">
                      {["discovery", "proposal", "negotiation", "closed"].map((stage, index) => {
                        const isActive = ["discovery", "proposal", "negotiation", "closed"].indexOf(deal.stage) >= index;
                        const isCurrent = deal.stage === stage;
                        
                        return (
                          <div key={stage} className="flex-1 flex flex-col items-center relative">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                              isCurrent
                                ? "bg-blue-500 shadow-[0_4px_20px_rgb(59,130,246,0.4)]"
                                : isActive
                                ? "bg-green-500"
                                : "bg-muted"
                            }`}>
                              {isActive ? (
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <p className={`text-xs capitalize ${isCurrent ? "" : "text-muted-foreground"}`}>
                              {stage}
                            </p>
                            {index < 3 && (
                              <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                isActive ? "bg-green-500" : "bg-muted"
                              }`} style={{ zIndex: -1 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* AI Insights & Next Steps */}
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="mb-3">AI Insights</h3>
                      <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-purple-500/5">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm">
                              {deal.aiRisk === "low" 
                                ? "This deal is progressing well. The contact has been highly responsive and engagement metrics are positive. Consider scheduling a follow-up demo to move to the next stage."
                                : deal.aiRisk === "medium"
                                ? "Deal requires attention. Response times have slowed and there's been limited engagement in the past week. Recommend reaching out to re-engage and address any concerns."
                                : "High-risk deal. Multiple follow-ups have gone unanswered. Consider offering additional value or scheduling a call to understand blockers."
                              }
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div>
                      <h3 className="mb-3">Recommended Next Steps</h3>
                      <div className="space-y-2">
                        <Card className="p-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">Send personalized follow-up email</p>
                          </div>
                        </Card>
                        <Card className="p-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">Schedule product demo for decision makers</p>
                          </div>
                        </Card>
                        <Card className="p-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">Share relevant case studies</p>
                          </div>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3">Recent Activity</h3>
                      <div className="space-y-3">
                        <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Mail className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm">Email sent: Q4 Proposal</p>
                              <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                              <Phone className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm">Call: Discovery call completed</p>
                              <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </Card>
          </div>
        </div>
      </div>

      {/* Stock Ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t">
        <CRMStockTicker 
          totalContacts={248}
          pipelineValue="$1.2M"
          interactions={38}
          hotLeads={12}
          avgResponse="2.4h"
          winRate={68}
        />
      </div>
    </div>
  );
}

// CRM-specific Stock Ticker
function CRMStockTicker({ 
  totalContacts,
  pipelineValue,
  interactions,
  hotLeads,
  avgResponse,
  winRate
}: { 
  totalContacts: number;
  pipelineValue: string;
  interactions: number;
  hotLeads: number;
  avgResponse: string;
  winRate: number;
}) {
  const tickerItems = [
    {
      id: "1",
      icon: User,
      label: "Total Contacts",
      value: totalContacts.toString(),
      description: "Active in pipeline",
      color: "from-blue-500/10 to-blue-500/20",
      iconColor: "text-blue-500",
      trend: "+12%"
    },
    {
      id: "2",
      icon: DollarSign,
      label: "Pipeline Value",
      value: pipelineValue,
      description: "Revenue opportunity",
      color: "from-green-500/10 to-green-500/20",
      iconColor: "text-green-500",
      trend: "+8%"
    },
    {
      id: "3",
      icon: MessageSquare,
      label: "Interactions",
      value: interactions.toString(),
      description: "This week",
      color: "from-purple-500/10 to-purple-500/20",
      iconColor: "text-purple-500",
      trend: "+24%"
    },
    {
      id: "4",
      icon: Zap,
      label: "Hot Leads",
      value: hotLeads.toString(),
      description: "High-priority contacts",
      color: "from-red-500/10 to-red-500/20",
      iconColor: "text-red-500",
      trend: "Active"
    },
    {
      id: "5",
      icon: Clock,
      label: "Avg Response",
      value: avgResponse,
      description: "Response time",
      color: "from-orange-500/10 to-orange-500/20",
      iconColor: "text-orange-500",
      trend: "-15%"
    },
    {
      id: "6",
      icon: Target,
      label: "Win Rate",
      value: `${winRate}%`,
      description: "Deal success rate",
      color: "from-cyan-500/10 to-cyan-500/20",
      iconColor: "text-cyan-500",
      trend: "+5%"
    }
  ];

  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-xl py-2 mx-4 my-2">
      <div className="animate-ticker flex gap-2">
        {duplicatedItems.map((item, index) => (
          <Card
            key={`${item.id}-${index}`}
            className="flex-shrink-0 px-3 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg bg-white"
          >
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-3 w-3 ${item.iconColor}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</p>
                <p className="text-sm whitespace-nowrap">{item.value}</p>
                <p className="text-xs text-green-600 whitespace-nowrap">{item.trend}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
