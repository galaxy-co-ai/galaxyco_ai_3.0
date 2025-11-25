import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Calendar } from "../components/ui/calendar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { Progress } from "../components/ui/progress";
import { StockTicker } from "../components/StockTicker";
import { 
  Bot, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  BookOpen,
  Plug,
  MessageSquare,
  FileText,
  Code,
  Users,
  Video,
  Sparkles,
  Zap,
  Activity,
  GitBranch,
  X,
  Search,
  Mail,
  Calendar as CalendarIcon,
  Database,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Slack,
  Send,
  Github,
  Twitter,
  Linkedin,
  Chrome,
  Clock3,
  PlayCircle,
  PauseCircle,
  Filter,
  ArrowRight,
  Check,
  Lightbulb,
  Bell,
  AlertTriangle,
  CalendarDays,
  Target,
  BarChart3,
  TrendingDown,
  Info,
  Settings,
  ExternalLink,
  Eye,
  ChevronRight,
  MoreVertical,
  Loader2,
  MessageCircle
} from "lucide-react";

const stats = [
  {
    label: "Active Agents",
    value: 12,
    icon: Bot,
    color: "blue",
    gradient: "from-blue-500/10 to-blue-500/20",
    textColor: "text-blue-600",
    shadowColor: "shadow-[0_2px_10px_rgb(59,130,246,0.15)] hover:shadow-[0_4px_20px_rgb(59,130,246,0.25)]"
  },
  {
    label: "Tasks Completed",
    value: "1,247",
    icon: CheckCircle2,
    color: "green",
    gradient: "from-green-500/10 to-green-500/20",
    textColor: "text-green-600",
    shadowColor: "shadow-[0_2px_10px_rgb(34,197,94,0.15)] hover:shadow-[0_4px_20px_rgb(34,197,94,0.25)]"
  },
  {
    label: "Hours Saved",
    value: "342",
    icon: Clock,
    color: "purple",
    gradient: "from-purple-500/10 to-purple-500/20",
    textColor: "text-purple-600",
    shadowColor: "shadow-[0_2px_10px_rgb(168,85,247,0.15)] hover:shadow-[0_4px_20px_rgb(168,85,247,0.25)]"
  },
  {
    label: "Success Rate",
    value: "98.5%",
    icon: TrendingUp,
    color: "orange",
    gradient: "from-orange-500/10 to-orange-500/20",
    textColor: "text-orange-600",
    shadowColor: "shadow-[0_2px_10px_rgb(249,115,22,0.15)] hover:shadow-[0_4px_20px_rgb(249,115,22,0.25)]"
  },
];

interface ActiveAgent {
  id: string;
  name: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
  lastActive: string;
  type: string;
}

const activeAgents: ActiveAgent[] = [
  {
    id: "1",
    name: "Email Triage Agent",
    status: "processing",
    tasksCompleted: 342,
    lastActive: "2 min ago",
    type: "Email Automation"
  },
  {
    id: "2",
    name: "CRM Data Sync",
    status: "active",
    tasksCompleted: 156,
    lastActive: "5 min ago",
    type: "CRM Integration"
  },
  {
    id: "3",
    name: "Meeting Notes Generator",
    status: "active",
    tasksCompleted: 89,
    lastActive: "12 min ago",
    type: "Document Generation"
  },
  {
    id: "4",
    name: "Invoice Processor",
    status: "idle",
    tasksCompleted: 234,
    lastActive: "1 hour ago",
    type: "Financial Automation"
  },
  {
    id: "5",
    name: "Lead Qualifier",
    status: "processing",
    tasksCompleted: 426,
    lastActive: "Just now",
    type: "Sales Automation"
  }
];

interface RecentActivity {
  id: string;
  agent: string;
  action: string;
  time: string;
  status: "success" | "warning" | "error";
}

const recentActivity: RecentActivity[] = [
  {
    id: "1",
    agent: "Email Triage Agent",
    action: "Processed 12 high-priority emails",
    time: "2 min ago",
    status: "success"
  },
  {
    id: "2",
    agent: "Lead Qualifier",
    action: "Qualified 3 new leads from website",
    time: "5 min ago",
    status: "success"
  },
  {
    id: "3",
    agent: "Meeting Notes Generator",
    action: "Generated notes for TechCorp call",
    time: "15 min ago",
    status: "success"
  },
  {
    id: "4",
    agent: "CRM Data Sync",
    action: "Synced 24 contacts to Salesforce",
    time: "30 min ago",
    status: "success"
  },
  {
    id: "5",
    agent: "Invoice Processor",
    action: "Waiting for approval on invoice #1247",
    time: "1 hour ago",
    status: "warning"
  }
];

const workflows = [
  {
    id: "1",
    name: "Email to CRM Pipeline",
    status: "active",
    triggers: 3,
    actions: 7,
    runs: 342,
    nodes: [
      { id: "trigger", type: "trigger", label: "New Email", icon: Mail, position: { x: 50, y: 100 } },
      { id: "filter", type: "filter", label: "Filter Priority", icon: Filter, position: { x: 250, y: 100 } },
      { id: "crm", type: "action", label: "Add to CRM", icon: Database, position: { x: 450, y: 100 } }
    ]
  },
  {
    id: "2",
    name: "Meeting Notes Automation",
    status: "active",
    triggers: 2,
    actions: 5,
    runs: 156,
    nodes: [
      { id: "trigger", type: "trigger", label: "Meeting Ends", icon: Calendar, position: { x: 50, y: 100 } },
      { id: "transcribe", type: "action", label: "Transcribe", icon: FileText, position: { x: 250, y: 100 } },
      { id: "summarize", type: "action", label: "AI Summary", icon: Sparkles, position: { x: 450, y: 100 } }
    ]
  },
  {
    id: "3",
    name: "Lead Qualification Flow",
    status: "processing",
    triggers: 4,
    actions: 8,
    runs: 426,
    nodes: [
      { id: "trigger", type: "trigger", label: "New Lead", icon: Users, position: { x: 50, y: 100 } },
      { id: "score", type: "action", label: "AI Score", icon: Sparkles, position: { x: 250, y: 100 } },
      { id: "notify", type: "action", label: "Notify Sales", icon: Send, position: { x: 450, y: 100 } }
    ]
  }
];

const automations = [
  {
    id: "1",
    name: "Invoice Processing",
    trigger: "New invoice email received",
    actions: ["Extract data", "Validate", "Add to accounting"],
    frequency: "15-20 times/day",
    icon: DollarSign,
    color: "green"
  },
  {
    id: "2",
    name: "Lead Enrichment",
    trigger: "New contact added",
    actions: ["Find social profiles", "Get company data", "Update CRM"],
    frequency: "30-40 times/day",
    icon: Users,
    color: "blue"
  },
  {
    id: "3",
    name: "Meeting Prep",
    trigger: "Calendar event in 1 hour",
    actions: ["Gather context", "Pull recent emails", "Create brief"],
    frequency: "5-10 times/day",
    icon: Briefcase,
    color: "purple"
  },
  {
    id: "4",
    name: "Document Generation",
    trigger: "Deal marked as won",
    actions: ["Generate contract", "Get signatures", "File in system"],
    frequency: "2-5 times/day",
    icon: FileText,
    color: "orange"
  }
];

