"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Sparkles,
  FileText,
  Mail,
  Target,
  Calendar,
  Users,
  TrendingUp,
  Zap,
  Plus,
  X,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Filter,
  RefreshCw,
  Bell,
  Code,
  Database,
  MessageSquare,
  Activity,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Save,
  Settings,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'templates' | 'create' | 'my-agents';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: typeof Bot;
  iconColor: string;
  nodeCount: number;
  valueScore: number;
  difficulty: "Easy" | "Medium" | "Advanced";
}

interface AgentNode {
  id: string;
  type: "trigger" | "action" | "condition" | "llm" | "tool";
  title: string;
  description: string;
  icon: typeof Bot;
  iconColor: string;
}

interface MyAgent {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  icon: typeof Bot;
  iconColor: string;
  nodeCount: number;
  lastRun?: string;
  runsCount?: number;
}

interface StudioDashboardProps {
  initialTab?: TabType;
}

export default function StudioDashboard({ initialTab = 'templates' }: StudioDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("email-assistant");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [createChatMessages, setCreateChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [createChatInput, setCreateChatInput] = useState("");
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentFlow, setAgentFlow] = useState<AgentNode[]>([]);
  const [agentData, setAgentData] = useState({
    name: "",
    description: "",
    purpose: "",
    problem: "",
    trigger: "",
    dataSources: "",
    integrations: "",
    logic: "",
    errorHandling: "",
    output: "",
  });
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [isDeletingWorkflow, setIsDeletingWorkflow] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  // Fetch workflows from API
  const { data: workflowsData, error: workflowsError, mutate: mutateWorkflows, isLoading: isLoadingWorkflows } = useSWR('/api/workflows', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const workflows = workflowsData?.workflows || [];

  // Calculate stats from real data
  const stats = {
    totalTemplates: 8,
    totalAgents: workflows.length,
    activeAgents: workflows.filter((w: any) => w.status === 'active').length,
    totalRuns: workflows.reduce((sum: number, w: any) => sum + (w.executionCount || 0), 0),
  };

  // Stat badges
  const statBadges = [
    { label: `${stats.totalTemplates} Templates`, icon: FileText, color: "bg-blue-100 text-blue-700" },
    { label: `${stats.totalAgents} Agents`, icon: Bot, color: "bg-purple-100 text-purple-700" },
    { label: `${stats.activeAgents} Active`, icon: Activity, color: "bg-green-100 text-green-700" },
  ];

  // Tab configuration
  const tabs = [
    { id: 'templates' as TabType, label: 'Templates', icon: FileText, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'create' as TabType, label: 'Create', icon: Plus, activeColor: 'bg-green-100 text-green-700' },
    { id: 'my-agents' as TabType, label: 'My Agents', icon: Bot, activeColor: 'bg-purple-100 text-purple-700' },
  ];

  // Agent Templates
  const agentTemplates: AgentTemplate[] = [
    {
      id: "email-assistant",
      name: "Email Assistant",
      description: "Automatically triage, respond to, and manage emails",
      category: "Communication",
      icon: Mail,
      iconColor: "bg-blue-500",
      nodeCount: 5,
      valueScore: 10,
      difficulty: "Easy" as const,
    },
    {
      id: "lead-qualifier",
      name: "Lead Qualifier",
      description: "AI analyzes and scores leads based on fit and engagement",
      category: "Sales",
      icon: Target,
      iconColor: "bg-purple-500",
      nodeCount: 6,
      valueScore: 9,
      difficulty: "Easy" as const,
    },
    {
      id: "meeting-prep",
      name: "Meeting Prep Agent",
      description: "Auto-generate meeting briefs from contact history",
      category: "Productivity",
      icon: Calendar,
      iconColor: "bg-green-500",
      nodeCount: 4,
      valueScore: 9,
      difficulty: "Easy" as const,
    },
    {
      id: "data-sync",
      name: "Data Sync Agent",
      description: "Automatically sync data across platforms and resolve duplicates",
      category: "Integration",
      icon: RefreshCw,
      iconColor: "bg-cyan-500",
      nodeCount: 5,
      valueScore: 8,
      difficulty: "Medium" as const,
    },
    {
      id: "content-generator",
      name: "Content Generator",
      description: "Generate marketing content, articles, and documentation",
      category: "Marketing",
      icon: FileText,
      iconColor: "bg-orange-500",
      nodeCount: 4,
      valueScore: 8,
      difficulty: "Easy" as const,
    },
    {
      id: "analytics-agent",
      name: "Analytics Agent",
      description: "Analyze data, generate insights, and create reports",
      category: "Analytics",
      icon: TrendingUp,
      iconColor: "bg-indigo-500",
      nodeCount: 6,
      valueScore: 7,
      difficulty: "Advanced" as const,
    },
    {
      id: "customer-support",
      name: "Customer Support Agent",
      description: "Handle customer inquiries and route to appropriate teams",
      category: "Support",
      icon: MessageSquare,
      iconColor: "bg-pink-500",
      nodeCount: 5,
      valueScore: 9,
      difficulty: "Medium" as const,
    },
    {
      id: "task-automation",
      name: "Task Automation Agent",
      description: "Automate repetitive tasks and workflows",
      category: "Automation",
      icon: Zap,
      iconColor: "bg-amber-500",
      nodeCount: 4,
      valueScore: 8,
      difficulty: "Easy" as const,
    },
  ].sort((a, b) => {
    if (b.valueScore !== a.valueScore) {
      return b.valueScore - a.valueScore;
    }
    const difficultyOrder: Record<string, number> = { Easy: 1, Medium: 2, Advanced: 3 };
    return (difficultyOrder[a.difficulty] ?? 2) - (difficultyOrder[b.difficulty] ?? 2);
  });

  // Transform workflows to MyAgent format
  const myAgents: MyAgent[] = workflows.length > 0 
    ? workflows.map((workflow: any) => {
        const statusMap: Record<string, "active" | "paused" | "draft"> = {
          'active': 'active',
          'paused': 'paused',
          'draft': 'draft',
        };
        
        const colorMap: Record<string, string> = {
          'active': 'bg-green-500',
          'paused': 'bg-yellow-500',
          'draft': 'bg-gray-500',
        };

        const status = statusMap[workflow.status] || 'draft';
        
        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || 'No description',
          status,
          icon: Bot,
          iconColor: colorMap[workflow.status] || 'bg-gray-500',
          nodeCount: workflow.nodeCount || 0,
          lastRun: workflow.lastExecutedAt 
            ? new Date(workflow.lastExecutedAt).toLocaleDateString()
            : 'Never',
          runsCount: workflow.executionCount || 0,
        };
      })
    : []; // Empty array if no workflows

  // Get agent template nodes
  const getTemplateNodes = (templateId: string): AgentNode[] => {
    switch (templateId) {
      case "email-assistant":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New email received",
            description: "Triggered when an email arrives in inbox",
            icon: Mail,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "llm",
            title: "Analyze email content",
            description: "AI analyzes email to determine priority and category",
            icon: Sparkles,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Check if response needed",
            description: "Determine if email requires a response",
            icon: Filter,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "llm",
            title: "Generate response",
            description: "AI generates contextual reply",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "5",
            type: "action",
            title: "Send or queue response",
            description: "Send reply or queue for review",
            icon: Send,
            iconColor: "bg-green-500",
          },
        ];
      case "lead-qualifier":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead created",
            description: "Triggered when a new lead is added",
            icon: Users,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "tool",
            title: "Enrich lead data",
            description: "Fetch company information and contact details",
            icon: Database,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "tool",
            title: "Analyze engagement",
            description: "Review email opens, clicks, website visits",
            icon: Activity,
            iconColor: "bg-purple-500",
          },
          {
            id: "4",
            type: "llm",
            title: "Calculate lead score",
            description: "AI generates score (0-100) based on fit and signals",
            icon: Sparkles,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Assign priority",
            description: "Categorize as Hot (≥70), Warm (50-69), or Cold (<50)",
            icon: Target,
            iconColor: "bg-green-500",
          },
          {
            id: "6",
            type: "action",
            title: "Notify sales team",
            description: "Send notification for high-priority leads",
            icon: Bell,
            iconColor: "bg-amber-500",
          },
        ];
      case "meeting-prep":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Meeting scheduled",
            description: "Triggered when calendar event is created",
            icon: Calendar,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "tool",
            title: "Gather context",
            description: "Collect contact history, emails, deals from 8+ sources",
            icon: Database,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "llm",
            title: "Generate meeting brief",
            description: "AI creates comprehensive brief with key talking points",
            icon: Sparkles,
            iconColor: "bg-green-500",
          },
          {
            id: "4",
            type: "action",
            title: "Deliver brief",
            description: "Send brief to user before meeting",
            icon: FileText,
            iconColor: "bg-purple-500",
          },
        ];
      default:
        return [];
    }
  };

  // Get my agent nodes (same structure as templates)
  const getAgentNodes = (agentId: string): AgentNode[] => {
    // For now, return template nodes based on agent name
    if (agentId === "agent-1") return getTemplateNodes("email-assistant");
    if (agentId === "agent-2") return getTemplateNodes("lead-qualifier");
    if (agentId === "agent-3") return getTemplateNodes("meeting-prep");
    if (agentId === "agent-4") return getTemplateNodes("data-sync");
    if (agentId === "agent-5") return getTemplateNodes("content-generator");
    return [];
  };

  // Get node type label and color
  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "trigger":
        return "Trigger";
      case "action":
        return "Action";
      case "condition":
        return "Condition";
      case "llm":
        return "AI Model";
      case "tool":
        return "Tool";
      default:
        return type;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "action":
        return "bg-green-50 text-green-700 border-green-200";
      case "condition":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "llm":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "tool":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Handle create chat message
  const handleSendCreateMessage = async () => {
    if (!createChatInput.trim() || isCreatingAgent) return;

    const userInput = createChatInput.trim();
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userInput,
      timestamp: new Date(),
    };

    setCreateChatMessages(prev => [...prev, userMessage]);
    setCreateChatInput("");
    setIsCreatingAgent(true);

    try {
      // Build conversation context
      const conversationContext = createChatMessages.length > 0
        ? `\n\nPrevious conversation:\n${createChatMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`
        : '';

      // Track what information has been collected
      const collectedInfo = [];
      if (agentData.problem) collectedInfo.push(`Problem: ${agentData.problem}`);
      if (agentData.trigger) collectedInfo.push(`Trigger: ${agentData.trigger}`);
      if (agentData.dataSources) collectedInfo.push(`Data Sources: ${agentData.dataSources}`);
      if (agentData.integrations) collectedInfo.push(`Integrations: ${agentData.integrations}`);
      if (agentData.logic) collectedInfo.push(`Logic/Conditions: ${agentData.logic}`);
      if (agentData.errorHandling) collectedInfo.push(`Error Handling: ${agentData.errorHandling}`);
      if (agentData.output) collectedInfo.push(`Output/Actions: ${agentData.output}`);
      if (agentData.name) collectedInfo.push(`Name: ${agentData.name}`);
      if (agentData.description) collectedInfo.push(`Description: ${agentData.description}`);

      const currentAgentContext = collectedInfo.length > 0
        ? `\n\nInformation collected so far:\n${collectedInfo.join('\n')}\n\nMissing information to ask about: ${[
            !agentData.problem && 'problem statement',
            !agentData.trigger && 'trigger type',
            !agentData.dataSources && 'data sources',
            !agentData.logic && 'decision logic',
            !agentData.errorHandling && 'error handling',
            !agentData.output && 'output/actions',
          ].filter(Boolean).join(', ') || 'none - ready to build'}`
        : '\n\nNo information collected yet. Start by understanding the problem they want to solve.';

      // Call the AI assistant API
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `The user said: "${userInput}".${conversationContext}${currentAgentContext}

Remember: Ask ONE thoughtful question at a time. Focus on what's missing from the collected information. Only suggest building when you have enough information (problem, trigger, data sources, logic, error handling, output) AND the user explicitly confirms they're ready.`,
          context: {
            workspace: 'Studio',
            feature: 'agent-creation',
          },
        }),
      });

      let assistantResponse = "";
      let data: any = null;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('API Error', { status: response.status, errorData });
        
        // Don't auto-build on API errors - let the AI ask questions instead
        throw new Error(errorData.error || 'Failed to get AI response');
      } else {
        data = await response.json();
        logger.debug('API Response', { data });
        
        // Try multiple possible response structures
        // API returns: { message: { content: string, ... }, ... }
        assistantResponse = data.message?.content || 
                           (typeof data.message === 'string' ? data.message : null) ||
                           data.content || 
                           (typeof data === 'string' ? data : null) ||
                           "I'm here to help you create an agent. What problem are you trying to solve?";
        
        logger.debug('Parsed assistant response', { assistantResponse });
      }

      // Extract information from user input and assistant response
      // Try to extract problem statement
      if (!agentData.problem && userInput.length > 20 && /(?:problem|issue|challenge|struggling|difficulty|pain)/i.test(userInput)) {
        setAgentData(prev => ({ ...prev, problem: userInput }));
      }
      
      // Try to extract trigger information
      if (!agentData.trigger) {
        if (/(?:email|inbox|message|new email)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, trigger: 'Email trigger' }));
        } else if (/(?:schedule|time|daily|weekly|hourly|recurring)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, trigger: 'Scheduled trigger' }));
        } else if (/(?:webhook|api|request|endpoint)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, trigger: 'Webhook trigger' }));
        } else if (/(?:manual|button|click|on demand)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, trigger: 'Manual trigger' }));
        }
      }
      
      // Try to extract data sources
      if (!agentData.dataSources) {
        const dataSourceMatches: string[] = [];
        if (/(?:crm|salesforce|hubspot)/i.test(userInput)) dataSourceMatches.push('CRM');
        if (/(?:email|gmail|outlook)/i.test(userInput)) dataSourceMatches.push('Email');
        if (/(?:calendar|google calendar|outlook calendar)/i.test(userInput)) dataSourceMatches.push('Calendar');
        if (/(?:database|sql|postgres|mysql)/i.test(userInput)) dataSourceMatches.push('Database');
        if (/(?:api|rest|graphql)/i.test(userInput)) dataSourceMatches.push('API');
        if (dataSourceMatches.length > 0) {
          setAgentData(prev => ({ ...prev, dataSources: dataSourceMatches.join(', ') }));
        }
      }
      
      // Try to extract output/actions
      if (!agentData.output) {
        if (/(?:send|email|notify|alert|message)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, output: 'Send notification/email' }));
        } else if (/(?:save|store|update|create|write|record)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, output: 'Save/update data' }));
        } else if (/(?:analyze|process|generate|create content)/i.test(userInput)) {
          setAgentData(prev => ({ ...prev, output: 'Process/generate content' }));
        }
      }

      // Check if the AI is explicitly suggesting to build (more strict matching)
      const shouldBuild = /(?:let's build|build it now|I'll build the workflow|ready to build|I'll create the workflow|building your workflow|I've built|workflow created|I'll build it)/i.test(assistantResponse);
      
      // Check if user is explicitly confirming they want to build
      const isConfirmingBuild = /(?:yes,? build|yes,? create|build it|create it|go ahead|proceed|let's do it|ready|build now|create now)/i.test(userInput.toLowerCase());

      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: assistantResponse,
        timestamp: new Date(),
      };

      setCreateChatMessages(prev => [...prev, assistantMessage]);

      // Extract agent name if mentioned
      if (!agentData.name) {
        const namePatterns = [
          /(?:name|call|named?)\s+(?:it|the agent|this)\s+["']?([^"']+)["']?/i,
          /(?:I want|I need|create|build)\s+(?:an?|the)\s+["']?([^"']+?)(?:\s+agent|\s+that|$)/i,
        ];
        
        for (const pattern of namePatterns) {
          const match = userInput.match(pattern);
          if (match && match[1] && match[1].length < 50) {
            setAgentData(prev => ({ ...prev, name: match[1].trim() }));
            break;
          }
        }
      }

      // Extract description from substantial user input (if it's not just a yes/no/ok response)
      if (userInput.length > 15 && !agentData.description && !/(?:^yes$|^no$|^ok$|^sure$|^maybe$|^perhaps$|^thanks?$)/i.test(userInput.trim())) {
        // Use as description if it seems like a description of what they want
        if (!/(?:name|call)/i.test(userInput.toLowerCase())) {
          setAgentData(prev => ({ ...prev, description: userInput }));
        }
      }

      // Generate name from description if we don't have one yet
      if (!agentData.name && (agentData.description || agentData.problem)) {
        const source = agentData.description || agentData.problem;
        const words = source.split(/\s+/).slice(0, 3);
        if (words.length > 0) {
          const potentialName = words.join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
          if (potentialName.length < 30 && potentialName.length > 0) {
            setAgentData(prev => ({ ...prev, name: potentialName }));
          }
        }
      }

      // Only build if AI explicitly suggests it OR user explicitly confirms AND we have minimum info
      // Require at least problem statement or description to build
      const hasMinimumInfo = agentData.problem || agentData.description || agentData.trigger;
      const shouldBuildNow = (shouldBuild || isConfirmingBuild) && hasMinimumInfo;
      
      if (shouldBuildNow) {
        // Ensure we have at least a description
        if (!agentData.description && userInput.length > 10) {
          setAgentData(prev => ({ ...prev, description: userInput }));
        }
        
        // Ensure we have a name
        if (!agentData.name) {
          const words = (agentData.description || userInput).split(/\s+/).slice(0, 3);
          if (words.length > 0) {
            const potentialName = words.join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
            if (potentialName.length < 30 && potentialName.length > 0) {
              setAgentData(prev => ({ ...prev, name: potentialName }));
            } else {
              setAgentData(prev => ({ ...prev, name: 'My Agent' }));
            }
          } else {
            setAgentData(prev => ({ ...prev, name: 'My Agent' }));
          }
        }
        
        // Build workflow based on collected information
        setTimeout(() => {
          buildAgentWorkflow();
        }, 500);
      } else {
        setIsCreatingAgent(false);
      }
    } catch (error) {
      logger.error('Error getting AI response', error);
      
      // On error, ask the user to provide more information instead of auto-building
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "I encountered a connection issue. Could you tell me more about what you'd like your agent to do? What problem are you trying to solve?",
        timestamp: new Date(),
      };
      setCreateChatMessages(prev => [...prev, errorMessage]);
      setIsCreatingAgent(false);
    }
  };

  // Build agent workflow based on collected data
  const buildAgentWorkflow = () => {
    setIsCreatingAgent(true);
    
    // Use collected information, prioritizing problem statement
    const agentPurpose = (agentData.problem || agentData.description || agentData.purpose || '').toLowerCase();
    const fullContext = [
      agentData.problem,
      agentData.trigger,
      agentData.dataSources,
      agentData.integrations,
      agentData.logic,
      agentData.errorHandling,
      agentData.output,
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Determine workflow nodes based on agent purpose
    const newNodes: AgentNode[] = [];
    
    // Always start with a trigger - use collected trigger info if available
    let triggerTitle = "Trigger Event";
    let triggerDesc = "Agent will be triggered based on your requirements";
    
    if (agentData.trigger) {
      triggerTitle = agentData.trigger;
      triggerDesc = `Triggers: ${agentData.trigger}`;
    } else if (/(?:email|inbox|message)/i.test(fullContext)) {
      triggerTitle = "Email Trigger";
      triggerDesc = "Triggers when new emails arrive";
    } else if (/(?:schedule|time|daily|weekly|hourly)/i.test(fullContext)) {
      triggerTitle = "Scheduled Trigger";
      triggerDesc = "Runs on a schedule";
    } else if (/(?:webhook|api|request)/i.test(fullContext)) {
      triggerTitle = "Webhook Trigger";
      triggerDesc = "Triggers via API/webhook";
    } else if (/(?:manual|button|click)/i.test(fullContext)) {
      triggerTitle = "Manual Trigger";
      triggerDesc = "Triggers when manually activated";
    }
    
    newNodes.push({
      id: "1",
      type: "trigger",
      title: triggerTitle,
      description: triggerDesc,
      icon: Zap,
      iconColor: "bg-blue-500",
    });

    // Add data fetching if data sources are mentioned
    if (agentData.dataSources || /(?:fetch|get|retrieve|read|load|pull)/i.test(fullContext) || 
        /(?:database|api|data source|crm|email|calendar)/i.test(fullContext)) {
      const dataSourceDesc = agentData.dataSources 
        ? `Retrieve data from: ${agentData.dataSources}`
        : "Retrieve necessary data from sources";
      newNodes.push({
        id: String(newNodes.length + 1),
        type: "action",
        title: "Fetch Data",
        description: dataSourceDesc,
        icon: Database,
        iconColor: "bg-indigo-500",
      });
    }

    // Add LLM processing if agent needs AI reasoning
    if (agentData.logic || /(?:analyze|understand|process|think|reason|decide|determine|classify|categorize|summarize|extract|generate|write|compose|respond|reply)/i.test(fullContext) ||
        /(?:email|message|text|content|document|sentiment|tone|language)/i.test(fullContext)) {
      const logicDesc = agentData.logic 
        ? `AI processing: ${agentData.logic}`
        : (agentData.problem || agentData.description || "Process and analyze with AI");
      newNodes.push({
        id: String(newNodes.length + 1),
        type: "llm",
        title: "AI Processing",
        description: logicDesc,
        icon: Sparkles,
        iconColor: "bg-purple-500",
      });
    }

    // Add conditional logic if mentioned
    if (agentData.logic && /(?:if|when|check|verify|validate|condition|decision|route)/i.test(agentData.logic.toLowerCase())) {
      newNodes.push({
        id: String(newNodes.length + 1),
        type: "condition",
        title: "Decision Logic",
        description: agentData.logic,
        icon: Target,
        iconColor: "bg-amber-500",
      });
    } else if (/(?:if|when|check|verify|validate|condition|decision)/i.test(fullContext)) {
      newNodes.push({
        id: String(newNodes.length + 1),
        type: "condition",
        title: "Decision Logic",
        description: "Evaluate conditions and route accordingly",
        icon: Target,
        iconColor: "bg-amber-500",
      });
    }

    // Add action node - use collected output info if available
    let actionTitle = "Execute Action";
    let actionDesc = agentData.output || agentData.purpose || "Perform the required task";
    
    if (agentData.output) {
      actionTitle = agentData.output.includes('notification') || agentData.output.includes('email') 
        ? "Send Notification"
        : agentData.output.includes('Save') || agentData.output.includes('update')
        ? "Save Data"
        : "Execute Action";
    } else if (/(?:send|email|message|notify|alert)/i.test(fullContext)) {
      actionTitle = "Send Notification";
      actionDesc = "Send email, message, or notification";
    } else if (/(?:save|store|update|create|write)/i.test(fullContext)) {
      actionTitle = "Save Data";
      actionDesc = "Save or update data";
    } else if (/(?:integrate|connect|sync)/i.test(fullContext)) {
      actionTitle = "Integration Action";
      actionDesc = "Connect with external services";
    }
    
    newNodes.push({
      id: String(newNodes.length + 1),
      type: "action",
      title: actionTitle,
      description: actionDesc,
      icon: CheckCircle2,
      iconColor: "bg-green-500",
    });

    setAgentFlow(newNodes);
    
    const buildMessage = {
      id: (Date.now() + 2).toString(),
      role: 'assistant' as const,
      content: `✅ I've built a ${newNodes.length}-step workflow for your agent "${agentData.name || 'Agent'}". You can see it on the right. Would you like me to add more steps, modify anything, or is this ready to save?`,
      timestamp: new Date(),
    };
    
    setCreateChatMessages(prev => [...prev, buildMessage]);
    setIsCreatingAgent(false);
  };

  // Save the created workflow to the database
  const handleSaveWorkflow = async () => {
    if (!agentData.name || agentFlow.length === 0) {
      toast.error('Please provide a name and build a workflow first');
      return;
    }

    setIsSavingWorkflow(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentData.name,
          description: agentData.description || agentData.problem,
          type: 'custom',
          nodes: agentFlow.map(node => ({
            id: node.id,
            type: node.type,
            title: node.title,
            description: node.description,
          })),
          systemPrompt: `You are ${agentData.name}. ${agentData.description || agentData.problem}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      const data = await response.json();
      toast.success(`Workflow "${data.name}" saved successfully!`);
      
      // Reset form and switch to My Agents tab
      setCreateChatMessages([]);
      setCreateChatInput("");
      setAgentFlow([]);
      setAgentData({ name: "", description: "", purpose: "", problem: "", trigger: "", dataSources: "", integrations: "", logic: "", errorHandling: "", output: "" });
      mutateWorkflows();
      setActiveTab('my-agents');
      setSelectedAgent(data.id);
    } catch (error) {
      logger.error('Failed to save workflow', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save workflow');
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  // Use a template to create a new workflow
  const handleUseTemplate = async (templateId: string) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (!template) return;

    setIsUsingTemplate(true);
    try {
      const nodes = getTemplateNodes(templateId);
      
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          type: templateId === 'email-assistant' ? 'email' :
                templateId === 'lead-qualifier' ? 'sales' :
                templateId === 'meeting-prep' ? 'meeting' :
                templateId === 'data-sync' ? 'data' :
                templateId === 'content-generator' ? 'content' :
                templateId === 'analytics-agent' ? 'research' :
                templateId === 'customer-support' ? 'support' : 'custom',
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            title: node.title,
            description: node.description,
          })),
          systemPrompt: `You are ${template.name}. ${template.description}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create from template');
      }

      const data = await response.json();
      toast.success(`Created "${data.name}" from template!`);
      mutateWorkflows();
      setActiveTab('my-agents');
      setSelectedAgent(data.id);
    } catch (error) {
      logger.error('Failed to use template', error);
      toast.error(error instanceof Error ? error.message : 'Failed to use template');
    } finally {
      setIsUsingTemplate(false);
    }
  };

  // Delete a workflow
  const handleDeleteWorkflow = async (workflowId: string) => {
    const workflow = myAgents.find(a => a.id === workflowId);
    if (!workflow) return;

    if (!confirm(`Are you sure you want to delete "${workflow.name}"? This cannot be undone.`)) {
      return;
    }

    setIsDeletingWorkflow(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }

      toast.success(`"${workflow.name}" deleted`);
      if (selectedAgent === workflowId) {
        setSelectedAgent(null);
      }
      mutateWorkflows();
    } catch (error) {
      logger.error('Failed to delete workflow', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete workflow');
    } finally {
      setIsDeletingWorkflow(null);
    }
  };

  // Toggle workflow status (active/paused)
  const handleToggleStatus = async (workflowId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    setIsTogglingStatus(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'paused'}`);
      mutateWorkflows();
    } catch (error) {
      logger.error('Failed to toggle workflow status', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsTogglingStatus(null);
    }
  };

  // Execute/run a workflow
  const handleExecuteWorkflow = async (workflowId: string) => {
    const workflow = myAgents.find(a => a.id === workflowId);
    if (!workflow) return;

    setIsExecutingWorkflow(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute workflow');
      }

      const data = await response.json();
      toast.success(`"${workflow.name}" executed successfully! (${data.durationMs}ms)`);
      mutateWorkflows();
    } catch (error) {
      logger.error('Failed to execute workflow', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute workflow');
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden">
      {/* Header Section - Matching other pages */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Studio</h1>
          <p className="text-muted-foreground text-base">
            Build, customize, and manage your AI agents and workflows.
          </p>

          {/* Stats Bar - Compact Inline Centered */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats.totalTemplates}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Templates</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Bot className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats.totalAgents}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Agents</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              <span className="font-semibold">{stats.activeAgents}</span>
              <span className="ml-1 text-green-600/70 font-normal">Active</span>
            </Badge>
          </div>
        </div>

        {/* Floating Tab Bar */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-7xl mx-auto px-6 pb-6"
        >
          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Templates List */}
                <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                          <FileText className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Agent Templates</h3>
                          <p className="text-[13px] text-blue-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true"></span>
                            {agentTemplates.length} templates
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                        AI Ready
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Select a template to view its workflow and start building.
                    </p>
                  </div>

                  {/* Templates List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {agentTemplates.map((template) => {
                      const isSelected = selectedTemplate === template.id;
                      const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                        "bg-blue-500": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
                        "bg-purple-500": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
                        "bg-green-500": { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" },
                        "bg-amber-500": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
                        "bg-indigo-500": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600" },
                        "bg-cyan-500": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
                        "bg-rose-500": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
                        "bg-emerald-500": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
                      };
                      const colors = colorMap[template.iconColor] || { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" };
                      
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected 
                              ? `${colors.bg} ${colors.border} shadow-md` 
                              : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                          }`}
                          aria-label={`Select template: ${template.name}`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <template.icon className={`h-5 w-5 ${colors.text}`} aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold text-sm ${isSelected ? colors.text : "text-gray-900"}`}>
                                    {template.name}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 h-4",
                                      template.difficulty === "Easy"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : template.difficulty === "Medium"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    {template.difficulty}
                                  </Badge>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? `${colors.text} rotate-90` : "text-gray-400"}`} aria-hidden="true" />
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`text-xs ${isSelected ? colors.text : "text-gray-600"}`}>
                                  {template.nodeCount} steps
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{template.category}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Template Flow */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {(() => {
                    const selectedTemplateData = agentTemplates.find(t => t.id === selectedTemplate);
                    const nodes = getTemplateNodes(selectedTemplate);
                    
                    if (!selectedTemplateData || nodes.length === 0) {
                      return (
                        <div className="flex-1 flex items-center justify-center p-8">
                          <div className="text-center max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <Bot className="h-8 w-8 text-slate-400" aria-hidden="true" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Select a template</h3>
                            <p className="text-sm text-gray-500">
                              Choose an agent template from the list to view its workflow steps.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                      "bg-blue-500": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
                      "bg-purple-500": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
                      "bg-green-500": { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" },
                      "bg-amber-500": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
                      "bg-indigo-500": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600" },
                      "bg-cyan-500": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
                      "bg-rose-500": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
                      "bg-emerald-500": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
                    };
                    const colors = colorMap[selectedTemplateData.iconColor] || { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" };

                    return (
                      <>
                        {/* Detail Header */}
                        <div className={`px-6 py-4 border-b ${colors.bg}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                                <selectedTemplateData.icon className={`h-6 w-6 ${colors.text}`} aria-hidden="true" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{selectedTemplateData.name}</h3>
                                <p className="text-sm text-gray-500">{selectedTemplateData.description}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              aria-label="Use this template"
                              onClick={() => handleUseTemplate(selectedTemplate)}
                              disabled={isUsingTemplate}
                            >
                              {isUsingTemplate ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                              )}
                              {isUsingTemplate ? 'Creating...' : 'Use Template'}
                            </Button>
                          </div>
                        </div>

                        <div className="p-6 space-y-5">
                          {/* Stats - Inline subtle display */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">Steps:</span>
                              <span className="font-medium text-gray-700">{selectedTemplateData.nodeCount}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">Category:</span>
                              <span className="font-medium text-gray-700">{selectedTemplateData.category}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 font-normal",
                                selectedTemplateData.difficulty === "Easy"
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : selectedTemplateData.difficulty === "Medium"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                              )}
                            >
                              {selectedTemplateData.difficulty}
                            </Badge>
                          </div>

                          {/* Workflow Steps */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-500" aria-hidden="true" />
                              Workflow Steps
                            </h4>
                            <div className="space-y-3">
                              {nodes.map((node, index) => {
                                const isLast = index === nodes.length - 1;
                                
                                const getNodeStyles = () => {
                                  switch (node.type) {
                                    case "trigger":
                                      return { bg: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" };
                                    case "action":
                                      return { bg: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" };
                                    case "condition":
                                      return { bg: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" };
                                    case "llm":
                                      return { bg: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" };
                                    case "tool":
                                      return { bg: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" };
                                    default:
                                      return { bg: "bg-slate-500", badge: "bg-slate-50 text-slate-700 border-slate-200" };
                                  }
                                };

                                const styles = getNodeStyles();
                                
                                return (
                                  <div key={node.id} className="relative">
                                    <div className="flex items-start gap-3">
                                      {/* Step indicator */}
                                      <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center shadow-sm`}>
                                          <node.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                        </div>
                                        {/* Connector line */}
                                        {!isLast && (
                                          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-3 bg-gray-200" aria-hidden="true" />
                                        )}
                                      </div>

                                      {/* Step content */}
                                      <div className="flex-1 min-w-0 pb-3">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <p className="text-sm font-medium text-gray-900">{node.title}</p>
                                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${styles.badge}`}>
                                            {getNodeTypeLabel(node.type)}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">{node.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </Card>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: AI Chat */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">AI Agent Builder</h3>
                        <p className="text-xs text-green-600">Guided agent creation</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setCreateChatMessages([]);
                        setCreateChatInput("");
                        setAgentFlow([]);
                        setAgentData({ 
                          name: "", 
                          description: "", 
                          purpose: "",
                          problem: "",
                          trigger: "",
                          dataSources: "",
                          integrations: "",
                          logic: "",
                          errorHandling: "",
                          output: "",
                        });
                        setIsCreatingAgent(false);
                      }}
                      className="h-7 w-7"
                      aria-label="Start over"
                      title="Start over"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
                    {createChatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Hi! I'm here to help you create an AI agent.</p>
                        <p className="text-xs text-gray-500 mb-4">Let's brainstorm together to build the perfect agent for your needs.</p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setCreateChatInput("I want to automate email responses");
                              setTimeout(() => handleSendCreateMessage(), 100);
                            }}
                          >
                            Email automation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setCreateChatInput("I need help with lead qualification");
                              setTimeout(() => handleSendCreateMessage(), 100);
                            }}
                          >
                            Lead qualification
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setCreateChatInput("I want to analyze customer feedback");
                              setTimeout(() => handleSendCreateMessage(), 100);
                            }}
                          >
                            Data analysis
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Or describe what you'd like your agent to do</p>
                      </div>
                    )}
                    {createChatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-slate-100 text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}

                    {isCreatingAgent && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 text-gray-900 rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            <p className="text-sm text-gray-600">Building your agent...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0 bg-white/80 backdrop-blur-sm">
                    <Input
                      placeholder="Type your message..."
                      value={createChatInput}
                      onChange={(e) => setCreateChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isCreatingAgent) {
                          e.preventDefault();
                          handleSendCreateMessage();
                        }
                      }}
                      className="flex-1 rounded-full"
                      disabled={isCreatingAgent}
                      aria-label="Type message to AI"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendCreateMessage}
                      disabled={!createChatInput.trim() || isCreatingAgent}
                      className="bg-green-500 hover:bg-green-600 rounded-full"
                      aria-label="Send message"
                    >
                      {isCreatingAgent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Right: Agent Flow Builder */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {agentData.name || "Agent Flow"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {agentData.description || "Your agent workflow will appear here as you build it"}
                        </p>
                      </div>
                      {agentFlow.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleSaveWorkflow}
                          disabled={isSavingWorkflow || !agentData.name}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSavingWorkflow ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1.5" />
                          )}
                          {isSavingWorkflow ? 'Saving...' : 'Save Workflow'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Flow Preview */}
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {agentFlow.length > 0 ? (
                      <div className="relative min-h-full">
                        <div className="flex flex-col gap-6">
                          {agentFlow.map((node, index) => {
                            const isLast = index === agentFlow.length - 1;

                            const getGradientClasses = () => {
                              switch (node.type) {
                                case "trigger":
                                  return "from-blue-500 to-blue-600";
                                case "action":
                                  return "from-green-500 to-green-600";
                                case "condition":
                                  return "from-purple-500 to-purple-600";
                                case "llm":
                                  return "from-indigo-500 to-indigo-600";
                                case "tool":
                                  return "from-amber-500 to-amber-600";
                                default:
                                  return "from-slate-500 to-slate-600";
                              }
                            };

                            return (
                              <div key={node.id} className="relative">
                                <div className="flex items-start gap-4">
                                  <div className="relative flex-shrink-0">
                                    <div
                                      className={cn(
                                        "w-16 h-16 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
                                        getGradientClasses()
                                      )}
                                    >
                                      <node.icon className="h-7 w-7 text-white" />
                                    </div>
                                    {!isLast && (
                                      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-6 bg-green-400">
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rounded-full bg-green-400"></div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-semibold text-gray-900">{node.title}</p>
                                      <Badge
                                        variant="outline"
                                        className={cn("text-[10px] px-1.5 py-0 h-4", getNodeTypeColor(node.type))}
                                      >
                                        {getNodeTypeLabel(node.type)}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">{node.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Bot className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Start building</h3>
                          <p className="text-sm text-gray-500">
                            Chat with the AI assistant to begin creating your agent. The workflow will appear here as you build it.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* MY AGENTS TAB */}
          {activeTab === 'my-agents' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Agents List */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">My Agents</h3>
                          <p className="text-[13px] text-purple-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                            {isLoadingWorkflows ? 'Loading...' : `${myAgents.length} ${myAgents.length === 1 ? 'agent' : 'agents'}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-purple-600 hover:text-purple-700 shadow-sm"
                        aria-label="Create agent"
                        onClick={() => setActiveTab('create')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Agents List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingWorkflows ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : workflowsError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Failed to load workflows</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutateWorkflows()}
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    ) : myAgents.length === 0 ? (
                      <div className="text-center py-10 px-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-4">
                          <Bot className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Create your first workflow</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-[240px] mx-auto">
                          Build AI agents that automate tasks like email handling, lead scoring, and data processing.
                        </p>
                        <div className="flex flex-col gap-2 items-center">
                          <Button 
                            size="sm" 
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setActiveTab('create')}
                          >
                            <Sparkles className="h-4 w-4" />
                            Start with Neptune
                          </Button>
                          <span className="text-xs text-muted-foreground">or pick a template →</span>
                        </div>
                      </div>
                    ) : (
                      myAgents.map((agent) => {
                        const isSelected = selectedAgent === agent.id;
                        return (
                          <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.id)}
                            className={cn(
                              "w-full p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1",
                              isSelected
                                ? "border-purple-300 bg-purple-50/30 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            )}
                            aria-label={`Select agent: ${agent.name}`}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${agent.iconColor} flex-shrink-0`}>
                                <agent.icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 h-4",
                                      agent.status === "active"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : agent.status === "paused"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-slate-50 text-slate-700 border-slate-200"
                                    )}
                                  >
                                    {agent.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{agent.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                  {agent.lastRun && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {agent.lastRun}
                                    </span>
                                  )}
                                  {agent.runsCount && (
                                    <span>{agent.runsCount} runs</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Agent Flow */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {myAgents.find(a => a.id === selectedAgent)?.name || "Select an agent"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {myAgents.find(a => a.id === selectedAgent)?.description || "Choose an agent to view its workflow"}
                        </p>
                      </div>
                      {selectedAgent && (
                        <div className="flex items-center gap-2">
                          {/* Run button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecuteWorkflow(selectedAgent)}
                            disabled={isExecutingWorkflow}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            {isExecutingWorkflow ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Pause/Activate button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const agent = myAgents.find(a => a.id === selectedAgent);
                              if (agent) handleToggleStatus(selectedAgent, agent.status);
                            }}
                            disabled={isTogglingStatus === selectedAgent}
                            className={cn(
                              myAgents.find(a => a.id === selectedAgent)?.status === 'active'
                                ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                                : "text-green-600 border-green-200 hover:bg-green-50"
                            )}
                          >
                            {isTogglingStatus === selectedAgent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : myAgents.find(a => a.id === selectedAgent)?.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Delete button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWorkflow(selectedAgent)}
                            disabled={isDeletingWorkflow === selectedAgent}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isDeletingWorkflow === selectedAgent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flow Diagram */}
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {(() => {
                      const nodes = selectedAgent ? getAgentNodes(selectedAgent) : [];
                      if (nodes.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Bot className="h-8 w-8 text-slate-400" />
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 mb-2">Select an agent</h3>
                              <p className="text-sm text-gray-500">
                                Choose an agent from the list to view its workflow and configuration.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="relative min-h-full">
                          <div className="flex flex-col gap-6">
                            {nodes.map((node, index) => {
                              const isLast = index === nodes.length - 1;

                              const getGradientClasses = () => {
                                switch (node.type) {
                                  case "trigger":
                                    return "from-blue-500 to-blue-600";
                                  case "action":
                                    return "from-green-500 to-green-600";
                                  case "condition":
                                    return "from-purple-500 to-purple-600";
                                  case "llm":
                                    return "from-indigo-500 to-indigo-600";
                                  case "tool":
                                    return "from-amber-500 to-amber-600";
                                  default:
                                    return "from-slate-500 to-slate-600";
                                }
                              };

                              return (
                                <div key={node.id} className="relative">
                                  <div className="flex items-start gap-4">
                                    <div className="relative flex-shrink-0">
                                      <div
                                        className={cn(
                                          "w-16 h-16 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
                                          getGradientClasses()
                                        )}
                                      >
                                        <node.icon className="h-7 w-7 text-white" />
                                      </div>
                                      {!isLast && (
                                        <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-6 bg-purple-400">
                                          <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400"></div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-gray-900">{node.title}</p>
                                        <Badge
                                          variant="outline"
                                          className={cn("text-[10px] px-1.5 py-0 h-4", getNodeTypeColor(node.type))}
                                        >
                                          {getNodeTypeLabel(node.type)}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-500">{node.description}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