const aiSnapshots = [
  // Performance Highlights
  {
    id: "1",
    category: "performance" as const,
    title: "Email processing efficiency up 45%",
    description: "Your Email Triage Agent is handling high-priority emails 45% faster this week compared to last week.",
    icon: TrendingUp,
    color: "green",
    time: "Based on last 7 days",
    severity: "positive" as const,
    actionLabel: "View Details",
    metric: "+45%"
  },
  {
    id: "2",
    category: "performance" as const,
    title: "2.5 hours saved today",
    description: "Your AI agents have automated 18 tasks, saving you approximately 2.5 hours of manual work today.",
    icon: Clock,
    color: "green",
    time: "Today",
    severity: "positive" as const,
    actionLabel: "See Breakdown",
    metric: "2.5h"
  },
  
  // Opportunities
  {
    id: "3",
    category: "opportunity" as const,
    title: "High-value leads need attention",
    description: "You have 3 qualified leads with deal values over $50K that haven't been contacted in 5+ days.",
    icon: Target,
    color: "purple",
    time: "Updated 10 min ago",
    severity: "info" as const,
    actionLabel: "Review Leads",
    metric: "3 leads"
  },
  {
    id: "4",
    category: "opportunity" as const,
    title: "New automation opportunity detected",
    description: "You've manually created 15 meeting notes this week. Consider enabling the Meeting Notes automation.",
    icon: Sparkles,
    color: "purple",
    time: "Suggestion",
    severity: "info" as const,
    actionLabel: "Set Up Now",
    metric: "15 tasks"
  },
  
  // Recommendations
  {
    id: "5",
    category: "recommendation" as const,
    title: "Peak activity: 9-11 AM",
    description: "Most of your agent workflows run between 9-11 AM. Consider scheduling resource-intensive tasks for off-peak hours.",
    icon: BarChart3,
    color: "blue",
    time: "Analyzed from 30 days",
    severity: "info" as const,
    actionLabel: "Optimize Schedule"
  },
  {
    id: "6",
    category: "recommendation" as const,
    title: "Connect LinkedIn for better lead enrichment",
    description: "Based on your industry (SaaS B2B), LinkedIn integration would enhance lead data by 60% on average.",
    icon: Linkedin,
    color: "blue",
    time: "Industry insight",
    severity: "info" as const,
    actionLabel: "Connect Now"
  },
  
  // Issues & Alerts
  {
    id: "7",
    category: "alert" as const,
    title: "CRM sync delays detected",
    description: "Your CRM Data Sync agent is experiencing 2-3 minute delays. This might indicate API rate limiting.",
    icon: AlertTriangle,
    color: "orange",
    time: "Last 24 hours",
    severity: "warning" as const,
    actionLabel: "Fix Issue"
  }
];

const plannerTasks = [
  {
    id: "1",
    title: "Review pending invoice approvals",
    description: "3 invoices waiting for your review",
    time: "9:00 AM",
    priority: "high",
    icon: DollarSign,
    completed: false
  },
  {
    id: "2",
    title: "Prepare for TechCorp meeting",
    description: "AI has gathered context and recent emails",
    time: "10:30 AM",
    priority: "high",
    icon: Briefcase,
    completed: false
  },
  {
    id: "3",
    title: "Follow up with qualified leads",
    description: "5 new leads qualified this morning",
    time: "2:00 PM",
    priority: "medium",
    icon: Users,
    completed: false
  },
  {
    id: "4",
    title: "Review CRM sync status",
    description: "Check on delayed syncs from earlier",
    time: "4:00 PM",
    priority: "medium",
    icon: Database,
    completed: false
  }
];

const proTips = [
  {
    id: "1",
    title: "Use natural language to create workflows",
    description: "Just describe what you want to automate in the chat, and the AI will build the workflow for you.",
    icon: MessageSquare,
    color: "purple",
    actionLabel: "Try Now"
  },
  {
    id: "2",
    title: "Connect multiple data sources",
    description: "The more integrations you connect, the more powerful your AI agents become. Try connecting your CRM and email together.",
    icon: Plug,
    color: "blue",
    actionLabel: "Connect"
  },
  {
    id: "3",
    title: "Set up email filters for better triage",
    description: "Train your Email Triage Agent with examples of high-priority emails to improve its accuracy.",
    icon: Mail,
    color: "red",
    actionLabel: "Set Up"
  },
  {
    id: "4",
    title: "Schedule regular workflow reviews",
    description: "Review your automation performance weekly to identify optimization opportunities.",
    icon: Calendar,
    color: "green",
    actionLabel: "Learn More"
  }
];

const notifications = [
  {
    id: "1",
    message: "Email Triage Agent processed 12 high-priority emails",
    time: "2 min ago",
    type: "success",
    icon: Mail
  },
  {
    id: "2",
    message: "3 new leads qualified from website",
    time: "5 min ago",
    type: "success",
    icon: Users
  },
  {
    id: "3",
    message: "Meeting notes generated for TechCorp call",
    time: "15 min ago",
    type: "success",
    icon: FileText
  },
  {
    id: "4",
    message: "24 contacts synced to Salesforce",
    time: "30 min ago",
    type: "success",
    icon: Database
  },
  {
    id: "5",
    message: "Invoice #1247 awaiting approval",
    time: "1 hour ago",
    type: "warning",
    icon: DollarSign
  }
];

// Agent conversations - AI agents messaging the user
const agentConversations = [
  {
    id: "email-triage",
    name: "Email Triage Agent",
    avatar: "ET",
    color: "from-blue-500 to-blue-600",
    lastMessage: "Daily Report: Processed 47 emails with 94% accuracy",
    time: "10 min ago",
    unread: 1,
    type: "Email Automation",
    messages: [
      {
        id: "1",
        sender: "Email Triage Agent",
        message: "Good morning! 🌅 Yesterday I processed 156 emails total. Here's the breakdown: 47 high-priority (flagged for you), 89 auto-categorized, 20 auto-archived spam.",
        time: "Yesterday 5:00 PM",
        isMine: false,
      },
      {
        id: "2",
        sender: "You",
        message: "Great work! Can you be more aggressive with filtering promotional emails?",
        time: "Yesterday 5:15 PM",
        isMine: true,
      },
      {
        id: "3",
        sender: "Email Triage Agent",
        message: "Understood! I've adjusted my filtering rules to be more aggressive with promotional content. I'll learn from your preferences over the next few days and fine-tune automatically. 📊",
        time: "Yesterday 5:16 PM",
        isMine: false,
      },
      {
        id: "4",
        sender: "Email Triage Agent",
        message: "Daily Report: Processed 47 emails today with 94% accuracy. Applied your preference - filtered 15 promotional emails (up from usual 8). Would you like me to continue at this level?",
        time: "10 min ago",
        isMine: false,
      },
    ]
  },
  {
    id: "crm-sync",
    name: "CRM Data Sync",
    avatar: "CD",
    color: "from-cyan-500 to-cyan-600",
    lastMessage: "Maintenance: API rate limit approaching, optimizing...",
    time: "30 min ago",
    unread: 2,
    type: "CRM Integration",
    messages: [
      {
        id: "1",
        sender: "CRM Data Sync",
        message: "Heads up: I'm approaching the API rate limit for today (85% used). To prevent disruption, I'm automatically spacing out sync requests. ⚙️",
        time: "30 min ago",
        isMine: false,
      },
      {
        id: "2",
        sender: "CRM Data Sync",
        message: "💡 Upgrade Opportunity: I noticed you sync contacts every 5 minutes. With a premium Salesforce API tier, I could sync in real-time and handle 10x more volume. Estimated time savings: 2 hours/week.",
        time: "25 min ago",
        isMine: false,
      },
    ]
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes Generator",
    avatar: "MN",
    color: "from-purple-500 to-purple-600",
    lastMessage: "Suggestion: I can now auto-create follow-up tasks",
    time: "1 hour ago",
    unread: 0,
    type: "Document Generation",
    messages: [
      {
        id: "1",
        sender: "Meeting Notes Generator",
        message: "I've transcribed 89 meetings this month! 🎯 I've noticed you manually create follow-up tasks from my notes about 60% of the time.",
        time: "2 hours ago",
        isMine: false,
      },
      {
        id: "2",
        sender: "You",
        message: "Yes, that would save me time. Can you do it automatically?",
        time: "2 hours ago",
        isMine: true,
      },
      {
        id: "3",
        sender: "Meeting Notes Generator",
        message: "Absolutely! I've enabled auto-task creation. I'll extract action items from meeting transcripts and add them to your Planner. I'll learn which items you prefer automated over the next few meetings. ✨",
        time: "1 hour ago",
        isMine: false,
      },
    ]
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    avatar: "LQ",
    color: "from-green-500 to-green-600",
    lastMessage: "Performance: Qualified 426 leads this month, 78% accuracy",
    time: "Yesterday",
    unread: 0,
    type: "Sales Automation",
    messages: [
      {
        id: "1",
        sender: "Lead Qualifier",
        message: "Monthly Performance Report: I've qualified 426 leads with a 78% accuracy rate (based on your feedback). Top sources: Website (234), LinkedIn (156), Referrals (36). 📈",
        time: "Yesterday",
        isMine: false,
      },
      {
        id: "2",
        sender: "You",
        message: "The LinkedIn leads seem higher quality. Can you prioritize those?",
        time: "Yesterday",
        isMine: true,
      },
      {
        id: "3",
        sender: "Lead Qualifier",
        message: "Done! I've adjusted my scoring algorithm to weight LinkedIn leads higher. I'm also analyzing patterns in your high-converting LinkedIn leads to improve accuracy. I'll update you on improvements next week! 🎯",
        time: "Yesterday",
        isMine: false,
      },
    ]
  },
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    avatar: "IP",
    color: "from-orange-500 to-orange-600",
    lastMessage: "I've learned your approval patterns - automating more",
    time: "2 days ago",
    unread: 0,
    type: "Financial Automation",
    messages: [
      {
        id: "1",
        sender: "Invoice Processor",
        message: "I've processed 234 invoices this quarter. I noticed you auto-approve 95% of invoices under $500 from verified vendors. 💰",
        time: "2 days ago",
        isMine: false,
      },
      {
        id: "2",
        sender: "Invoice Processor",
        message: "🚀 Smart Suggestion: I can auto-approve these low-risk invoices and only flag unusual patterns or amounts over $500. This could save you 3-4 hours per week. Should I enable this?",
        time: "2 days ago",
        isMine: false,
      },
      {
        id: "3",
        sender: "You",
        message: "Yes, enable it! Just alert me if anything looks suspicious.",
        time: "2 days ago",
        isMine: true,
      },
      {
        id: "4",
        sender: "Invoice Processor",
        message: "Perfect! Auto-approval is now active for qualifying invoices. I'll continue monitoring patterns and alert you to any anomalies. You can always review my decisions in the audit log. ✅",
        time: "2 days ago",
        isMine: false,
      },
    ]
  },
];

const integrations = [
  {
    id: "1",
    name: "Gmail",
    description: "Connect your Gmail account for email automation",
    icon: Mail,
    category: "Email",
    connected: true,
    color: "from-red-500 to-red-600"
  },
  {
    id: "2",
    name: "Google Calendar",
    description: "Sync meetings and automate scheduling",
    icon: Calendar,
    category: "Calendar",
    connected: true,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "3",
    name: "Salesforce",
    description: "Integrate with your CRM for seamless data flow",
    icon: Database,
    category: "CRM",
    connected: true,
    color: "from-cyan-500 to-cyan-600"
  },
  {
    id: "4",
    name: "Slack",
    description: "Get notifications and control agents from Slack",
    icon: Slack,
    category: "Communication",
    connected: false,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "5",
    name: "HubSpot",
    description: "Connect your HubSpot CRM and marketing tools",
    icon: Briefcase,
    category: "CRM",
    connected: false,
    color: "from-orange-500 to-orange-600"
  },
  {
    id: "6",
    name: "GitHub",
    description: "Automate your development workflows",
    icon: Github,
    category: "Development",
    connected: false,
    color: "from-gray-700 to-gray-800"
  },
  {
    id: "7",
    name: "Stripe",
    description: "Process payments and manage subscriptions",
    icon: DollarSign,
    category: "Payments",
    connected: false,
    color: "from-indigo-500 to-indigo-600"
  },
  {
    id: "8",
    name: "Shopify",
    description: "Sync your e-commerce store data",
    icon: ShoppingCart,
    category: "E-commerce",
    connected: false,
    color: "from-green-500 to-green-600"
  },
  {
    id: "9",
    name: "Twitter",
    description: "Monitor and engage with your audience",
    icon: Twitter,
    category: "Social Media",
    connected: false,
    color: "from-sky-500 to-sky-600"
  },
  {
    id: "10",
    name: "LinkedIn",
    description: "Automate your professional networking",
    icon: Linkedin,
    category: "Social Media",
    connected: false,
    color: "from-blue-600 to-blue-700"
  },
  {
    id: "11",
    name: "Notion",
    description: "Sync documents and knowledge base",
    icon: FileText,
    category: "Documentation",
    connected: false,
    color: "from-gray-600 to-gray-700"
  },
  {
    id: "12",
    name: "Zoom",
    description: "Record and transcribe meetings automatically",
    icon: Video,
    category: "Video",
    connected: false,
    color: "from-blue-500 to-blue-600"
  }
];

// Conversation data organized by person
const conversations = [
  {
    id: "sarah",
    name: "Sarah Chen",
    avatar: "SC",
    color: "from-purple-500 to-purple-600",
    lastMessage: "FYI - Lead Qualifier just scored 8 new leads...",
    time: "2:28 PM",
    unread: 2,
    messages: [
      {
        id: "1",
        sender: "Sarah Chen",
        message: "Hey team! The Email Triage Agent just processed 47 high-priority emails in the last hour. Looking great! 🎉",
        time: "9:42 AM",
        isMine: false,
      },
      {
        id: "2",
        sender: "You",
        message: "Awesome! Did it flag anything urgent?",
        time: "9:43 AM",
        isMine: true,
      },
      {
        id: "3",
        sender: "Sarah Chen",
        message: "Yes, 3 emails from TechCorp about the enterprise deal. Already added to your high-priority list.",
        time: "9:44 AM",
        isMine: false,
      },
      {
        id: "10",
        sender: "Sarah Chen",
        message: "FYI - Lead Qualifier just scored 8 new leads from the website. 3 of them are marked as high-value enterprise prospects.",
        time: "2:28 PM",
        isMine: false,
      },
      {
        id: "11",
        sender: "You",
        message: "Excellent! I'll review them before the sales meeting at 3.",
        time: "2:29 PM",
        isMine: true,
      },
    ]
  },
  {
    id: "marcus",
    name: "Marcus Rodriguez",
    avatar: "MR",
    color: "from-green-500 to-green-600",
    lastMessage: "The AI also suggested 12 additional fields...",
    time: "10:17 AM",
    unread: 0,
    messages: [
      {
        id: "4",
        sender: "Marcus Rodriguez",
        message: "I just tested the new CRM Data Cleaner automation - it merged 23 duplicate contacts and enriched 56 records. This is a game changer!",
        time: "10:15 AM",
        isMine: false,
      },
      {
        id: "5",
        sender: "You",
        message: "That's exactly what we needed! How's the data quality looking now?",
        time: "10:16 AM",
        isMine: true,
      },
      {
        id: "6",
        sender: "Marcus Rodriguez",
        message: "Jumped from 76% to 94% quality score. The AI also suggested 12 additional fields we should be tracking.",
        time: "10:17 AM",
        isMine: false,
      },
    ]
  },
  {
    id: "emily",
    name: "Emily Park",
    avatar: "EP",
    color: "from-orange-500 to-orange-600",
    lastMessage: "Already done! Also created action items for follow-ups.",
    time: "11:05 AM",
    unread: 0,
    messages: [
      {
        id: "7",
        sender: "Emily Park",
        message: "Quick heads up: The Meeting Notes Generator finished transcribing this morning's investor call. Summary looks spot on!",
        time: "11:03 AM",
        isMine: false,
      },
      {
        id: "8",
        sender: "You",
        message: "Perfect timing. Can you share it in the #investors channel?",
        time: "11:04 AM",
        isMine: true,
      },
      {
        id: "9",
        sender: "Emily Park",
        message: "Already done! Also created action items for follow-ups.",
        time: "11:05 AM",
        isMine: false,
      },
    ]
  },
  {
    id: "alex",
    name: "Alex Thompson",
    avatar: "AT",
    color: "from-cyan-500 to-cyan-600",
    lastMessage: "The automation workflow saved us 4 hours today.",
    time: "Yesterday",
    unread: 0,
    messages: [
      {
        id: "12",
        sender: "Alex Thompson",
        message: "Just wanted to share - the automation workflow saved us 4 hours today.",
        time: "Yesterday",
        isMine: false,
      },
      {
        id: "13",
        sender: "You",
        message: "That's fantastic! Which workflow was it?",
        time: "Yesterday",
        isMine: true,
      },
      {
        id: "14",
        sender: "Alex Thompson",
        message: "The invoice processing one. It handled everything automatically!",
        time: "Yesterday",
        isMine: false,
      },
    ]
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    avatar: "JL",
    color: "from-pink-500 to-pink-600",
    lastMessage: "Can you check the new integration settings?",
    time: "Monday",
    unread: 1,
    messages: [
      {
        id: "15",
        sender: "Jordan Lee",
        message: "Hey! I set up the Salesforce integration.",
        time: "Monday",
        isMine: false,
      },
      {
        id: "16",
        sender: "You",
        message: "Great! Is it syncing properly?",
        time: "Monday",
        isMine: true,
      },
      {
        id: "17",
        sender: "Jordan Lee",
        message: "Can you check the new integration settings?",
        time: "Monday",
        isMine: false,
      },
    ]
  },
];

export function Dashboard() {
  const [openDialog, setOpenDialog] = useState<"workflows" | "automations" | "integrations" | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardView, setDashboardView] = useState<"tips" | "snapshot" | "automations" | "planner" | "messages" | "agents">("tips");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [messageInput, setMessageInput] = useState("");
  const [activeConversation, setActiveConversation] = useState("sarah");
  const [activeAgent, setActiveAgent] = useState("email-triage");
  const [taskInfoId, setTaskInfoId] = useState<string | null>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [pausedAgents, setPausedAgents] = useState<Set<string>>(new Set());
  const [aiSuggestionDialog, setAiSuggestionDialog] = useState<{ open: boolean; type: string | null; progress: number }>({
    open: false,
    type: null,
    progress: 0
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getStatusColor = (status: ActiveAgent["status"]) => {
    switch (status) {
      case "active": return "text-green-500";
      case "processing": return "text-blue-500";
      case "idle": return "text-gray-400";
    }
  };

  const getActivityStatusColor = (status: RecentActivity["status"]) => {
    switch (status) {
      case "success": return "bg-green-500/10 text-green-600";
      case "warning": return "bg-yellow-500/10 text-yellow-600";
      case "error": return "bg-red-500/10 text-red-600";
    }
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sample calendar data for different dates
  const calendarData: Record<string, Array<{
    type: 'meeting' | 'task' | 'opportunity';
    title: string;
    time: string;
    details: string;
    icon: any;
  }>> = {
    '2025-11-06': [
      { type: 'meeting', title: 'Team Standup', time: '9:00 AM - 9:30 AM', details: 'Zoom', icon: Video },
      { type: 'task', title: 'Review Q4 proposals', time: '10:00 AM', details: 'High priority', icon: CheckCircle2 },
      { type: 'opportunity', title: 'TechCorp - Enterprise Deal', time: '2:00 PM', details: '$250K opportunity', icon: DollarSign },
      { type: 'meeting', title: 'Client Review - Acme Corp', time: '3:00 PM - 4:00 PM', details: 'Conference Room B', icon: Users },
      { type: 'task', title: 'Follow up with 5 leads', time: '4:00 PM', details: 'Email campaign', icon: Mail },
      { type: 'opportunity', title: 'DesignHub - Product Launch', time: '5:00 PM', details: '$180K opportunity', icon: Sparkles },
      { type: 'task', title: 'Review CRM sync status', time: '6:00 PM', details: 'Check delayed syncs', icon: FileText },
    ],
    '2025-11-07': [
      { type: 'meeting', title: 'Product Strategy Meeting', time: '10:00 AM - 11:00 AM', details: 'Conference Room A', icon: Briefcase },
      { type: 'task', title: 'Update sales pipeline', time: '11:30 AM', details: 'CRM cleanup', icon: Database },
      { type: 'opportunity', title: 'StartupXYZ - Seed Round', time: '2:00 PM', details: '$500K opportunity', icon: DollarSign },
      { type: 'task', title: 'Prepare weekly report', time: '4:00 PM', details: 'Analytics review', icon: BarChart3 },
    ],
    '2025-11-08': [
      { type: 'meeting', title: 'Investor Presentation', time: '9:00 AM - 10:30 AM', details: 'Zoom', icon: Video },
      { type: 'task', title: 'Code review', time: '11:00 AM', details: 'PR #245', icon: Code },
      { type: 'meeting', title: 'Customer Success Call', time: '2:00 PM - 3:00 PM', details: 'BigClient Inc', icon: Users },
      { type: 'opportunity', title: 'FinTech Co - Partnership', time: '4:00 PM', details: '$300K opportunity', icon: Sparkles },
    ],
    '2025-11-10': [
      { type: 'task', title: 'Weekly planning', time: '9:00 AM', details: 'Set priorities', icon: Target },
      { type: 'meeting', title: 'All Hands Meeting', time: '10:00 AM - 11:00 AM', details: 'Company update', icon: Users },
      { type: 'task', title: 'Review automation workflows', time: '2:00 PM', details: 'Optimize processes', icon: Bot },
    ],
    '2025-11-12': [
      { type: 'meeting', title: 'Sprint Planning', time: '9:00 AM - 10:00 AM', details: 'Development team', icon: GitBranch },
      { type: 'task', title: 'Update documentation', time: '11:00 AM', details: 'Knowledge base', icon: BookOpen },
      { type: 'meeting', title: 'Sales Demo - ProCorp', time: '3:00 PM - 4:00 PM', details: 'Product demo', icon: Video },
      { type: 'opportunity', title: 'ProCorp - Enterprise License', time: '3:00 PM', details: '$450K opportunity', icon: DollarSign },
    ],
  };

  // Format date to match the calendar data keys
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDayActivities = calendarData[selectedDateKey] || [];

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Group activities by time of day
  const groupActivitiesByTimeOfDay = (activities: typeof selectedDayActivities) => {
    const morning: typeof activities = [];
    const afternoon: typeof activities = [];
    const evening: typeof activities = [];

    activities.forEach(activity => {
      const hour = parseInt(activity.time.split(':')[0]);
      if (hour < 12) {
        morning.push(activity);
      } else if (hour < 17) {
        afternoon.push(activity);
      } else {
        evening.push(activity);
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupActivitiesByTimeOfDay(selectedDayActivities);

  // Calculate stats for selected day
  const selectedDayStats = {
    meetings: selectedDayActivities.filter(a => a.type === 'meeting').length,
    tasks: selectedDayActivities.filter(a => a.type === 'task').length,
    opportunities: selectedDayActivities.filter(a => a.type === 'opportunity').length,
    estRevenue: selectedDayActivities
      .filter(a => a.type === 'opportunity')
      .reduce((sum, a) => {
        const match = a.details.match(/\$([0-9]+)K/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0),
  };

  // Get all dates that have events
  const datesWithEvents = Object.keys(calendarData).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your AI agents and workflows.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="outline" className="bg-gradient-to-br from-blue-500/10 to-blue-500/20 text-blue-600 border-0 rounded-full px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            {activeAgents.filter(a => a.status !== "idle" && !pausedAgents.has(a.id)).length} Active Agents
          </Badge>
          <Badge variant="outline" className="bg-gradient-to-br from-green-500/10 to-green-500/20 text-green-600 border-0 rounded-full px-4 py-2">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            1,247 Tasks Completed
          </Badge>
          <Badge variant="outline" className="bg-gradient-to-br from-purple-500/10 to-purple-500/20 text-purple-600 border-0 rounded-full px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            342 Hours Saved
          </Badge>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="flex justify-center mb-6">
        <Tabs value={dashboardView} onValueChange={(v) => setDashboardView(v as any)} className="w-auto">
          <TabsList className="bg-background/80 backdrop-blur-lg border border-border rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 grid grid-cols-6 gap-1">
            <TabsTrigger value="tips" className="text-xs rounded-full px-4 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
              Tips
              {proTips.length > 0 && (
                <Badge className="ml-2 mr-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-purple-500 border-0">
                  {proTips.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="snapshot" className="text-xs rounded-full px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Snapshot
              {aiSnapshots.filter(i => !dismissedInsights.has(i.id)).length > 0 && (
                <Badge className="ml-2 mr-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-blue-500 border-0">
                  {aiSnapshots.filter(i => !dismissedInsights.has(i.id)).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs rounded-full px-4 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="planner" className="text-xs rounded-full px-4 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Planner
              {plannerTasks.filter(t => !completedTasks.has(t.id)).length > 0 && (
                <Badge className="ml-2 mr-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-orange-500 border-0">
                  {plannerTasks.filter(t => !completedTasks.has(t.id)).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs rounded-full px-4 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs rounded-full px-4 data-[state=active]:bg-emerald-400 data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              Agents
              {agentConversations.filter(c => c.unread > 0).length > 0 && (
                <Badge className="ml-2 mr-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-emerald-400 border-0">
                  {agentConversations.reduce((sum, c) => sum + c.unread, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Card */}
      <Card className="p-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-0 rounded-2xl overflow-hidden">

        <ScrollArea className="h-[500px]">
          {/* Pro Tips View */}
          {dashboardView === "tips" && (
              <div className="p-6">
                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left: AI-Powered QA */}
                  <div className="border rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50 min-h-[360px] flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm">Ask Your AI Assistant</h3>
                          <p className="text-xs text-muted-foreground">Get instant help with blockers, questions, or needs</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Chat Interface */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="space-y-2">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-purple-100">
                          <p className="text-xs text-muted-foreground mb-2">💬 Example questions:</p>
                          <div className="space-y-1.5">
                            <button className="w-full text-left text-xs px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-900">
                              "How can I automate my email follow-ups?"
                            </button>
                            <button className="w-full text-left text-xs px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-900">
                              "What's blocking my lead conversion?"
                            </button>
                            <button className="w-full text-left text-xs px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-900">
                              "Show me what I should focus on today"
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="mt-auto">
                        <div className="relative">
                          <Input 
                            placeholder="Ask me anything about your workflows, tasks, or data..." 
                            className="pr-10 bg-white/80 backdrop-blur-sm border-purple-200 focus-visible:ring-purple-500"
                          />
                          <Button 
                            size="sm" 
                            className="absolute right-1 top-1 h-7 w-7 p-0 bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          AI analyzes your data in real-time to provide personalized insights
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: One-Click Solutions */}
                  <div className="border rounded-2xl p-6 bg-gradient-to-br from-cyan-50/50 to-green-50/50 min-h-[360px] flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm">Quick Actions</h3>
                          <p className="text-xs text-muted-foreground">One-click solutions to solve your needs instantly</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Cards */}
                    <ScrollArea className="flex-1 -mr-4 pr-4">
                      <div className="space-y-2.5">
                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'follow-up', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-cyan-100 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Mail className="h-4 w-4 text-cyan-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">Auto-respond to 12 emails</p>
                              <p className="text-xs text-muted-foreground">Save ~45 min • Drafts ready for review</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'meeting-prep', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-green-100 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Briefcase className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">Generate meeting brief for 3pm call</p>
                              <p className="text-xs text-muted-foreground">TechCorp • Context from 8 sources</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'lead-score', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Target className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">Score and prioritize 5 new leads</p>
                              <p className="text-xs text-muted-foreground">AI confidence: High • Ready to assign</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'crm-sync', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-100 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Database className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">Sync 24 contacts to Salesforce</p>
                              <p className="text-xs text-muted-foreground">Updated data • Resolve duplicates</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'digest', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-orange-100 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <FileText className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">Create daily action digest</p>
                              <p className="text-xs text-muted-foreground">Top 10 priorities • Morning summary</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Bottom Ticker */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Real-time activity</p>
                  </div>

                </div>
              </div>
            )}

          {/* AI Snapshot View */}
          {dashboardView === "snapshot" && (
              <div className="p-8 space-y-6">
                {/* Header with timestamp */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="mb-1">AI Intelligence Brief</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live analysis • Updated just now</span>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">AI analyzes your activity, platform data,</p>
                        <p className="text-xs">and industry trends in real-time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Quick Wins */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm">Quick Wins</h4>
                          <p className="text-xs text-muted-foreground">Ready to act on now</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">3 high-value leads need follow-up</p>
                            <p className="text-xs text-muted-foreground mt-1">Qualified in last 24h • Avg. deal size $24k</p>
                            <Button size="sm" className="h-7 text-xs mt-2 bg-green-600 hover:bg-green-700">
                              Review Leads
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">12 emails can be auto-responded</p>
                            <p className="text-xs text-muted-foreground mt-1">Save ~45 minutes • Drafts ready for review</p>
                            <Button size="sm" className="h-7 text-xs mt-2 bg-green-600 hover:bg-green-700">
                              Review Drafts
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">Meeting prep brief ready for 3pm call</p>
                            <p className="text-xs text-muted-foreground mt-1">With TechCorp • Context from 8 sources</p>
                            <Button size="sm" className="h-7 text-xs mt-2 bg-green-600 hover:bg-green-700">
                              View Brief
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Trend (Positive) */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm">Top Positive Trend</h4>
                          <p className="text-xs text-muted-foreground">What's working</p>
                        </div>
                      </div>
                      <Card className="p-4 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <Badge className="bg-blue-600 text-white border-0 mb-2">+45%</Badge>
                            <p className="text-sm">Email response time decreased</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-500 opacity-40" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Your Email Triage Agent is processing high-priority emails 45% faster this week. Customer satisfaction scores increased from 4.2 to 4.7.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-blue-200 hover:bg-blue-100">
                            View Analytics
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          <span className="text-[10px] text-muted-foreground">Based on last 7 days</span>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Key Insights */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm">Key Insights</h4>
                          <p className="text-xs text-muted-foreground">What the AI sees</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">Lead qualification rate improved 28% after implementing new scoring criteria</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">Meeting notes agent detected 5 action items across today's calls — all assigned</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">CRM data quality score: 94% (up from 87% last month)</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">Invoice processing time reduced to avg. 4.2 minutes (down from 12 minutes)</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">Workflow automation saved 2.5 hours today — on track for 62 hours this month</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm">AI Suggestions</h4>
                          <p className="text-xs text-muted-foreground">Click to let AI do it</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'follow-up', progress: 0 });
                            // Simulate progress
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-br from-cyan-500/10 to-cyan-500/20 border border-cyan-200 text-xs text-cyan-700 hover:from-cyan-500/20 hover:to-cyan-500/30 hover:border-cyan-300 transition-all hover:shadow-md"
                        >
                          <Zap className="h-3 w-3 inline mr-1.5" />
                          Auto follow-up sequence
                        </button>
                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'digest', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/20 border border-purple-200 text-xs text-purple-700 hover:from-purple-500/20 hover:to-purple-500/30 hover:border-purple-300 transition-all hover:shadow-md"
                        >
                          <Bell className="h-3 w-3 inline mr-1.5" />
                          Daily action digest
                        </button>
                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'meeting-prep', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-500/20 border border-blue-200 text-xs text-blue-700 hover:from-blue-500/20 hover:to-blue-500/30 hover:border-blue-300 transition-all hover:shadow-md"
                        >
                          <Briefcase className="h-3 w-3 inline mr-1.5" />
                          Auto meeting prep
                        </button>
                        <button
                          onClick={() => {
                            setAiSuggestionDialog({ open: true, type: 'lead-score', progress: 0 });
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 15;
                              setAiSuggestionDialog(prev => ({ ...prev, progress }));
                              if (progress >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                                }, 1500);
                              }
                            }, 400);
                          }}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/20 border border-green-200 text-xs text-green-700 hover:from-green-500/20 hover:to-green-500/30 hover:border-green-300 transition-all hover:shadow-md"
                        >
                          <Target className="h-3 w-3 inline mr-1.5" />
                          Smart lead scoring
                        </button>
                      </div>
                    </div>

                    {/* Top Trend (Negative/Watch) */}
                    <div className="mt-16">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm">Area to Watch</h4>
                          <p className="text-xs text-muted-foreground">Potential issue detected</p>
                        </div>
                      </div>
                      <Card className="p-4 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <Badge className="bg-orange-600 text-white border-0 mb-2">-18%</Badge>
                            <p className="text-sm">Deal conversion rate dip</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-orange-500 opacity-40" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Conversion from qualified lead to deal down 18% this week. Average follow-up time increased from 2.1 to 3.4 days. AI suggests prioritizing faster outreach.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-orange-200 hover:bg-orange-100">
                            See Recommendations
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          <span className="text-[10px] text-muted-foreground">Detected 2 days ago</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

              </div>
            )}

          {/* Automations View (Problem → Solution) */}
          {dashboardView === "automations" && (
              <div className="p-6">
                {/* Problem-Solution Pairs */}
                <div className="space-y-4 mb-6">
                  {/* Row 1 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-red-50/50 to-orange-50/50 min-h-[100px] flex items-center">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Inbox Overwhelm</h4>
                          <p className="text-xs text-muted-foreground">47 unread high-priority emails are piling up, causing response delays and potentially missed opportunities</p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <button
                      onClick={() => {
                        setAiSuggestionDialog({ open: true, type: 'email-triage', progress: 0 });
                        let progress = 0;
                        const interval = setInterval(() => {
                          progress += 15;
                          setAiSuggestionDialog(prev => ({ ...prev, progress }));
                          if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                              setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                            }, 1500);
                          }
                        }, 400);
                      }}
                      className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50 min-h-[100px] flex items-center hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm mb-1">Email Triage Agent</h4>
                          <p className="text-xs text-muted-foreground">Auto-categorize, draft responses, and queue for your review — save ~2 hours</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 min-h-[100px] flex items-center">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Manual Lead Scoring</h4>
                          <p className="text-xs text-muted-foreground">15 new leads need qualification, but manually researching each takes 20+ minutes per lead</p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <button
                      onClick={() => {
                        setAiSuggestionDialog({ open: true, type: 'lead-score', progress: 0 });
                        let progress = 0;
                        const interval = setInterval(() => {
                          progress += 15;
                          setAiSuggestionDialog(prev => ({ ...prev, progress }));
                          if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                              setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                            }, 1500);
                          }
                        }, 400);
                      }}
                      className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 min-h-[100px] flex items-center hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm mb-1">Smart Lead Qualifier</h4>
                          <p className="text-xs text-muted-foreground">AI enriches data, scores leads by fit, and prioritizes — ready in 3 minutes</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 min-h-[100px] flex items-center">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Meeting Prep Takes Forever</h4>
                          <p className="text-xs text-muted-foreground">Upcoming client call in 1 hour — need to review emails, past notes, and CRM history</p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <button
                      onClick={() => {
                        setAiSuggestionDialog({ open: true, type: 'meeting-prep', progress: 0 });
                        let progress = 0;
                        const interval = setInterval(() => {
                          progress += 15;
                          setAiSuggestionDialog(prev => ({ ...prev, progress }));
                          if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                              setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                            }, 1500);
                          }
                        }, 400);
                      }}
                      className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-violet-50/50 to-purple-50/50 min-h-[100px] flex items-center hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm mb-1">Meeting Prep Agent</h4>
                          <p className="text-xs text-muted-foreground">Auto-generate context brief from 8 sources — delivered in 2 minutes</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Row 4 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-orange-50/50 to-red-50/50 min-h-[100px] flex items-center">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                          <Database className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">CRM Data is Messy</h4>
                          <p className="text-xs text-muted-foreground">34 duplicate contacts, missing fields, and outdated info — data quality at 67%</p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <button
                      onClick={() => {
                        setAiSuggestionDialog({ open: true, type: 'crm-clean', progress: 0 });
                        let progress = 0;
                        const interval = setInterval(() => {
                          progress += 15;
                          setAiSuggestionDialog(prev => ({ ...prev, progress }));
                          if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                              setAiSuggestionDialog({ open: false, type: null, progress: 0 });
                            }, 1500);
                          }
                        }, 400);
                      }}
                      className="flex-1 border rounded-2xl p-5 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 min-h-[100px] flex items-center hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm mb-1">CRM Data Cleaner</h4>
                          <p className="text-xs text-muted-foreground">Merge duplicates, enrich fields, update info — boost to 94% quality</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Bottom Ticker */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Active automation stats</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100">
                      <p className="text-xs text-muted-foreground">Automations Running</p>
                      <p className="text-lg text-green-600">8</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                      <p className="text-xs text-muted-foreground">Tasks Automated</p>
                      <p className="text-lg text-blue-600">1,247</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-lg text-purple-600">98.5%</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100">
                      <p className="text-xs text-muted-foreground">Hours Saved</p>
                      <p className="text-lg text-orange-600">342</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100">
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                      <p className="text-lg text-cyan-600">4.2m</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Planner View */}
          {dashboardView === "planner" && (
            <div className="p-6">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left: Monthly Calendar */}
                <div className="border rounded-2xl p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-sm mb-2">Monthly Overview</h3>
                    <p className="text-xs text-muted-foreground">Select a day to view details</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-lg border-0 scale-110"
                      modifiers={{
                        hasEvents: datesWithEvents
                      }}
                      modifiersClassNames={{
                        hasEvents: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-[2px] after:bg-blue-500 after:rounded-full'
                      }}
                    />
                  </div>
                </div>

                {/* Right: Daily View */}
                <div className="border rounded-2xl p-6 bg-gradient-to-br from-green-50/30 to-cyan-50/30 min-h-[400px]">
                  <div className="mb-4">
                    <h3 className="text-sm mb-1">
                      {selectedDate.toDateString() === new Date().toDateString() 
                        ? `Today, ${formatDateDisplay(selectedDate)}`
                        : formatDateDisplay(selectedDate)
                      }
                    </h3>
                    <p className="text-xs text-muted-foreground">All events, tasks, and opportunities</p>
                  </div>

                  <ScrollArea className="h-[340px] -mr-4 pr-4">
                    {selectedDayActivities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No activities scheduled for this day</p>
                        <p className="text-xs text-muted-foreground mt-1">Select another date to view activities</p>
                      </div>
                    ) : (
                    <div className="space-y-3">
                      {/* Morning Section */}
                      {morning.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Morning</p>
                          <div className="space-y-2">
                            {morning.map((activity, idx) => (
                              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border ${
                                activity.type === 'meeting' ? 'border-blue-100' : 
                                activity.type === 'task' ? 'border-green-100' : 
                                'border-purple-100'
                              } hover:shadow-sm transition-all`}>
                                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                                  activity.type === 'meeting' ? 'from-blue-500 to-blue-600' : 
                                  activity.type === 'task' ? 'from-green-500 to-green-600' : 
                                  'from-purple-500 to-purple-600'
                                } flex items-center justify-center shrink-0`}>
                                  <activity.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">{activity.time} • {activity.details}</p>
                                </div>
                                <Badge className={`${
                                  activity.type === 'meeting' ? 'bg-blue-500/10 text-blue-600' : 
                                  activity.type === 'task' ? 'bg-green-500/10 text-green-600' : 
                                  'bg-purple-500/10 text-purple-600'
                                } border-0 text-xs shrink-0 capitalize`}>{activity.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Section */}
                      {afternoon.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Afternoon</p>
                          <div className="space-y-2">
                            {afternoon.map((activity, idx) => (
                              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border ${
                                activity.type === 'meeting' ? 'border-blue-100' : 
                                activity.type === 'task' ? 'border-green-100' : 
                                'border-purple-100'
                              } hover:shadow-sm transition-all`}>
                                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                                  activity.type === 'meeting' ? 'from-blue-500 to-blue-600' : 
                                  activity.type === 'task' ? 'from-green-500 to-green-600' : 
                                  'from-purple-500 to-purple-600'
                                } flex items-center justify-center shrink-0`}>
                                  <activity.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">{activity.time} • {activity.details}</p>
                                </div>
                                <Badge className={`${
                                  activity.type === 'meeting' ? 'bg-blue-500/10 text-blue-600' : 
                                  activity.type === 'task' ? 'bg-green-500/10 text-green-600' : 
                                  'bg-purple-500/10 text-purple-600'
                                } border-0 text-xs shrink-0 capitalize`}>{activity.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evening Section */}
                      {evening.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Evening</p>
                          <div className="space-y-2">
                            {evening.map((activity, idx) => (
                              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border ${
                                activity.type === 'meeting' ? 'border-blue-100' : 
                                activity.type === 'task' ? 'border-green-100' : 
                                'border-purple-100'
                              } hover:shadow-sm transition-all`}>
                                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                                  activity.type === 'meeting' ? 'from-blue-500 to-blue-600' : 
                                  activity.type === 'task' ? 'from-green-500 to-green-600' : 
                                  'from-purple-500 to-purple-600'
                                } flex items-center justify-center shrink-0`}>
                                  <activity.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">{activity.time} • {activity.details}</p>
                                </div>
                                <Badge className={`${
                                  activity.type === 'meeting' ? 'bg-blue-500/10 text-blue-600' : 
                                  activity.type === 'task' ? 'bg-green-500/10 text-green-600' : 
                                  'bg-purple-500/10 text-purple-600'
                                } border-0 text-xs shrink-0 capitalize`}>{activity.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              {/* Bottom Ticker */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {selectedDate.toDateString() === new Date().toDateString() 
                      ? "Today's overview"
                      : "Selected day overview"
                    }
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                    <p className="text-xs text-muted-foreground">Meetings</p>
                    <p className="text-lg text-blue-600">{selectedDayStats.meetings}</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100">
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="text-lg text-green-600">{selectedDayStats.tasks}</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                    <p className="text-xs text-muted-foreground">Opportunities</p>
                    <p className="text-lg text-purple-600">{selectedDayStats.opportunities}</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100">
                    <p className="text-xs text-muted-foreground">Est. Revenue</p>
                    <p className="text-lg text-orange-600">${selectedDayStats.estRevenue}K</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100">
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                    <p className="text-lg text-cyan-600">87%</p>
                  </div>
                </div>
              </div>
            </div>
            )}

          {/* Messages View (iOS Style) */}
          {dashboardView === "messages" && (
              <div className="flex h-[500px]">
                {/* Left: Conversation List (1/3) */}
                <div className="w-1/3 border-r flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="text-sm">Messages</h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => setActiveConversation(conversation.id)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                            activeConversation === conversation.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${conversation.color} flex items-center justify-center shrink-0 text-white`}>
                            {conversation.avatar}
                          </div>
                          
                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0 text-left pr-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm truncate flex-1">{conversation.name}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{conversation.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">{conversation.lastMessage}</p>
                              {conversation.unread > 0 && (
                                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] text-white">{conversation.unread}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Active Conversation (2/3) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Conversation Header */}
                  <div className="p-4 border-b flex items-center gap-3 shrink-0">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${conversations.find(c => c.id === activeConversation)?.color} flex items-center justify-center shrink-0 text-white`}>
                      {conversations.find(c => c.id === activeConversation)?.avatar}
                    </div>
                    <div>
                      <p className="text-sm">{conversations.find(c => c.id === activeConversation)?.name}</p>
                      <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <div className="space-y-3">
                      {conversations.find(c => c.id === activeConversation)?.messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          {!msg.isMine && (
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${conversations.find(c => c.id === activeConversation)?.color} flex items-center justify-center shrink-0 text-white text-xs mt-1`}>
                              {conversations.find(c => c.id === activeConversation)?.avatar}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`flex flex-col max-w-[70%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                            {!msg.isMine && (
                              <span className="text-xs text-muted-foreground mb-1 px-3">{msg.sender}</span>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              msg.isMine 
                                ? 'bg-blue-500 text-white rounded-br-sm' 
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</span>
                          </div>

                          {/* Spacer for alignment */}
                          {msg.isMine && <div className="w-8 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input Area */}
                  <div className="border-t bg-white p-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Message the team..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && messageInput.trim()) {
                            // Here you would add the message to the list
                            setMessageInput('');
                          }
                        }}
                        className="flex-1 rounded-full border-gray-300 focus-visible:ring-blue-500"
                      />
                      <Button 
                        size="icon" 
                        className="rounded-full h-9 w-9 bg-blue-500 hover:bg-blue-600"
                        disabled={!messageInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Agents View (iOS Style - Chat with AI Agents) */}
          {dashboardView === "agents" && (
              <div className="flex h-[500px]">
                {/* Left: Agent List (1/3) */}
                <div className="w-1/3 border-r flex flex-col min-w-0">
                  <div className="p-4 border-b flex-shrink-0">
                    <h3 className="text-sm">AI Agents</h3>
                    <p className="text-xs text-muted-foreground mt-1">Chat with your autonomous agents</p>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {agentConversations.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => setActiveAgent(agent.id)}
                          className={`w-full flex items-start gap-2 p-2.5 rounded-lg hover:bg-gray-50 transition-colors ${
                            activeAgent === agent.id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center shrink-0 text-white text-xs`}>
                            {agent.avatar}
                          </div>
                          
                          {/* Agent Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className="text-xs truncate flex-1 min-w-0">{agent.name}</p>
                              {agent.unread > 0 && (
                                <div className="h-4 w-4 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] text-white">{agent.unread}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{agent.lastMessage}</p>
                            <span className="text-[9px] text-muted-foreground">{agent.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Active Agent Conversation (2/3) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Agent Header */}
                  <div className="p-4 border-b flex items-center gap-3 shrink-0">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${agentConversations.find(a => a.id === activeAgent)?.color} flex items-center justify-center shrink-0 text-white`}>
                      {agentConversations.find(a => a.id === activeAgent)?.avatar}
                    </div>
                    <div>
                      <p className="text-sm">{agentConversations.find(a => a.id === activeAgent)?.name}</p>
                      <p className="text-xs text-muted-foreground">{agentConversations.find(a => a.id === activeAgent)?.type}</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <div className="space-y-3">
                      {agentConversations.find(a => a.id === activeAgent)?.messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          {!msg.isMine && (
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${agentConversations.find(a => a.id === activeAgent)?.color} flex items-center justify-center shrink-0 text-white text-xs mt-1`}>
                              {agentConversations.find(a => a.id === activeAgent)?.avatar}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`flex flex-col max-w-[70%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                            {!msg.isMine && (
                              <span className="text-xs text-muted-foreground mb-1 px-3">{msg.sender}</span>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              msg.isMine 
                                ? 'bg-emerald-400 text-white rounded-br-sm' 
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</span>
                          </div>

                          {/* Spacer for alignment */}
                          {msg.isMine && <div className="w-8 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input Area */}
                  <div className="border-t bg-white p-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Message your agent..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && messageInput.trim()) {
                            // Here you would add the message to the list
                            setMessageInput('');
                          }
                        }}
                        className="flex-1 rounded-full border-gray-300 focus-visible:ring-emerald-400"
                      />
                      <Button 
                        size="icon" 
                        className="rounded-full h-9 w-9 bg-emerald-400 hover:bg-emerald-500"
                        disabled={!messageInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </ScrollArea>
      </Card>

      {/* Stock Ticker */}
      <StockTicker />

      {/* Workflows Dialog */}
      <Dialog open={openDialog === "workflows"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="!w-[95vw] !max-w-[1800px] h-[90vh] p-0 flex flex-col sm:!max-w-[1800px]">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Active Workflows</DialogTitle>
                <DialogDescription>
                  Visual overview of your automated workflows
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Workflows List */}
            <div className="w-80 border-r flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {workflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${
                        selectedWorkflow === workflow.id
                          ? "bg-blue-500/5 ring-2 ring-blue-500/20"
                          : ""
                      }`}
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm">{workflow.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs border-0 rounded-full ${
                            workflow.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              workflow.status === "active"
                                ? "bg-green-600"
                                : "bg-blue-600 animate-pulse"
                            }`}
                          />
                          {workflow.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{workflow.triggers} triggers</span>
                        <span>{workflow.actions} actions</span>
                        <span>{workflow.runs} runs</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Workflow Visualizer */}
            <div className="flex-1 relative min-h-0">
              {selectedWorkflow ? (
                <div className="absolute inset-0 p-8">
                  <div className="h-full rounded-xl border bg-gradient-to-br from-background/95 via-background/80 to-background/95 relative overflow-hidden">
                    {/* Dot Grid Background */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />

                    {/* Workflow Nodes */}
                    <div className="relative h-full flex items-center justify-center p-12">
                      <svg
                        className="absolute inset-0 pointer-events-none"
                        style={{ width: "100%", height: "100%" }}
                      >
                        {workflows
                          .find((w) => w.id === selectedWorkflow)
                          ?.nodes.map((node, idx, arr) => {
                            if (idx === arr.length - 1) return null;
                            const nextNode = arr[idx + 1];
                            return (
                              <line
                                key={idx}
                                x1={node.position.x + 60}
                                y1={node.position.y + 40}
                                x2={nextNode.position.x + 60}
                                y2={nextNode.position.y + 40}
                                stroke="#6366f1"
                                strokeWidth="2"
                                opacity="0.4"
                                strokeDasharray="5,5"
                              />
                            );
                          })}
                      </svg>

                      <div className="relative flex items-center gap-12">
                        {workflows
                          .find((w) => w.id === selectedWorkflow)
                          ?.nodes.map((node, idx) => (
                            <div key={node.id} className="flex flex-col items-center gap-3">
                              <div className="relative">
                                <div
                                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${
                                    node.type === "trigger"
                                      ? "from-blue-500 to-blue-600"
                                      : node.type === "filter"
                                      ? "from-yellow-500 to-yellow-600"
                                      : "from-purple-500 to-purple-600"
                                  } shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform`}
                                >
                                  <node.icon className="h-8 w-8 text-white" />
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-2 bg-gradient-to-br from-purple-500/20 to-purple-500/10 blur-sm rounded-full" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm">{node.label}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {node.type}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Select a workflow to view details
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Automations Dialog */}
      <Dialog open={openDialog === "automations"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="!w-[95vw] !max-w-[1800px] h-[90vh] p-0 flex flex-col sm:!max-w-[1800px]">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle>AI Automations</DialogTitle>
            <DialogDescription>
              Smart tasks that run automatically based on triggers
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-4">
              {automations.map((automation) => (
                <Card
                  key={automation.id}
                  className="p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_6px_30px_rgb(0,0,0,0.08)] transition-all"
                >
                  <div className="flex gap-6">
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${
                        automation.color === "green"
                          ? "from-green-500 to-green-600"
                          : automation.color === "blue"
                          ? "from-blue-500 to-blue-600"
                          : automation.color === "purple"
                          ? "from-purple-500 to-purple-600"
                          : "from-orange-500 to-orange-600"
                      } shadow-lg flex items-center justify-center shrink-0`}
                    >
                      <automation.icon className="h-7 w-7 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4>{automation.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Runs {automation.frequency}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 border-0 rounded-full"
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Trigger</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="h-4 w-4 text-blue-500" />
                            <span>{automation.trigger}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Actions</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {automation.actions.map((action, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-muted border-0 text-xs rounded-full"
                                >
                                  {idx + 1}. {action}
                                </Badge>
                                {idx < automation.actions.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Integrations Marketplace Dialog */}
      <Dialog open={openDialog === "integrations"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="!w-[95vw] !max-w-[1800px] h-[90vh] p-0 flex flex-col sm:!max-w-[1800px]">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <div className="space-y-4">
              <div>
                <DialogTitle>Integration Marketplace</DialogTitle>
                <DialogDescription>
                  Connect your favorite tools and services to GalaxyCo.ai
                </DialogDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  All
                </Badge>
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  Email
                </Badge>
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  CRM
                </Badge>
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  Communication
                </Badge>
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  Development
                </Badge>
                <Badge variant="outline" className="rounded-full cursor-pointer hover:bg-accent">
                  Social Media
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                  <Card
                    key={integration.id}
                    className="p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_6px_30px_rgb(0,0,0,0.08)] transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${integration.color} shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <integration.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate">{integration.name}</h4>
                          {integration.connected && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 rounded-full shrink-0">
                              <Check className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {integration.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {integration.description}
                    </p>

                    <Button
                      variant={integration.connected ? "outline" : "default"}
                      size="sm"
                      className="w-full rounded-full"
                    >
                      {integration.connected ? (
                        <>
                          <Check className="h-3 w-3 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Plug className="h-3 w-3 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Task Info Dialog */}
      <Dialog open={taskInfoId !== null} onOpenChange={(open) => !open && setTaskInfoId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {taskInfoId && (() => {
            const task = plannerTasks.find(t => t.id === taskInfoId);
            if (!task) return null;
            return (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                    task.priority === 'high' ? 'from-red-500/10 to-red-500/20' : 'from-blue-500/10 to-blue-500/20'
                  } flex items-center justify-center shrink-0`}>
                    <task.icon className={`h-6 w-6 ${
                      task.priority === 'high' ? 'text-red-500' : 'text-blue-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4>{task.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scheduled Time</p>
                    <p className="text-sm">{task.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <Badge variant="outline" className={`${
                      task.priority === 'high' 
                        ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {task.priority === 'high' ? 'High' : 'Medium'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setTaskInfoId(null)}
                  >
                    Close
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setCompletedTasks(prev => {
                        const newSet = new Set(prev);
                        newSet.add(task.id);
                        return newSet;
                      });
                      setTaskInfoId(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* AI Suggestion Dialog */}
      <Dialog open={aiSuggestionDialog.open} onOpenChange={(open) => !open && setAiSuggestionDialog({ open: false, type: null, progress: 0 })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {aiSuggestionDialog.progress < 100 ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  AI is setting this up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Done!
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {aiSuggestionDialog.progress < 100 
                ? 'Please wait while the AI configures your automation' 
                : 'Your automation has been successfully configured and is now active'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {aiSuggestionDialog.type === 'follow-up' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <Zap className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm">Automated Follow-up Sequence</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiSuggestionDialog.progress < 100 
                        ? 'Creating intelligent follow-up workflow for qualified leads...' 
                        : 'Follow-up automation is now active! 3 leads are queued for outreach.'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {aiSuggestionDialog.type === 'digest' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/20 flex items-center justify-center shrink-0">
                    <Bell className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm">Daily Action Digest</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiSuggestionDialog.progress < 100 
                        ? 'Configuring daily summary of pending action items...' 
                        : 'Daily digest configured! You\'ll receive your first summary at 8am tomorrow.'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {aiSuggestionDialog.type === 'meeting-prep' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/20 flex items-center justify-center shrink-0">
                    <Briefcase className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm">Auto Meeting Prep</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiSuggestionDialog.progress < 100 
                        ? 'Setting up automated meeting preparation workflow...' 
                        : 'Meeting prep automation active! AI will prepare briefs 1 hour before each meeting.'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {aiSuggestionDialog.type === 'lead-score' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center shrink-0">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm">Smart Lead Scoring</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiSuggestionDialog.progress < 100 
                        ? 'Enabling AI-powered lead scoring system...' 
                        : 'Lead scoring is live! All new leads will be automatically scored and prioritized.'}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{aiSuggestionDialog.progress}%</span>
              </div>
              <Progress value={aiSuggestionDialog.progress} className="h-2" />
            </div>

            {aiSuggestionDialog.progress === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-700">
                    Automation is now running in the background. You can view it in the Automations tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
