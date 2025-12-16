"use client";

import { useState, useEffect } from "react";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  User, 
  Code2, 
  Shield, 
  Bot,
  Search,
  BookOpen,
  Rocket,
  Zap,
  Key,
  Database,
  Webhook,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Menu,
  X,
  Sparkles,
  UserPlus,
  Building2,
  LayoutDashboard,
  MessageSquare,
  UserCircle,
  MousePointer,
  Lightbulb,
  ChevronDown,
  Command,
  Keyboard,
  // Additional icons for enhanced content
  Workflow,
  Brain,
  Target,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Mail,
  Calendar,
  TrendingUp,
  PieChart,
  Filter,
  Tag,
  Star,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Link,
  Globe,
  Lock,
  Unlock,
  ShieldCheck,
  UserCog,
  CreditCard,
  Receipt,
  Activity,
  Terminal,
  GitBranch,
  Package,
  Server,
  Cpu,
  Layers,
  Grid3X3,
  ListChecks,
  ClipboardList,
  FileCode,
  AlertTriangle,
  Info,
  CircleCheck,
  CircleX,
  Timer,
  Gauge,
  Network,
  Share2,
  Copy,
  Repeat,
  Shuffle,
  Plus,
  Minus,
  RotateCcw,
  type LucideIcon
} from "lucide-react";

type UserType = "end-users" | "developers" | "admins" | "ai-agents";

// Enhanced Getting Started Content Component
function GettingStartedContent() {
  const [proTipsOpen, setProTipsOpen] = useState(true);
  
  const steps = [
    { 
      number: 1, 
      title: "Create Your Account", 
      icon: UserPlus,
      content: "Sign up with email or use Google/Microsoft OAuth. You'll be prompted to create your first workspace."
    },
    { 
      number: 2, 
      title: "Set Up Your Workspace", 
      icon: Building2,
      content: "Give your workspace a name (you can change this later). This is where all your agents, contacts, and workflows will live."
    },
    { 
      number: 3, 
      title: "Explore the Dashboard", 
      icon: LayoutDashboard,
      content: "After signup, you'll land on your dashboard where Neptune AI greets you. The sidebar on the left gives you access to all major features: CRM, Library, Marketing, and more."
    },
    { 
      number: 4, 
      title: "Chat with Neptune", 
      icon: MessageSquare,
      content: "Click on Neptune AI in the sidebar and ask it anything. Try: 'Show me what I can do' or 'Help me create my first contact.' Neptune understands natural language and can guide you through the platform."
    },
    { 
      number: 5, 
      title: "Add Your First Contact", 
      icon: UserCircle,
      content: "Go to CRM → Leads and click 'Add Lead'. Fill in the basic info. Watch as Neptune automatically suggests next actions and scores the lead."
    },
    { 
      number: 6, 
      title: "Try Quick Actions", 
      icon: MousePointer,
      content: "On the dashboard, you'll see quick action buttons like 'Help me create my first agent' and 'Upload a document'. These are shortcuts to common tasks."
    }
  ];
  
  const proTips = [
    { 
      icon: Command, 
      content: <>Use <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-nebula-dark/80 text-nebula-frost text-xs font-mono border border-border/40">⌘K</kbd> (Mac) or <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-nebula-dark/80 text-nebula-frost text-xs font-mono border border-border/40">Ctrl+K</kbd> (Windows) to open the command palette from anywhere</>
    },
    { 
      icon: Sparkles, 
      content: "Neptune learns from your usage - the more you interact, the smarter it gets" 
    },
    { 
      icon: BookOpen, 
      content: "Check the 'Launchpad' section for guided tutorials" 
    },
    { 
      icon: Users, 
      content: "Invite team members from Settings → Team Management" 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Welcome to GalaxyCo! Here's how to get started in under 5 minutes:
        </p>
      </div>
      
      {/* Steps */}
      <div className="relative space-y-4">
        {/* Connecting line */}
        <div className="absolute left-[22px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-nebula-teal/40 via-nebula-violet/30 to-nebula-teal/10 hidden sm:block" />
        
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 group"
            >
              {/* Step Number */}
              <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-nebula-teal to-nebula-violet flex items-center justify-center text-nebula-frost font-bold shadow-lg shadow-nebula-teal/20 group-hover:shadow-xl group-hover:shadow-nebula-teal/30 transition-shadow">
                {step.number}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <StepIcon className="h-4 w-4 text-nebula-teal" />
                  <h4 className="font-semibold text-foreground text-base">{step.title}</h4>
                </div>
                <p className="text-muted-foreground/90 text-base leading-relaxed pl-6">
                  {step.content}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Pro Tips Collapsible */}
      <div className="border border-nebula-teal/20 rounded-xl overflow-hidden bg-nebula-teal/5">
        <button
          onClick={() => setProTipsOpen(!proTipsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-teal/10 transition-colors"
          aria-expanded={proTipsOpen}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-nebula-teal" />
            </div>
            <span className="font-semibold text-foreground">Pro Tips</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${proTipsOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {proTipsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-4 space-y-3">
                {proTips.map((tip, index) => {
                  const TipIcon = tip.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 text-base text-muted-foreground/90">
                      <TipIcon className="h-5 w-5 text-nebula-teal flex-shrink-0 mt-0.5" />
                      <span>{tip.content}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Closing message */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          You're now ready to start using GalaxyCo! Explore the other documentation sections to dive deeper into specific features.
        </p>
      </div>
    </div>
  );
}

// Enhanced Core Concepts Content Component
function CoreConceptsContent() {
  const [activeSection, setActiveSection] = useState<string | null>("agents");
  
  const concepts = [
    {
      id: "agents",
      title: "AI Agents",
      icon: Bot,
      color: "nebula-teal",
      description: "Think of agents as specialized AI workers. Each agent has a specific job: scoring leads, drafting content, scheduling follow-ups, etc.",
      details: "Unlike chatbots that just answer questions, our agents take action on your behalf. When a new lead comes in, an agent can automatically research them, score their fit, and draft a personalized follow-up—all without you lifting a finger."
    },
    {
      id: "workflows",
      title: "Workflows",
      icon: Workflow,
      color: "nebula-violet",
      description: "Workflows connect triggers, conditions, and actions into automated processes.",
      details: "For example: 'When a new contact is added (trigger) AND they're from Enterprise segment (condition), THEN assign to senior sales rep AND send welcome sequence (actions).' You can build workflows visually without code using our Creator studio."
    },
    {
      id: "neptune",
      title: "Neptune AI Orchestrator",
      icon: Brain,
      color: "nebula-teal",
      description: "Neptune is the brain that coordinates everything. It sits above all your agents and workflows.",
      details: "When you ask Neptune 'What should I work on today?', it analyzes your CRM, active workflows, and pending tasks to give you prioritized recommendations. Neptune can also execute workflows, create new agents, and explain what's happening."
    }
  ];

  const howItWorks = [
    { step: 1, text: "You add a new lead to your CRM", icon: UserPlus },
    { step: 2, text: "An AI agent automatically enriches and scores them", icon: Bot },
    { step: 3, text: "A workflow triggers based on the score", icon: Zap },
    { step: 4, text: "Actions execute: sending email, creating tasks, updating pipeline", icon: Play },
    { step: 5, text: "Neptune surfaces next steps to you", icon: Target }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          GalaxyCo is built around three core concepts that work together seamlessly:
        </p>
      </div>

      {/* Interactive Concept Cards */}
      <div className="grid gap-4">
        {concepts.map((concept) => {
          const ConceptIcon = concept.icon;
          const isActive = activeSection === concept.id;
          return (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${
                isActive ? `border-${concept.color}/40 bg-${concept.color}/5` : 'border-border/40 hover:border-border/60'
              }`}
              onClick={() => setActiveSection(isActive ? null : concept.id)}
            >
              <div className="p-4 flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${concept.color}/20 to-${concept.color}/10 flex items-center justify-center flex-shrink-0`}>
                  <ConceptIcon className={`h-6 w-6 text-${concept.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground text-lg">{concept.title}</h4>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isActive ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-muted-foreground/90 text-base mt-1">{concept.description}</p>
                </div>
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 pt-0 ml-16">
                      <p className="text-muted-foreground/80 text-base leading-relaxed border-l-2 border-nebula-teal/30 pl-4">
                        {concept.details}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* How They Work Together */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-nebula-teal" />
          How They Work Together
        </h4>
        <div className="relative space-y-3">
          <div className="absolute left-[18px] top-8 bottom-4 w-[2px] bg-gradient-to-b from-nebula-teal/40 to-nebula-violet/20 hidden sm:block" />
          {howItWorks.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="relative z-10 w-9 h-9 rounded-lg bg-nebula-teal/20 flex items-center justify-center text-nebula-teal font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/90">
                  <ItemIcon className="h-4 w-4 text-nebula-teal/70" />
                  <span>{item.text}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Additional Concepts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-border/40 rounded-xl p-4 bg-card/30">
          <div className="flex items-center gap-3 mb-3">
            <Database className="h-5 w-5 text-nebula-violet" />
            <h5 className="font-semibold text-foreground">Data Models</h5>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Everything in GalaxyCo has a consistent structure. Contacts, Deals, Documents, and Agents all have properties, relationships, and histories.
          </p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-card/30">
          <div className="flex items-center gap-3 mb-3">
            <Link className="h-5 w-5 text-nebula-violet" />
            <h5 className="font-semibold text-foreground">Integrations</h5>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Connect external tools (Google Calendar, QuickBooks, Shopify) to extend what agents can do as part of workflows.
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Neptune AI Content Component
function NeptuneAIContent() {
  const [tipsOpen, setTipsOpen] = useState(true);

  const capabilities = [
    { icon: Search, text: "Answer questions about your data", example: "'How many hot leads do I have?'" },
    { icon: Plus, text: "Execute tasks", example: "'Create a contact for John Smith at Acme Corp'" },
    { icon: TrendingUp, text: "Surface insights", example: "'Show me deals that haven't been touched in 7 days'" },
    { icon: Edit, text: "Draft content", example: "'Write a follow-up email for this lead'" },
    { icon: HelpCircle, text: "Explain decisions", example: "'Why did you score this lead as Hot?'" },
    { icon: Target, text: "Suggest next actions", example: "'What should I prioritize today?'" }
  ];

  const usageTips = [
    { title: "Natural Language", icon: MessageSquare, content: "Just type or speak naturally. Neptune understands context. Instead of clicking through menus, ask: 'Add a follow-up task for next Tuesday' or 'Show me my pipeline.'" },
    { title: "Tool Execution", icon: Zap, content: "Neptune has access to tools across your workspace. When you ask it to create a contact or schedule a workflow, it actually executes those actions. You'll see confirmations of what it did." },
    { title: "Context Awareness", icon: Brain, content: "Neptune remembers your conversation history and understands your workspace data. If you say 'Send them a follow-up,' it knows who 'them' refers to based on your conversation." }
  ];

  const trainingSteps = [
    { icon: Upload, title: "Upload Documents", content: "In Library → Knowledge Base, upload your company docs, playbooks, or FAQs. Neptune will learn from these." },
    { icon: Star, title: "Provide Feedback", content: "Use the thumbs up/down on Neptune's responses. This teaches it what good answers look like." },
    { icon: Settings, title: "Set Context", content: "Tell Neptune about your business: 'We're a B2B SaaS company selling to mid-market HR teams.'" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Neptune is your AI business assistant that understands your workspace and takes action on your behalf.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-nebula-teal" />
          What Neptune Can Do
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {capabilities.map((cap, index) => {
            const CapIcon = cap.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-border/40 rounded-lg p-3 hover:border-nebula-teal/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CapIcon className="h-5 w-5 text-nebula-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground/90 text-sm font-medium">{cap.text}</p>
                    <p className="text-muted-foreground/70 text-xs mt-1 italic">{cap.example}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How to Use Neptune */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4">How to Use Neptune</h4>
        <div className="space-y-4">
          {usageTips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-nebula-violet/20 flex items-center justify-center flex-shrink-0">
                  <TipIcon className="h-5 w-5 text-nebula-violet" />
                </div>
                <div>
                  <h5 className="font-medium text-foreground">{tip.title}</h5>
                  <p className="text-muted-foreground/80 text-sm mt-1 leading-relaxed">{tip.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Training Neptune */}
      <div className="border border-nebula-teal/20 rounded-xl overflow-hidden bg-nebula-teal/5">
        <button
          onClick={() => setTipsOpen(!tipsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-teal/10 transition-colors"
          aria-expanded={tipsOpen}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-nebula-teal" />
            </div>
            <span className="font-semibold text-foreground">Training Neptune</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${tipsOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {tipsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-4 pb-4 space-y-3">
                {trainingSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <StepIcon className="h-5 w-5 text-nebula-teal flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">{step.title}:</span>
                        <span className="text-muted-foreground/80 ml-1">{step.content}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-nebula-teal flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground/90">
            <p>• Neptune works best with specific questions</p>
            <p>• You can always undo or modify what Neptune does</p>
            <p>• Use the 'Explain' button to understand Neptune's reasoning</p>
            <p>• Access Neptune from anywhere with <kbd className="px-1.5 py-0.5 rounded bg-nebula-dark/60 text-nebula-frost text-xs font-mono">⌘K</kbd></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Building Workflows Content Component
function BuildingWorkflowsContent() {
  const [examplesOpen, setExamplesOpen] = useState(true);

  const anatomy = [
    { title: "Trigger", icon: Zap, color: "nebula-teal", description: "What starts the workflow. Examples: new contact added, deal stage changed, time-based (every Monday at 9am), webhook received." },
    { title: "Conditions", icon: Filter, color: "nebula-violet", description: "Rules that determine if the workflow continues. Example: 'IF lead score > 80 AND industry = SaaS'" },
    { title: "Actions", icon: Play, color: "nebula-teal", description: "What happens when conditions are met. Examples: send email, create task, update CRM field, call external API, run AI agent." }
  ];

  const buildSteps = [
    "Go to Orchestration → Workflows → New Workflow",
    "Choose a trigger (start simple with 'New Contact Created')",
    "Add a condition (optional but recommended)",
    "Add actions - drag and drop from the right panel",
    "Configure each action's settings",
    "Test with sample data",
    "Activate when ready"
  ];

  const examples = [
    { name: "Lead Routing", trigger: "When new lead created", conditions: "IF score > 70", actions: "Assign to senior rep, ELSE assign to junior rep → Send Slack notification" },
    { name: "Follow-Up Automation", trigger: "When deal sits in stage for 7 days", conditions: null, actions: "Create follow-up task → Send reminder email → Alert manager" },
    { name: "Content Approval", trigger: "When document uploaded", conditions: null, actions: "Request approval from manager → IF approved → Publish to knowledge base" }
  ];

  const bestPractices = [
    { icon: CircleCheck, text: "Start with one workflow at a time" },
    { icon: CircleCheck, text: "Test thoroughly before activating" },
    { icon: CircleCheck, text: "Use clear naming conventions" },
    { icon: CircleCheck, text: "Add error handling (what if API call fails?)" },
    { icon: CircleCheck, text: "Monitor workflow execution logs" },
    { icon: CircleCheck, text: "Don't over-automate - keep human oversight where needed" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Workflows automate repetitive tasks so you can focus on high-value work.
        </p>
      </div>

      {/* Anatomy of a Workflow */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-nebula-teal" />
          Anatomy of a Workflow
        </h4>
        <div className="space-y-3">
          {anatomy.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 border border-border/40 rounded-xl hover:border-nebula-teal/30 transition-colors"
              >
                <div className={`h-12 w-12 rounded-xl bg-${item.color}/20 flex items-center justify-center flex-shrink-0`}>
                  <ItemIcon className={`h-6 w-6 text-${item.color}`} />
                </div>
                <div>
                  <h5 className="font-semibold text-foreground">{item.title}</h5>
                  <p className="text-muted-foreground/80 text-sm mt-1 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Building Your First Workflow */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-nebula-violet" />
          Building Your First Workflow
        </h4>
        <div className="relative space-y-3">
          <div className="absolute left-[18px] top-6 bottom-4 w-[2px] bg-gradient-to-b from-nebula-violet/40 to-nebula-teal/20 hidden sm:block" />
          {buildSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4"
            >
              <div className="relative z-10 w-9 h-9 rounded-lg bg-nebula-violet/20 flex items-center justify-center text-nebula-violet font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <span className="text-muted-foreground/90">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="border border-nebula-teal/20 rounded-xl overflow-hidden bg-nebula-teal/5">
        <button
          onClick={() => setExamplesOpen(!examplesOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-teal/10 transition-colors"
          aria-expanded={examplesOpen}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
              <ListChecks className="h-4 w-4 text-nebula-teal" />
            </div>
            <span className="font-semibold text-foreground">Common Workflow Examples</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${examplesOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {examplesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-4 pb-4 space-y-4">
                {examples.map((example, index) => (
                  <div key={index} className="bg-card/50 rounded-lg p-3 border border-border/30">
                    <h5 className="font-medium text-foreground mb-2">{example.name}</h5>
                    <div className="text-sm text-muted-foreground/80 space-y-1">
                      <p><span className="text-nebula-teal font-medium">Trigger:</span> {example.trigger}</p>
                      {example.conditions && <p><span className="text-nebula-violet font-medium">Condition:</span> {example.conditions}</p>}
                      <p><span className="text-nebula-teal font-medium">Actions:</span> {example.actions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Best Practices */}
      <div className="grid sm:grid-cols-2 gap-2">
        {bestPractices.map((practice, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
            <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0" />
            <span>{practice.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced CRM Essentials Content Component
function CRMEssentialsContent() {
  const [scoringOpen, setScoringOpen] = useState(true);

  const contactFeatures = [
    { icon: UserPlus, title: "Adding Contacts", content: "Click 'Add Lead' and fill in basic info (name, email, company). Neptune AI automatically enriches the contact with additional data." },
    { icon: Upload, title: "Import", content: "Bulk import from CSV or integrate with your existing tools. Go to CRM → Import to upload a file." },
    { icon: Tag, title: "Organization", content: "Contacts can be tagged, segmented, and organized into lists. Use filters to create views like 'Enterprise Leads'." }
  ];

  const pipelineStages = ["New", "Qualified", "Demo", "Proposal", "Negotiation", "Closed Won/Lost"];

  const scoringFactors = [
    { icon: Building2, text: "Company fit (size, industry, location)" },
    { icon: Mail, text: "Engagement signals (email opens, site visits, responses)" },
    { icon: TrendingUp, text: "Historical patterns (similar deals that closed)" },
    { icon: Calendar, text: "Timing indicators (budget cycle, hiring activity)" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Our CRM is built to work with AI, not against it. Here's what you need to know:
        </p>
      </div>

      {/* Contacts & Leads */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-nebula-teal" />
          Contacts & Leads
        </h4>
        <div className="space-y-3">
          {contactFeatures.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 border border-border/40 rounded-xl"
              >
                <div className="h-10 w-10 rounded-lg bg-nebula-teal/20 flex items-center justify-center flex-shrink-0">
                  <FeatureIcon className="h-5 w-5 text-nebula-teal" />
                </div>
                <div>
                  <h5 className="font-medium text-foreground">{feature.title}</h5>
                  <p className="text-muted-foreground/80 text-sm mt-1">{feature.content}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Deals & Pipeline */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-nebula-violet" />
          Deals & Pipeline
        </h4>
        <p className="text-muted-foreground/80 text-sm mb-4">Default pipeline stages (customizable in CRM Settings):</p>
        <div className="flex flex-wrap gap-2">
          {pipelineStages.map((stage, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-nebula-violet/10 text-nebula-violet text-sm font-medium border border-nebula-violet/20">
                {stage}
              </span>
              {index < pipelineStages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground/70 text-sm mt-4 italic">
          💡 Drag and drop deals between stages in the Kanban view. AI tracks how long deals sit in each stage.
        </p>
      </div>

      {/* AI Scoring */}
      <div className="border border-nebula-teal/20 rounded-xl overflow-hidden bg-nebula-teal/5">
        <button
          onClick={() => setScoringOpen(!scoringOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-teal/10 transition-colors"
          aria-expanded={scoringOpen}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-nebula-teal" />
            </div>
            <span className="font-semibold text-foreground">AI Lead Scoring</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${scoringOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {scoringOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-4 pb-4">
                <p className="text-muted-foreground/80 text-sm mb-3">
                  Every lead gets an AI-generated score (Cold, Warm, Hot) based on:
                </p>
                <div className="space-y-2">
                  {scoringFactors.map((factor, index) => {
                    const FactorIcon = factor.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                        <FactorIcon className="h-4 w-4 text-nebula-teal flex-shrink-0" />
                        <span>{factor.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activities & Reporting */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-border/40 rounded-xl p-4 bg-card/30">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-5 w-5 text-nebula-teal" />
            <h5 className="font-semibold text-foreground">Activities & Notes</h5>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Track all interactions: calls, emails, meetings, notes. AI can auto-transcribe calls and extract action items.
          </p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-card/30">
          <div className="flex items-center gap-3 mb-3">
            <PieChart className="h-5 w-5 text-nebula-violet" />
            <h5 className="font-semibold text-foreground">Reporting</h5>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Built-in reports: pipeline health, conversion rates, average deal size, sales velocity, lead source performance.
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Best Practices Content Component
function BestPracticesContent() {
  const categories = [
    {
      title: "Data Hygiene",
      icon: Database,
      color: "nebula-teal",
      tips: [
        "Keep contact data clean - merge duplicates weekly",
        "Use consistent naming conventions for deals and companies",
        "Archive old data rather than deleting (you might need it later)",
        "Tag contacts liberally - tags make segmentation easier",
        "Set up data validation rules to prevent junk data"
      ]
    },
    {
      title: "Workflow Design",
      icon: Workflow,
      color: "nebula-violet",
      tips: [
        "Start simple - one trigger, one action",
        "Add complexity gradually as you learn what works",
        "Always include error handling",
        "Use clear, descriptive names for workflows",
        "Review and prune unused workflows quarterly"
      ]
    },
    {
      title: "Agent Training",
      icon: Bot,
      color: "nebula-teal",
      tips: [
        "Upload your best docs to the knowledge base first",
        "Provide feedback on agent actions (thumbs up/down)",
        "Be specific when correcting agents",
        "Give agents time to learn - they get better with usage",
        "Set clear boundaries (what agents CAN'T do)"
      ]
    },
    {
      title: "Team Collaboration",
      icon: Users,
      color: "nebula-violet",
      tips: [
        "Define roles clearly - who owns what",
        "Use @ mentions in notes to notify team members",
        "Set up team views in CRM for transparency",
        "Have a single source of truth for important data",
        "Regular team syncs on what's working/not working"
      ]
    }
  ];

  const performanceTips = [
    { icon: Command, text: "Use keyboard shortcuts (⌘K opens command palette)" },
    { icon: Eye, text: "Set up saved views for frequent filters" },
    { icon: ListChecks, text: "Batch similar tasks (all follow-ups at once)" },
    { icon: Bot, text: "Let AI handle repetitive work, you focus on decisions" },
    { icon: Target, text: "Review your daily priorities from Neptune every morning" }
  ];

  const securityTips = [
    { icon: Key, text: "Never share API keys publicly" },
    { icon: Shield, text: "Use role-based permissions for team members" },
    { icon: Lock, text: "Enable 2FA for all users" },
    { icon: FileText, text: "Review audit logs monthly" }
  ];

  return (
    <div className="space-y-8">
      {/* Category Cards */}
      <div className="grid gap-4">
        {categories.map((category, index) => {
          const CategoryIcon = category.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-lg bg-${category.color}/20 flex items-center justify-center`}>
                  <CategoryIcon className={`h-5 w-5 text-${category.color}`} />
                </div>
                <h4 className="font-semibold text-foreground text-lg">{category.title}</h4>
              </div>
              <div className="space-y-2 ml-1">
                {category.tips.map((tip, tipIndex) => (
                  <div key={tipIndex} className="flex items-start gap-3 text-sm text-muted-foreground/90">
                    <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Tips */}
      <div className="border border-nebula-teal/20 rounded-xl p-5 bg-nebula-teal/5">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5 text-nebula-teal" />
          <h4 className="font-semibold text-foreground">Performance Tips</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {performanceTips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                <TipIcon className="h-4 w-4 text-nebula-teal flex-shrink-0" />
                <span>{tip.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security */}
      <div className="border border-nebula-violet/20 rounded-xl p-5 bg-nebula-violet/5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Security</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {securityTips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                <TipIcon className="h-4 w-4 text-nebula-violet flex-shrink-0" />
                <span>{tip.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Unstuck */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="h-5 w-5 text-nebula-teal" />
          <h4 className="font-semibold text-foreground">Getting Unstuck</h4>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/90">
          <p>• Ask Neptune for help first</p>
          <p>• Check the Troubleshooting docs</p>
          <p>• Use the feedback widget to report issues</p>
          <p>• Email support@galaxyco.ai - we respond within 24 hours</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Troubleshooting Content Component
function TroubleshootingContent() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  const faqs = [
    {
      question: "Neptune isn't responding to my questions",
      answer: "Check your internet connection. Refresh the page. If it persists, try: Settings → Clear Cache. Neptune requires an active connection to our AI service.",
      icon: MessageSquare
    },
    {
      question: "I can't see contacts I just imported",
      answer: "Imports process in background. Check CRM → Import History for status. Large imports (500+ contacts) can take 2-3 minutes. Refresh the page after the import completes.",
      icon: Upload
    },
    {
      question: "Workflows aren't triggering",
      answer: "Check three things: 1) Is the workflow active? (green toggle), 2) Do the trigger conditions match? (test with sample data), 3) Check workflow logs for errors (Orchestration → Logs).",
      icon: Workflow
    },
    {
      question: "Lead scores seem wrong",
      answer: "Scoring improves as Neptune learns your patterns. Provide feedback on scores (thumbs up/down). Adjust scoring criteria in CRM Settings → Lead Scoring. New workspaces need ~50 contacts before scores stabilize.",
      icon: Gauge
    },
    {
      question: "Can't upload documents to knowledge base",
      answer: "Supported formats: PDF, DOC, DOCX, TXT, MD. Max file size: 25MB. Check that file isn't password-protected. Clear browser cache if upload hangs.",
      icon: FileText
    },
    {
      question: "Integration isn't syncing",
      answer: "Go to Settings → Integrations → [Your Integration] → Test Connection. If it fails, you may need to re-authorize. Some integrations have rate limits - check status.",
      icon: Link
    },
    {
      question: "Slow performance",
      answer: "Clear browser cache. Try a different browser (Chrome recommended). Check your internet speed. If workspace is >10,000 contacts, performance may vary - contact support.",
      icon: Timer
    },
    {
      question: "Lost data or made a mistake",
      answer: "Most actions can be undone immediately. For data recovery, contact support@galaxyco.ai with details. We keep backups for 30 days.",
      icon: RotateCcw
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Common issues and how to solve them. Click any question to see the answer.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-2">
        {faqs.map((faq, index) => {
          const FaqIcon = faq.icon;
          const isOpen = openQuestion === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`border rounded-xl overflow-hidden transition-all ${
                isOpen ? 'border-nebula-teal/40 bg-nebula-teal/5' : 'border-border/40 hover:border-border/60'
              }`}
            >
              <button
                onClick={() => setOpenQuestion(isOpen ? null : index)}
                className="w-full flex items-center gap-4 p-4 text-left"
                aria-expanded={isOpen}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isOpen ? 'bg-nebula-teal/20' : 'bg-muted/50'
                }`}>
                  <FaqIcon className={`h-5 w-5 ${isOpen ? 'text-nebula-teal' : 'text-muted-foreground'}`} />
                </div>
                <span className={`flex-1 font-medium ${isOpen ? 'text-nebula-teal' : 'text-foreground'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 ml-14">
                      <p className="text-muted-foreground/90 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Still Stuck */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Still Stuck?</h4>
        </div>
        <p className="text-sm text-muted-foreground/90 mb-3">
          Email <span className="text-nebula-teal font-medium">support@galaxyco.ai</span> with:
        </p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-nebula-violet/20 flex items-center justify-center text-xs text-nebula-violet font-bold">1</span>
            <span>What you were trying to do</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-nebula-violet/20 flex items-center justify-center text-xs text-nebula-violet font-bold">2</span>
            <span>What happened instead</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-nebula-violet/20 flex items-center justify-center text-xs text-nebula-violet font-bold">3</span>
            <span>Screenshots if possible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-nebula-violet/20 flex items-center justify-center text-xs text-nebula-violet font-bold">4</span>
            <span>Your browser/OS</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/70 mt-3 italic">We respond within 24 hours.</p>
      </div>
    </div>
  );
}

// ==================== DEVELOPERS SECTION COMPONENTS ====================

// Enhanced API Overview Content Component
function APIOverviewContent() {
  const [copied, setCopied] = useState(false);
  const baseUrl = "/api";
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = baseUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const principles = [
    { title: "RESTful Design", icon: Globe, description: "Standard HTTP methods (GET, POST, PUT, PATCH, DELETE). Predictable resource URLs." },
    { title: "JSON Everywhere", icon: FileCode, description: "All requests accept JSON payloads. All responses return JSON. Content-Type: application/json required." },
    { title: "Idempotency", icon: Repeat, description: "PUT and DELETE are idempotent. POST operations return idempotency keys to prevent duplicate actions." }
  ];

  const capabilities = [
    "Full CRUD on Contacts, Deals, Workflows, Documents",
    "Execute workflows programmatically",
    "Query Neptune AI assistant",
    "Subscribe to webhooks for real-time events",
    "Upload/download files",
    "Manage team members and permissions"
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          GalaxyCo.ai provides a comprehensive REST API for building integrations, automating workflows, and extending platform capabilities.
        </p>
      </div>

      {/* Base URL with Copy Button */}
      <div className="border border-nebula-teal/30 rounded-xl p-4 bg-nebula-dark/80">
        <div className="flex items-center gap-3 mb-3">
          <Server className="h-5 w-5 text-nebula-teal" />
          <span className="font-semibold text-nebula-frost">Base URL</span>
        </div>
        <div className="relative">
          <code className="text-nebula-teal bg-nebula-dark px-4 py-3 pr-12 rounded-lg block font-mono text-sm border border-border/40">
            {baseUrl}
          </code>
          <button
            onClick={copyToClipboard}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Copy base URL to clipboard"
          >
            {copied ? (
              <CircleCheck className="h-4 w-4 text-nebula-teal" />
            ) : (
              <Copy className="h-4 w-4 text-white/70 hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Architecture Principles - Unified styling */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-nebula-violet" />
          Architecture Principles
        </h4>
        <div className="space-y-3">
          {principles.map((principle, index) => {
            const PrincipleIcon = principle.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 border border-border/40 rounded-xl hover:border-nebula-violet/30 transition-colors"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-nebula-violet/25 to-nebula-violet/10 flex items-center justify-center flex-shrink-0 border border-nebula-violet/20">
                  <PrincipleIcon className="h-5 w-5 text-nebula-violet" />
                </div>
                <div>
                  <h5 className="font-medium text-foreground">{principle.title}</h5>
                  <p className="text-muted-foreground/80 text-sm mt-1">{principle.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Response Format */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-nebula-teal/20 rounded-xl p-4 bg-nebula-teal/5">
          <div className="flex items-center gap-2 mb-3">
            <CircleCheck className="h-5 w-5 text-nebula-teal" />
            <span className="font-medium text-foreground">Success Response</span>
          </div>
          <code className="text-xs text-nebula-frost/80 bg-nebula-dark/60 p-3 rounded-lg block font-mono whitespace-pre">
{`{"data": {...}, "meta": {...}}`}
          </code>
        </div>
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <CircleX className="h-5 w-5 text-red-400" />
            <span className="font-medium text-foreground">Error Response</span>
          </div>
          <code className="text-xs text-nebula-frost/80 bg-nebula-dark/60 p-3 rounded-lg block font-mono whitespace-pre">
{`{"error": {"code": "...", "message": "..."}}`}
          </code>
        </div>
      </div>

      {/* Common Capabilities */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-nebula-teal" />
          Common Capabilities
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {capabilities.map((cap, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
              <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0" />
              <span>{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started - More visual weight */}
      <div className="bg-gradient-to-r from-nebula-violet/15 to-nebula-teal/15 border border-nebula-violet/30 rounded-xl p-6 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-nebula-violet/20 flex items-center justify-center">
            <Key className="h-5 w-5 text-nebula-violet" />
          </div>
          <h4 className="font-semibold text-foreground text-lg">Getting Started</h4>
        </div>
        <p className="text-sm text-muted-foreground/90 leading-relaxed">
          Generate an API key in <span className="text-nebula-teal font-semibold">Settings → Developers → API Keys</span>. Include it in all requests via the <code className="px-2 py-1 rounded-md bg-nebula-dark/70 text-nebula-frost text-xs font-mono border border-border/40">Authorization: Bearer YOUR_KEY</code> header.
        </p>
      </div>
    </div>
  );
}

// Enhanced Authentication Content Component
function AuthenticationContent() {
  const [oauthOpen, setOauthOpen] = useState(false);

  const scopes = [
    { scope: "contacts:read", description: "Read contacts/deals" },
    { scope: "contacts:write", description: "Create/update contacts" },
    { scope: "workflows:read", description: "View workflows" },
    { scope: "workflows:execute", description: "Run workflows" },
    { scope: "knowledge:read", description: "Access knowledge base" },
    { scope: "admin:all", description: "Full admin access" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          GalaxyCo.ai supports two authentication methods: API Keys for server-to-server integrations and OAuth 2.0 for user-authorized applications.
        </p>
      </div>

      {/* API Keys */}
      <div className="border border-nebula-teal/20 rounded-xl p-5 bg-nebula-teal/5">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-6 w-6 text-nebula-teal" />
          <div>
            <h4 className="font-semibold text-foreground text-lg">API Keys</h4>
            <p className="text-sm text-muted-foreground/70">Recommended for Server-to-Server</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-nebula-dark/40 rounded-lg p-4">
            <p className="text-sm text-muted-foreground/80 mb-2">Include in Authorization header:</p>
            <code className="text-nebula-frost text-sm font-mono">Authorization: Bearer gco_live_abc123xyz789</code>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-nebula-teal/20 text-nebula-teal font-mono text-xs">gco_live_</span>
              <span className="text-muted-foreground/80">Production keys</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-nebula-violet/20 text-nebula-violet font-mono text-xs">gco_test_</span>
              <span className="text-muted-foreground/80">Test/sandbox keys</span>
            </div>
          </div>
        </div>
      </div>

      {/* OAuth 2.0 */}
      <div className="border border-nebula-violet/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setOauthOpen(!oauthOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-violet/5 transition-colors"
          aria-expanded={oauthOpen}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-nebula-violet/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-nebula-violet" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-foreground block">OAuth 2.0</span>
              <span className="text-sm text-muted-foreground/70">For User-Authorized Apps</span>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${oauthOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {oauthOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-4 pb-4 space-y-4">
                <div className="bg-nebula-dark/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground/80 mb-2">Authorization URL:</p>
                  <code className="text-nebula-frost text-xs font-mono break-all">
                    https://app.galaxyco.ai/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=contacts:read
                  </code>
                </div>
                <p className="text-sm text-muted-foreground/80">
                  Standard Authorization Code flow with PKCE for security. Access tokens valid for 1 hour. Use refresh tokens for long-lived access.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scopes */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-nebula-teal" />
          Available Scopes
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {scopes.map((s, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <code className="px-2 py-1 rounded bg-nebula-dark/40 text-nebula-teal font-mono text-xs">{s.scope}</code>
              <span className="text-muted-foreground/80">{s.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="h-5 w-5 text-nebula-teal" />
          <h4 className="font-semibold text-foreground">Security Best Practices</h4>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/90">
          <p>• Never commit keys to version control</p>
          <p>• Rotate keys every 90 days</p>
          <p>• Request minimum scopes needed</p>
          <p>• Store tokens encrypted</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced API Reference Content Component  
function APIReferenceContent() {
  const [activeEndpoint, setActiveEndpoint] = useState("contacts");

  const endpoints = [
    {
      id: "contacts",
      name: "Contacts API",
      icon: Users,
      routes: [
        { method: "GET", path: "/v1/contacts", description: "List contacts" },
        { method: "POST", path: "/v1/contacts", description: "Create contact" },
        { method: "GET", path: "/v1/contacts/{id}", description: "Get contact" },
        { method: "PATCH", path: "/v1/contacts/{id}", description: "Update contact" },
        { method: "DELETE", path: "/v1/contacts/{id}", description: "Delete contact" }
      ]
    },
    {
      id: "workflows",
      name: "Workflows API",
      icon: Workflow,
      routes: [
        { method: "GET", path: "/v1/workflows", description: "List workflows" },
        { method: "POST", path: "/v1/workflows", description: "Create workflow" },
        { method: "POST", path: "/v1/workflows/{id}/execute", description: "Trigger workflow" },
        { method: "GET", path: "/v1/workflows/{id}/runs", description: "Get execution history" }
      ]
    },
    {
      id: "neptune",
      name: "Neptune AI API",
      icon: Bot,
      routes: [
        { method: "POST", path: "/v1/neptune/chat", description: "Send message to Neptune" },
        { method: "GET", path: "/v1/neptune/context", description: "Get workspace context" },
        { method: "POST", path: "/v1/neptune/execute", description: "Execute Neptune command" }
      ]
    },
    {
      id: "knowledge",
      name: "Knowledge Base API",
      icon: BookOpen,
      routes: [
        { method: "GET", path: "/v1/knowledge/documents", description: "List documents" },
        { method: "POST", path: "/v1/knowledge/documents", description: "Upload document" },
        { method: "POST", path: "/v1/knowledge/search", description: "Search knowledge base" }
      ]
    }
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400",
    POST: "bg-blue-500/20 text-blue-400",
    PATCH: "bg-amber-500/20 text-amber-400",
    DELETE: "bg-red-500/20 text-red-400"
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Comprehensive API endpoint documentation organized by resource type.
        </p>
      </div>

      {/* Endpoint Tabs */}
      <div className="flex flex-wrap gap-2">
        {endpoints.map((endpoint) => {
          const EndpointIcon = endpoint.icon;
          return (
            <button
              key={endpoint.id}
              onClick={() => setActiveEndpoint(endpoint.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeEndpoint === endpoint.id
                  ? 'bg-nebula-teal/20 text-nebula-teal border border-nebula-teal/30'
                  : 'bg-card/50 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <EndpointIcon className="h-4 w-4" />
              {endpoint.name}
            </button>
          );
        })}
      </div>

      {/* Active Endpoint Routes */}
      {endpoints.map((endpoint) => (
        activeEndpoint === endpoint.id && (
          <motion.div
            key={endpoint.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border/40 rounded-xl overflow-hidden"
          >
            {endpoint.routes.map((route, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 ${index !== endpoint.routes.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${methodColors[route.method]}`}>
                  {route.method}
                </span>
                <code className="text-nebula-frost/80 text-sm font-mono flex-1">{route.path}</code>
                <span className="text-sm text-muted-foreground/70 hidden sm:block">{route.description}</span>
              </div>
            ))}
          </motion.div>
        )
      ))}

      {/* Query Parameters */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground mb-4">Query Parameters</h4>
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <code className="text-nebula-teal font-mono">?filter[status]=active</code>
            <span className="text-muted-foreground/80">Filter by field</span>
          </div>
          <div className="flex gap-4">
            <code className="text-nebula-teal font-mono">?sort=-created_at</code>
            <span className="text-muted-foreground/80">Sort (prefix - for descending)</span>
          </div>
          <div className="flex gap-4">
            <code className="text-nebula-teal font-mono">?fields=id,name,email</code>
            <span className="text-muted-foreground/80">Return only specific fields</span>
          </div>
        </div>
      </div>

      {/* Interactive Docs Link */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <ExternalLink className="h-5 w-5 text-nebula-violet" />
          <span className="text-foreground">
            Full interactive API reference with live examples: <a href="/docs/api" className="text-nebula-teal font-medium hover:underline">docs/api</a>
          </span>
        </div>
      </div>
    </div>
  );
}

// Enhanced Webhooks Content Component
function WebhooksContent() {
  const [eventsOpen, setEventsOpen] = useState(true);

  const eventTypes = [
    { category: "CRM Events", events: ["contact.created", "contact.updated", "deal.stage_changed", "deal.closed_won"] },
    { category: "Workflow Events", events: ["workflow.started", "workflow.completed", "workflow.failed"] },
    { category: "System Events", events: ["user.invited", "integration.connected"] }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Webhooks deliver real-time event notifications to your server when things happen in GalaxyCo.ai.
        </p>
      </div>

      {/* Setup Steps */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-nebula-teal" />
          Setting Up Webhooks
        </h4>
        <div className="space-y-3">
          {[
            "Go to Settings → Developers → Webhooks",
            "Click Create Webhook",
            "Enter your endpoint URL (must be HTTPS)",
            "Select events to subscribe to",
            "Save and note the signing secret"
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-nebula-teal/20 flex items-center justify-center text-nebula-teal font-bold text-sm flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-muted-foreground/90 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className="border border-nebula-teal/20 rounded-xl overflow-hidden bg-nebula-teal/5">
        <button
          onClick={() => setEventsOpen(!eventsOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-nebula-teal/10 transition-colors"
          aria-expanded={eventsOpen}
        >
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-nebula-teal" />
            <span className="font-semibold text-foreground">Event Types</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {eventsOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="px-4 pb-4 space-y-4">
                {eventTypes.map((category, index) => (
                  <div key={index}>
                    <h5 className="font-medium text-foreground text-sm mb-2">{category.category}</h5>
                    <div className="flex flex-wrap gap-2">
                      {category.events.map((event, i) => (
                        <code key={i} className="px-2 py-1 rounded bg-nebula-dark/40 text-nebula-teal text-xs font-mono">
                          {event}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature Verification */}
      <div className="border border-nebula-violet/20 rounded-xl p-5 bg-nebula-violet/5">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Signature Verification</h4>
        </div>
        <p className="text-sm text-muted-foreground/80 mb-3">
          Every webhook includes <code className="text-nebula-teal text-xs">X-GalaxyCo-Signature</code> header. Verify it to ensure the request came from us.
        </p>
      </div>

      {/* Retry Logic */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <RefreshCw className="h-5 w-5 text-nebula-teal" />
          <h4 className="font-semibold text-foreground">Retry Logic</h4>
        </div>
        <p className="text-sm text-muted-foreground/90">
          If your endpoint returns non-2xx status or times out ({">"}10s), we retry with exponential backoff: 1min, 5min, 30min, 2hr, 12hr. After 5 failures, webhook is disabled.
        </p>
      </div>
    </div>
  );
}

// Enhanced Rate Limits Content Component
function RateLimitsContent() {
  const planLimits = [
    { plan: "Starter", limit: "1,000 requests/hour", color: "nebula-teal" },
    { plan: "Professional", limit: "5,000 requests/hour", color: "nebula-violet" },
    { plan: "Enterprise", limit: "20,000 requests/hour", color: "nebula-teal" }
  ];

  const strategies = [
    { icon: Layers, title: "Use Bulk Endpoints", description: "Instead of creating 100 contacts individually, use bulk create endpoint" },
    { icon: Database, title: "Cache Responses", description: "Cache data that doesn't change frequently (team members, workflow definitions)" },
    { icon: Webhook, title: "Use Webhooks", description: "Instead of polling for changes, subscribe to webhooks for real-time updates" },
    { icon: Timer, title: "Exponential Backoff", description: "When rate limited, wait progressively longer between retries: 1s, 2s, 4s, 8s..." }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          API rate limits prevent abuse and ensure reliable service for all users.
        </p>
      </div>

      {/* Limits by Plan */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-nebula-teal" />
          Limits by Plan
        </h4>
        <div className="grid sm:grid-cols-3 gap-4">
          {planLimits.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border border-${plan.color}/30 rounded-xl p-4 bg-${plan.color}/5 text-center`}
            >
              <h5 className="font-semibold text-foreground">{plan.plan}</h5>
              <p className={`text-${plan.color} font-mono text-lg mt-2`}>{plan.limit}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rate Limit Headers */}
      <div className="border border-border/40 rounded-xl p-5 bg-nebula-dark/30">
        <h4 className="font-semibold text-foreground mb-4">Rate Limit Headers</h4>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex gap-2">
            <span className="text-nebula-teal">X-RateLimit-Limit:</span>
            <span className="text-nebula-frost/70">5000</span>
          </div>
          <div className="flex gap-2">
            <span className="text-nebula-teal">X-RateLimit-Remaining:</span>
            <span className="text-nebula-frost/70">4850</span>
          </div>
          <div className="flex gap-2">
            <span className="text-nebula-teal">X-RateLimit-Reset:</span>
            <span className="text-nebula-frost/70">1702558800</span>
          </div>
        </div>
      </div>

      {/* Optimization Strategies */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-nebula-violet" />
          Optimization Strategies
        </h4>
        <div className="space-y-4">
          {strategies.map((strategy, index) => {
            const StrategyIcon = strategy.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-nebula-violet/20 flex items-center justify-center flex-shrink-0">
                  <StrategyIcon className="h-5 w-5 text-nebula-violet" />
                </div>
                <div>
                  <h5 className="font-medium text-foreground">{strategy.title}</h5>
                  <p className="text-muted-foreground/80 text-sm">{strategy.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhanced SDKs Content Component
function SDKsContent() {
  const [activeSDK, setActiveSDK] = useState("javascript");

  const sdks = [
    { id: "javascript", name: "JavaScript/TypeScript", install: "npm install @galaxyco/sdk", icon: Code2 },
    { id: "python", name: "Python", install: "pip install galaxyco", icon: Terminal }
  ];

  const features = [
    "Automatic retry with exponential backoff",
    "Built-in rate limit handling",
    "Type-safe (TypeScript) / Type-hinted (Python)",
    "Async/await support",
    "Pagination helpers",
    "Webhook signature verification"
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Official SDKs make integrating with GalaxyCo.ai faster and easier. We handle authentication, retries, and error handling.
        </p>
      </div>

      {/* SDK Tabs */}
      <div className="flex gap-2">
        {sdks.map((sdk) => {
          const SDKIcon = sdk.icon;
          return (
            <button
              key={sdk.id}
              onClick={() => setActiveSDK(sdk.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSDK === sdk.id
                  ? 'bg-nebula-teal/20 text-nebula-teal border border-nebula-teal/30'
                  : 'bg-card/50 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <SDKIcon className="h-4 w-4" />
              {sdk.name}
            </button>
          );
        })}
      </div>

      {/* Installation */}
      {sdks.map((sdk) => (
        activeSDK === sdk.id && (
          <motion.div key={sdk.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="border border-nebula-dark/60 rounded-xl bg-nebula-dark/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-nebula-teal" />
                <span className="text-sm text-muted-foreground">Installation</span>
              </div>
              <code className="text-nebula-frost font-mono text-sm">{sdk.install}</code>
            </div>
          </motion.div>
        )
      ))}

      {/* Features */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-nebula-violet" />
          Features
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
              <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Other Languages */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-3">Other Languages</h4>
        <div className="space-y-2 text-sm text-muted-foreground/90">
          <p><span className="text-nebula-teal font-medium">Ruby:</span> gem install galaxyco (community-maintained)</p>
          <p><span className="text-nebula-teal font-medium">Go:</span> go get github.com/galaxyco/go-sdk (coming soon)</p>
          <p><span className="text-nebula-teal font-medium">.NET:</span> NuGet package in development</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Error Handling Content Component
function ErrorHandlingContent() {
  const [openCode, setOpenCode] = useState<number | null>(0);

  const statusCodes = [
    { code: "400", name: "Bad Request", description: "Invalid request parameters. Check the error message for details.", color: "amber" },
    { code: "401", name: "Unauthorized", description: "Invalid or missing API key. Verify your Authorization header.", color: "red" },
    { code: "403", name: "Forbidden", description: "Valid credentials but insufficient permissions. Check your API key scopes.", color: "red" },
    { code: "404", name: "Not Found", description: "Resource doesn't exist. Verify the ID is correct.", color: "amber" },
    { code: "429", name: "Too Many Requests", description: "Rate limit exceeded. Check Retry-After header.", color: "violet" },
    { code: "500", name: "Internal Server Error", description: "Something went wrong on our end. Include request_id when contacting support.", color: "red" }
  ];

  const errorCodes = [
    { code: "invalid_request", description: "Malformed request. Fix the syntax." },
    { code: "missing_field", description: "Required field not provided." },
    { code: "duplicate", description: "Resource already exists (e.g., contact with same email)." },
    { code: "rate_limit_exceeded", description: "Too many requests." },
    { code: "invalid_credentials", description: "API key is invalid or expired." }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Understand API errors and implement robust error handling.
        </p>
      </div>

      {/* HTTP Status Codes */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-nebula-teal" />
          HTTP Status Codes
        </h4>
        <div className="space-y-2">
          {statusCodes.map((status, index) => {
            const isOpen = openCode === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isOpen ? 'border-nebula-teal/40' : 'border-border/40'
                }`}
              >
                <button
                  onClick={() => setOpenCode(isOpen ? null : index)}
                  className="w-full flex items-center gap-4 p-3 text-left"
                >
                  <span className={`px-2 py-1 rounded font-mono text-sm font-bold bg-${status.color}-500/20 text-${status.color}-400`}>
                    {status.code}
                  </span>
                  <span className="font-medium text-foreground">{status.name}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
                      <div className="px-4 pb-3 ml-16">
                        <p className="text-sm text-muted-foreground/80">{status.description}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Common Error Codes */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground mb-4">Common Error Codes</h4>
        <div className="space-y-2">
          {errorCodes.map((error, index) => (
            <div key={index} className="flex gap-4 text-sm">
              <code className="text-nebula-teal font-mono whitespace-nowrap">{error.code}</code>
              <span className="text-muted-foreground/80">{error.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Debugging Tip */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Info className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Debugging</h4>
        </div>
        <p className="text-sm text-muted-foreground/90">
          Every response includes <code className="text-nebula-teal text-xs">X-Request-ID</code> header. Include this when contacting support for faster resolution.
        </p>
      </div>
    </div>
  );
}

// Enhanced Changelog Content Component
function ChangelogContent() {
  const versions = [
    {
      version: "v1.3.0",
      date: "2025-12-14",
      label: "Latest",
      changes: [
        "Added Neptune AI chat endpoint (POST /v1/neptune/chat)",
        "New bulk contact update endpoint",
        "Improved rate limit headers with reset timestamp",
        "Fixed: Workflow execution webhook payload format"
      ]
    },
    {
      version: "v1.2.0",
      date: "2025-12-01",
      changes: [
        "Added knowledge base API endpoints",
        "New webhook events for deal stage changes",
        "OAuth 2.0 with PKCE support",
        "Enhanced error responses with field-level details"
      ]
    },
    {
      version: "v1.1.0",
      date: "2025-11-15",
      changes: [
        "Webhook signature verification",
        "Pagination cursor improvements",
        "Added fields query parameter",
        "Beta: Bulk operations API"
      ]
    }
  ];

  const roadmap = [
    "GraphQL API (Q1 2026)",
    "Advanced filtering & search",
    "Real-time subscriptions via WebSockets",
    "Expanded bulk operations"
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Stay informed about API changes and plan your integration updates. Current Version: <span className="text-nebula-teal font-semibold">v1</span>
        </p>
      </div>

      {/* Version History */}
      <div className="relative space-y-4">
        <div className="absolute left-[18px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-nebula-teal/40 to-nebula-violet/20 hidden sm:block" />
        {versions.map((version, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex gap-4"
          >
            <div className="relative z-10 w-9 h-9 rounded-lg bg-gradient-to-br from-nebula-teal to-nebula-violet flex items-center justify-center flex-shrink-0">
              <GitBranch className="h-4 w-4 text-nebula-frost" />
            </div>
            <div className="flex-1 border border-border/40 rounded-xl p-4 bg-card/50">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-semibold text-foreground">{version.version}</span>
                <span className="text-sm text-muted-foreground/70">{version.date}</span>
                {version.label && (
                  <span className="px-2 py-0.5 rounded bg-nebula-teal/20 text-nebula-teal text-xs font-medium">
                    {version.label}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {version.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground/80">
                    <span className="text-nebula-teal mt-1">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Roadmap */}
      <div className="border border-nebula-violet/20 rounded-xl p-5 bg-nebula-violet/5">
        <div className="flex items-center gap-3 mb-4">
          <Rocket className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Roadmap (Next 6 Months)</h4>
        </div>
        <div className="space-y-2">
          {roadmap.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
              <ChevronRight className="h-4 w-4 text-nebula-violet" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-nebula-teal" />
          <span className="text-foreground">
            Subscribe to updates: <span className="text-nebula-teal font-medium">developers@galaxyco.ai</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== ADMINS SECTION COMPONENTS ====================

// Enhanced Team Management Content Component
function TeamManagementContent() {
  const roles = [
    { name: "Admin", description: "Full access including billing, team management, and workspace settings.", icon: Shield, color: "nebula-teal" },
    { name: "Member", description: "Can create/edit contacts, workflows, and documents. Cannot manage billing or invite users.", icon: Users, color: "nebula-violet" },
    { name: "Read-Only", description: "View-only access to all data. Cannot make changes.", icon: Eye, color: "muted-foreground" }
  ];

  const actions = [
    { icon: UserPlus, title: "Invite Members", description: "Enter email addresses, select role, they receive a signup link valid for 7 days." },
    { icon: Edit, title: "Edit Roles", description: "Click on any team member → Change Role. Takes effect immediately." },
    { icon: Pause, title: "Deactivate Users", description: "Preserve data and activity history. Reactivate anytime." },
    { icon: Trash2, title: "Remove Users", description: "Permanently remove from workspace. Their data is reassigned to owner." }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Manage your team effectively with comprehensive controls for adding, organizing, and managing members.
        </p>
      </div>

      {/* User Roles */}
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-nebula-teal" />
          User Roles
        </h4>
        <div className="space-y-3">
          {roles.map((role, index) => {
            const RoleIcon = role.icon;
            return (
              <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 border border-border/40 rounded-xl">
                <div className={`h-10 w-10 rounded-lg bg-${role.color}/20 flex items-center justify-center flex-shrink-0`}>
                  <RoleIcon className={`h-5 w-5 text-${role.color}`} />
                </div>
                <div>
                  <h5 className="font-medium text-foreground">{role.name}</h5>
                  <p className="text-muted-foreground/80 text-sm mt-1">{role.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Managing Members */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-nebula-violet" />
          Managing Members
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <div key={index} className="flex gap-3">
                <ActionIcon className="h-5 w-5 text-nebula-teal flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-foreground text-sm">{action.title}</h5>
                  <p className="text-muted-foreground/70 text-xs mt-0.5">{action.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Best Practices</h4>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/90">
          <p>• Use read-only access for contractors or external stakeholders</p>
          <p>• Create teams that mirror your org structure</p>
          <p>• Regular audit of active users (quarterly)</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Permissions Content Component
function PermissionsContent() {
  const permissionMatrix = [
    { resource: "Contacts & Deals", permissions: ["View", "Create", "Edit", "Delete", "Export"] },
    { resource: "Workflows & Agents", permissions: ["View", "Execute", "Edit", "Create", "Delete"] },
    { resource: "Knowledge Base", permissions: ["Read", "Upload", "Edit", "Delete"] },
    { resource: "Settings", permissions: ["View", "Edit", "Billing", "Team", "Integrations"] }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Control exactly what team members can do with granular role-based permissions.
        </p>
      </div>

      {/* Built-in Roles */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { role: "Workspace Admin", desc: "Full control over everything including billing", icon: Shield, color: "nebula-teal" },
          { role: "Team Admin", desc: "Manage team members and their permissions", icon: Users, color: "nebula-violet" },
          { role: "Member", desc: "Standard access - create/edit contacts, deals, workflows", icon: User, color: "nebula-teal" },
          { role: "Read-Only", desc: "View all data but cannot make changes", icon: Eye, color: "muted-foreground" }
        ].map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ItemIcon className={`h-5 w-5 text-${item.color}`} />
                <h5 className="font-medium text-foreground">{item.role}</h5>
              </div>
              <p className="text-muted-foreground/70 text-sm">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-nebula-teal" />
          Permission Matrix
        </h4>
        <div className="space-y-4">
          {permissionMatrix.map((item, index) => (
            <div key={index}>
              <h5 className="font-medium text-foreground text-sm mb-2">{item.resource}</h5>
              <div className="flex flex-wrap gap-2">
                {item.permissions.map((perm, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-nebula-teal/10 text-nebula-teal text-xs font-medium">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Settings className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Custom Roles (Professional & Enterprise)</h4>
        </div>
        <p className="text-sm text-muted-foreground/90">
          Create custom roles tailored to your needs. Go to Settings → Roles → Create Custom Role. Examples: 'Sales Rep', 'Marketing Manager', 'Support Agent'.
        </p>
      </div>
    </div>
  );
}

// Enhanced Security Content Component
function SecurityContent() {
  const features = [
    { icon: Lock, title: "Single Sign-On (SSO)", description: "Supports SAML 2.0 and OAuth 2.0 providers: Okta, Azure AD, Google Workspace" },
    { icon: Key, title: "Two-Factor Authentication", description: "Authenticator apps, SMS codes, or hardware keys (YubiKey)" },
    { icon: Timer, title: "Session Management", description: "Configure timeout (1 hour to 30 days) and concurrent session limits" },
    { icon: Globe, title: "IP Allowlisting", description: "Restrict access to specific IP addresses or ranges" },
    { icon: Shield, title: "Password Policies", description: "Enforce minimum length, complexity, expiration, and reuse prevention" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Secure your workspace with enterprise-grade security controls.
        </p>
      </div>

      {/* Security Features */}
      <div className="space-y-3">
        {features.map((feature, index) => {
          const FeatureIcon = feature.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
              className="flex gap-4 p-4 border border-border/40 rounded-xl hover:border-nebula-teal/30 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-nebula-teal/20 flex items-center justify-center flex-shrink-0">
                <FeatureIcon className="h-5 w-5 text-nebula-teal" />
              </div>
              <div>
                <h5 className="font-medium text-foreground">{feature.title}</h5>
                <p className="text-muted-foreground/80 text-sm mt-1">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Security */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Additional Security</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/90">
          <p>• Audit logs track all security events</p>
          <p>• Failed login alerts</p>
          <p>• API key rotation reminders</p>
          <p>• Encryption at rest and in transit (AES-256)</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Billing Content Component
function BillingContent() {
  const plans = [
    { name: "Starter", price: "$49/mo", features: "5 seats, 10K contacts, 1K workflow runs/mo" },
    { name: "Professional", price: "$149/mo", features: "15 seats, 50K contacts, 10K workflow runs/mo" },
    { name: "Enterprise", price: "Custom", features: "Unlimited seats, contacts, and runs" }
  ];

  const metrics = [
    { icon: Users, label: "Active users / seat limit" },
    { icon: Zap, label: "API requests (current month)" },
    { icon: Database, label: "Storage used / limit" },
    { icon: Workflow, label: "Workflow executions" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Manage your subscription, track usage, and control costs.
        </p>
      </div>

      {/* Plans */}
      <div className="grid sm:grid-cols-3 gap-4">
        {plans.map((plan, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className="border border-border/40 rounded-xl p-4 text-center bg-card/50">
            <h5 className="font-semibold text-foreground">{plan.name}</h5>
            <p className="text-nebula-teal text-xl font-bold mt-2">{plan.price}</p>
            <p className="text-muted-foreground/70 text-xs mt-2">{plan.features}</p>
          </motion.div>
        ))}
      </div>

      {/* Usage Metrics */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-nebula-violet" />
          Usage Dashboard
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const MetricIcon = metric.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                <MetricIcon className="h-4 w-4 text-nebula-teal" />
                <span>{metric.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Optimization */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-5 w-5 text-nebula-teal" />
          <h4 className="font-semibold text-foreground">Cost Optimization Tips</h4>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground/90">
          <p>• Deactivate unused users to free up seats</p>
          <p>• Archive old workflows to reduce executions</p>
          <p>• Use bulk API operations to reduce request count</p>
          <p>• Review usage monthly and adjust plan accordingly</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Audit Logs Content Component
function AuditLogsContent() {
  const logTypes = [
    { category: "User Actions", items: ["Login/logout events", "Failed login attempts", "Password changes", "2FA enable/disable"] },
    { category: "Data Changes", items: ["Contact/deal created, updated, deleted", "Workflow modified or executed", "Document uploaded or removed"] },
    { category: "API Activity", items: ["API key created or revoked", "API requests (with endpoints and status)", "Webhook deliveries"] }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Comprehensive activity tracking for security, compliance, and debugging.
        </p>
      </div>

      {/* What Gets Logged */}
      <div className="space-y-4">
        {logTypes.map((type, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className="border border-border/40 rounded-xl p-4">
            <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-nebula-teal" />
              {type.category}
            </h5>
            <div className="grid sm:grid-cols-2 gap-2">
              {type.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground/80">
                  <span className="text-nebula-teal">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Retention */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-nebula-teal/20 rounded-xl p-4 bg-nebula-teal/5">
          <h5 className="font-medium text-foreground mb-2">Professional</h5>
          <p className="text-nebula-teal text-lg font-bold">90-day retention</p>
        </div>
        <div className="border border-nebula-violet/20 rounded-xl p-4 bg-nebula-violet/5">
          <h5 className="font-medium text-foreground mb-2">Enterprise</h5>
          <p className="text-nebula-violet text-lg font-bold">1-year retention</p>
          <p className="text-muted-foreground/70 text-xs">(customizable up to 7 years)</p>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <ListChecks className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Common Use Cases</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/90">
          <p>• Compliance audits (SOC 2, GDPR, HIPAA)</p>
          <p>• Security investigations</p>
          <p>• Debugging workflow issues</p>
          <p>• User activity monitoring</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Advanced Settings Content Component
function AdvancedSettingsContent() {
  const settings = [
    { icon: Settings, title: "General", items: ["Workspace name and icon", "Default timezone", "Date/time format", "Language", "Currency for deals"] },
    { icon: Mail, title: "Notifications", items: ["Email digest frequency", "Slack integration for alerts", "In-app notification preferences", "Mobile push notifications"] },
    { icon: Database, title: "Data Retention", items: ["Deleted items: 30 days in trash", "Completed workflows: 90 days of logs", "Archived contacts: Never deleted"] }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Advanced configuration options for customizing your workspace.
        </p>
      </div>

      {/* Settings Categories */}
      <div className="space-y-4">
        {settings.map((category, index) => {
          const CategoryIcon = category.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
                  <CategoryIcon className="h-5 w-5 text-nebula-teal" />
                </div>
                <h5 className="font-semibold text-foreground">{category.title}</h5>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 ml-1">
                {category.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground/80">
                    <CircleCheck className="h-3 w-3 text-nebula-teal flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Integrations */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Available Integrations</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Salesforce", "HubSpot", "Google Calendar", "Outlook", "Slack", "Teams", "QuickBooks", "Xero", "Shopify", "Stripe"].map((int, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-card/50 text-muted-foreground/80 text-sm border border-border/40">
              {int}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Compliance Content Component
function ComplianceContent() {
  const certifications = [
    { name: "SOC 2 Type II", status: "Certified", description: "Annual audit of security, availability, and confidentiality controls", icon: ShieldCheck },
    { name: "GDPR", status: "Compliant", description: "Full compliance with EU General Data Protection Regulation", icon: Shield },
    { name: "CCPA", status: "Compliant", description: "California Consumer Privacy Act requirements met", icon: Shield },
    { name: "ISO 27001", status: "In Progress", description: "Expected Q2 2026", icon: Clock }
  ];

  const gdprRights = ["Right to access: Export user data", "Right to erasure: Permanently delete user data", "Right to rectification: Update incorrect data", "Right to data portability: Download data in JSON format"];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          GalaxyCo.ai meets stringent compliance standards to protect your data.
        </p>
      </div>

      {/* Certifications */}
      <div className="grid sm:grid-cols-2 gap-4">
        {certifications.map((cert, index) => {
          const CertIcon = cert.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CertIcon className="h-5 w-5 text-nebula-teal" />
                  <h5 className="font-semibold text-foreground">{cert.name}</h5>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  cert.status === "Certified" || cert.status === "Compliant" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {cert.status}
                </span>
              </div>
              <p className="text-muted-foreground/70 text-sm">{cert.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* GDPR Features */}
      <div className="border border-nebula-teal/20 rounded-xl p-5 bg-nebula-teal/5">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-nebula-teal" />
          GDPR Data Subject Rights
        </h4>
        <div className="space-y-2">
          {gdprRights.map((right, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
              <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0" />
              <span>{right}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Residency */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="h-5 w-5 text-nebula-violet" />
          <h4 className="font-semibold text-foreground">Data Residency (Enterprise)</h4>
        </div>
        <p className="text-sm text-muted-foreground/90 mb-3">Choose where your data is stored:</p>
        <div className="flex flex-wrap gap-2">
          {["US (Virginia)", "EU (Frankfurt)", "UK (London)", "Canada (Montreal)", "Australia (Sydney)"].map((region, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-nebula-violet/10 text-nebula-violet text-sm border border-nebula-violet/20">
              {region}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== AI AGENTS SECTION COMPONENTS ====================

// Enhanced Platform Overview Content Component
function PlatformOverviewContent() {
  const capabilities = [
    { icon: Users, text: "CRM operations (contacts, deals, activities)" },
    { icon: Workflow, text: "Workflow creation and execution" },
    { icon: BookOpen, text: "Knowledge base management" },
    { icon: Bot, text: "Neptune AI orchestration" },
    { icon: Webhook, text: "Real-time webhook events" },
    { icon: Shield, text: "Team and permission management" }
  ];

  const operations = [
    "CRUD on all resources",
    "Complex queries with filtering, sorting, pagination",
    "Bulk operations (max 100 items)",
    "File uploads (max 25MB)",
    "Transactional workflows",
    "Async job processing"
  ];

  const limits = [
    { plan: "Starter", limit: "1K req/hr" },
    { plan: "Professional", limit: "5K req/hr" },
    { plan: "Enterprise", limit: "20K req/hr" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Machine-readable specifications for AI agents integrating with GalaxyCo.ai.
        </p>
      </div>

      {/* Core Functions */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-nebula-teal" />
          Core Functions
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {capabilities.map((cap, index) => {
            const CapIcon = cap.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                <CapIcon className="h-4 w-4 text-nebula-teal flex-shrink-0" />
                <span>{cap.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supported Operations */}
      <div className="border border-border/40 rounded-xl p-5">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-nebula-violet" />
          Supported Operations
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {operations.map((op, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground/90">
              <CircleCheck className="h-4 w-4 text-nebula-teal flex-shrink-0" />
              <span>{op}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "API Style", value: "RESTful + JSON" },
          { label: "Base URL", value: "/api" },
          { label: "Auth", value: "Bearer token" },
          { label: "Pagination", value: "Cursor-based" }
        ].map((item, index) => (
          <div key={index} className="border border-border/40 rounded-lg p-3 text-center bg-card/30">
            <p className="text-muted-foreground/70 text-xs uppercase tracking-wider">{item.label}</p>
            <p className="text-foreground font-medium mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-4">Rate Limits by Plan</h4>
        <div className="flex gap-4 justify-center">
          {limits.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-muted-foreground/70 text-sm">{item.plan}</p>
              <p className="text-nebula-teal font-mono font-bold">{item.limit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Data Models Content Component
function DataModelsContent() {
  const schemas = [
    { name: "Contact", fields: ["id", "email (required)", "first_name", "last_name", "company", "score", "tags[]", "custom_fields{}"] },
    { name: "Deal", fields: ["id", "name (required)", "contact_id", "value", "currency", "stage", "probability", "status"] },
    { name: "Workflow", fields: ["id", "name (required)", "trigger{}", "conditions[]", "actions[]", "active", "created_at"] },
    { name: "Agent", fields: ["id", "name", "type", "ai_provider", "model", "instructions", "inputs[]", "outputs[]"] }
  ];

  const relationships = [
    { from: "Contact", to: "Deals", type: "one-to-many" },
    { from: "Contact", to: "Activities", type: "one-to-many" },
    { from: "Deal", to: "Contact", type: "many-to-one" },
    { from: "Workflow", to: "Actions", type: "one-to-many" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Comprehensive data schemas for all platform entities.
        </p>
      </div>

      {/* Schemas */}
      <div className="space-y-4">
        {schemas.map((schema, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className="border border-border/40 rounded-xl p-4 bg-nebula-dark/20">
            <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-nebula-teal" />
              {schema.name}
            </h5>
            <div className="flex flex-wrap gap-2">
              {schema.fields.map((field, i) => (
                <code key={i} className="px-2 py-1 rounded bg-nebula-dark/40 text-nebula-frost/80 text-xs font-mono">
                  {field}
                </code>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Relationships */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-nebula-violet" />
          Relationships
        </h4>
        <div className="space-y-2">
          {relationships.map((rel, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="text-nebula-teal font-medium">{rel.from}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-nebula-violet font-medium">{rel.to}</span>
              <span className="text-muted-foreground/60 text-xs">({rel.type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Types */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-3">Data Types</h4>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p><span className="text-nebula-teal">Timestamps:</span> ISO 8601 UTC</p>
          <p><span className="text-nebula-teal">IDs:</span> Prefixed strings (cnt_, wf_, doc_)</p>
          <p><span className="text-nebula-teal">Currency:</span> ISO 4217 codes</p>
          <p><span className="text-nebula-teal">Enums:</span> Predefined string values</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Use Case Taxonomy Content Component
function UseCaseTaxonomyContent() {
  const useCases = [
    { category: "Lead Management", icon: Users, items: ["Auto-enrich contacts from email/company domain", "Score leads based on fit criteria", "Route leads to appropriate sales rep", "De-duplicate and merge contacts"] },
    { category: "Deal Management", icon: Target, items: ["Track deal progression through pipeline", "Predict deal close probability", "Alert on stalled deals", "Generate deal summaries"] },
    { category: "Activity Tracking", icon: Activity, items: ["Log emails, calls, meetings", "Extract action items from transcripts", "Suggest next best actions", "Generate activity summaries"] }
  ];

  const patterns = [
    { name: "Event-Driven", trigger: "Webhook or platform event", useCase: "Real-time response required" },
    { name: "Scheduled", trigger: "Time-based (cron)", useCase: "Batch processing acceptable" },
    { name: "Request-Response", trigger: "Explicit API call", useCase: "On-demand execution needed" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Categorized use cases with recommended implementation patterns for AI agents.
        </p>
      </div>

      {/* Use Cases */}
      <div className="space-y-4">
        {useCases.map((useCase, index) => {
          const UseCaseIcon = useCase.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-nebula-teal/20 flex items-center justify-center">
                  <UseCaseIcon className="h-5 w-5 text-nebula-teal" />
                </div>
                <h5 className="font-semibold text-foreground">{useCase.category}</h5>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {useCase.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground/90">
                    <CircleCheck className="h-3 w-3 text-nebula-teal flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Automation Patterns */}
      <div className="border border-nebula-violet/20 rounded-xl p-5 bg-nebula-violet/5">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Workflow className="h-5 w-5 text-nebula-violet" />
          Automation Patterns
        </h4>
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <div key={index} className="flex gap-4 items-center">
              <span className="text-nebula-violet font-medium w-32">{pattern.name}</span>
              <span className="text-muted-foreground/70 text-sm flex-1">{pattern.trigger}</span>
              <span className="text-muted-foreground/90 text-sm">{pattern.useCase}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best Practices & Anti-Patterns */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-nebula-teal/20 rounded-xl p-4 bg-nebula-teal/5">
          <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-nebula-teal" />
            Best Practices
          </h5>
          <div className="space-y-1 text-sm text-muted-foreground/80">
            <p>• Use idempotency keys for writes</p>
            <p>• Implement exponential backoff</p>
            <p>• Cache frequently accessed data</p>
            <p>• Batch operations when possible</p>
          </div>
        </div>
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
          <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <CircleX className="h-4 w-4 text-red-400" />
            Anti-Patterns
          </h5>
          <div className="space-y-1 text-sm text-muted-foreground/80">
            <p>• Polling instead of webhooks</p>
            <p>• Individual API calls instead of bulk</p>
            <p>• Ignoring error codes</p>
            <p>• Hard-coding IDs or assumptions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced API Specifications Content Component
function APISpecificationsContent() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Machine-readable specifications for automated tooling and code generation.
        </p>
      </div>

      {/* OpenAPI */}
      <div className="border border-nebula-teal/20 rounded-xl p-5 bg-nebula-teal/5">
        <div className="flex items-center gap-3 mb-4">
          <FileCode className="h-6 w-6 text-nebula-teal" />
          <div>
            <h4 className="font-semibold text-foreground">OpenAPI 3.1 Specification</h4>
            <p className="text-muted-foreground/70 text-sm">Full API spec with schemas and examples</p>
          </div>
        </div>
        <code className="text-nebula-frost text-sm font-mono bg-nebula-dark/40 p-3 rounded-lg block">
          /api/openapi
        </code>
      </div>

      {/* Resources */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-border/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4 text-nebula-violet" />
            <h5 className="font-medium text-foreground">Interactive Docs</h5>
          </div>
          <a href="/docs/api" className="text-nebula-teal text-sm hover:underline">/docs/api</a>
          <p className="text-muted-foreground/70 text-xs mt-2">Swagger UI with live testing</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-nebula-violet" />
            <h5 className="font-medium text-foreground">Postman Collection</h5>
          </div>
          <code className="text-nebula-teal text-sm">/api/openapi</code>
          <p className="text-muted-foreground/70 text-xs mt-2">Pre-configured collection</p>
        </div>
      </div>

      {/* Code Generation */}
      <div className="border border-border/40 rounded-xl p-5 bg-card/50">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-nebula-teal" />
          Code Generation
        </h4>
        <div className="space-y-3">
          <div className="bg-nebula-dark/40 rounded-lg p-3">
            <p className="text-muted-foreground/70 text-xs mb-1">JavaScript/TypeScript</p>
            <code className="text-nebula-frost text-xs font-mono">npx openapi-generator-cli generate -i .../openapi.json -g typescript-fetch -o ./client</code>
          </div>
          <div className="bg-nebula-dark/40 rounded-lg p-3">
            <p className="text-muted-foreground/70 text-xs mb-1">Python</p>
            <code className="text-nebula-frost text-xs font-mono">openapi-generator generate -i .../openapi.json -g python -o ./client</code>
          </div>
        </div>
      </div>

      {/* Supported Generators */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-3">Supported Generators</h4>
        <div className="flex flex-wrap gap-2">
          {["JavaScript", "TypeScript", "Python", "Go", "Ruby", "Java", "C#", "PHP"].map((lang, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-nebula-violet/10 text-nebula-violet text-sm border border-nebula-violet/20">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Integration Patterns Content Component
function IntegrationPatternsContent() {
  const patterns = [
    { name: "Event-Driven", icon: Zap, flow: "GalaxyCo → Webhook → Your Service → Process → API Call Back", best: "Real-time reactions", latency: "<1s" },
    { name: "Request-Response", icon: ArrowRight, flow: "Your Service → API Call → GalaxyCo → Response → Process", best: "On-demand queries", latency: "<500ms" },
    { name: "Batch Processing", icon: Layers, flow: "Schedule → Fetch Data → Process Bulk → Bulk Update", best: "Periodic updates", latency: "Minutes" },
    { name: "Real-Time Sync", icon: RefreshCw, flow: "System A ↔ Webhooks + API ↔ System B", best: "Bidirectional sync", latency: "<5s" }
  ];

  const reliabilityPatterns = [
    { icon: Timer, text: "Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s" },
    { icon: Pause, text: "Circuit breaker: Stop after N failures" },
    { icon: Key, text: "Idempotency: Use Idempotency-Key header" },
    { icon: Database, text: "Dead letter queue: Store failed events" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Reference architectures for common integration patterns.
        </p>
      </div>

      {/* Patterns */}
      <div className="space-y-4">
        {patterns.map((pattern, index) => {
          const PatternIcon = pattern.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="border border-border/40 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-nebula-teal/20 to-nebula-violet/20 flex items-center justify-center flex-shrink-0">
                  <PatternIcon className="h-6 w-6 text-nebula-teal" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-semibold text-foreground">{pattern.name}</h5>
                    <span className="px-2 py-0.5 rounded bg-nebula-teal/10 text-nebula-teal text-xs">{pattern.latency}</span>
                  </div>
                  <p className="text-muted-foreground/70 text-sm mb-2">Best for: {pattern.best}</p>
                  <code className="text-nebula-frost/60 text-xs font-mono">{pattern.flow}</code>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reliability Patterns */}
      <div className="border border-nebula-violet/20 rounded-xl p-5 bg-nebula-violet/5">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-nebula-violet" />
          Reliability Patterns
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {reliabilityPatterns.map((pattern, index) => {
            const PatternIcon = pattern.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground/90">
                <PatternIcon className="h-4 w-4 text-nebula-violet flex-shrink-0" />
                <span>{pattern.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhanced Performance Benchmarks Content Component
function PerformanceBenchmarksContent() {
  const responseTimes = [
    { operation: "GET /contacts/{id}", time: "50ms", type: "Read" },
    { operation: "GET /contacts (list)", time: "150ms", type: "Read" },
    { operation: "POST /contacts", time: "120ms", type: "Write" },
    { operation: "Search queries", time: "200ms", type: "Read" },
    { operation: "Simple workflow", time: "300ms", type: "Execute" },
    { operation: "Complex workflow", time: "2s", type: "Execute" }
  ];

  const optimizations = [
    { title: "Reduce Latency", items: ["Use field selection (?fields=id,name,email)", "Enable HTTP/2 for connection reuse", "Cache frequently accessed data"] },
    { title: "Increase Throughput", items: ["Use bulk endpoints instead of loops", "Parallelize independent requests", "Use webhooks instead of polling"] }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Performance characteristics and optimization guidelines.
        </p>
      </div>

      {/* Response Times */}
      <div className="border border-border/40 rounded-xl overflow-hidden">
        <div className="bg-nebula-dark/20 px-4 py-3 border-b border-border/30">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Gauge className="h-5 w-5 text-nebula-teal" />
            API Response Times (P95)
          </h4>
        </div>
        <div className="divide-y divide-border/30">
          {responseTimes.map((item, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.type === "Read" ? "bg-emerald-500/20 text-emerald-400" :
                item.type === "Write" ? "bg-blue-500/20 text-blue-400" :
                "bg-amber-500/20 text-amber-400"
              }`}>{item.type}</span>
              <code className="text-muted-foreground/80 text-sm font-mono flex-1">{item.operation}</code>
              <span className="text-nebula-teal font-medium">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optimizations */}
      <div className="grid sm:grid-cols-2 gap-4">
        {optimizations.map((opt, index) => (
          <div key={index} className="border border-border/40 rounded-xl p-4">
            <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-nebula-violet" />
              {opt.title}
            </h5>
            <div className="space-y-2">
              {opt.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground/80">
                  <CircleCheck className="h-3 w-3 text-nebula-teal flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monitoring */}
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-nebula-teal" />
          Key Metrics to Track
        </h4>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/90">
          <p>• API response time (P50, P95, P99)</p>
          <p>• Error rate by endpoint</p>
          <p>• Rate limit utilization</p>
          <p>• Workflow execution time</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Limitations Content Component
function LimitationsContent() {
  const limits = [
    { category: "API Limits", items: ["Rate limits enforced per plan (1K-20K req/hr)", "Max payload size: 10MB", "Bulk operations: max 100 items", "API timeout: 30 seconds"] },
    { category: "Data Constraints", items: ["String fields: max 10,000 characters", "Arrays: max 1,000 items per field", "Custom fields: max 50 per entity type", "Tags: max 100 per contact/deal"] },
    { category: "Search Limitations", items: ["Full-text search limited to 100K documents", "Search results max 1,000 items", "No fuzzy matching (exact or prefix only)", "Indexes updated every 5 minutes"] },
    { category: "Workflow Limitations", items: ["Max 50 actions per workflow", "No loops or recursion", "Execution timeout: 5 minutes", "Cannot call external webhooks directly"] }
  ];

  const workarounds = [
    { issue: "Large Payloads", solution: "Split into multiple requests or use file upload" },
    { issue: "Complex Workflows", solution: "Chain multiple workflows via webhooks" },
    { issue: "Rate Limits", solution: "Implement queuing system in your application" },
    { issue: "Timeouts", solution: "Use async pattern: POST to create job, GET to poll status" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-nebula-teal/10 to-nebula-violet/10 border border-nebula-teal/20 rounded-xl p-5">
        <p className="text-base text-foreground/90 leading-relaxed">
          Known limitations and constraints to design around.
        </p>
      </div>

      {/* Limits by Category */}
      <div className="grid sm:grid-cols-2 gap-4">
        {limits.map((limit, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className="border border-border/40 rounded-xl p-4">
            <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              {limit.category}
            </h5>
            <div className="space-y-1">
              {limit.items.map((item, i) => (
                <p key={i} className="text-sm text-muted-foreground/80 flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  {item}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Workarounds */}
      <div className="border border-nebula-teal/20 rounded-xl p-5 bg-nebula-teal/5">
        <h4 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-nebula-teal" />
          Workarounds
        </h4>
        <div className="space-y-3">
          {workarounds.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <span className="text-amber-400 font-medium text-sm w-28 flex-shrink-0">{item.issue}</span>
              <span className="text-muted-foreground/80 text-sm">{item.solution}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Improvements */}
      <div className="bg-gradient-to-r from-nebula-violet/10 to-nebula-teal/10 border border-nebula-violet/20 rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-nebula-violet" />
          Upcoming Improvements
        </h4>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/90">
          <p>• GraphQL API (Q1 2026)</p>
          <p>• Increased rate limits for all plans (Q2 2026)</p>
          <p>• Workflow debugging tools (Q2 2026)</p>
          <p>• Real-time search (Q3 2026)</p>
        </div>
      </div>
    </div>
  );
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lastUpdated: string;
  status?: "stable" | "beta" | "new";
  topics?: string[];
  details?: string;
}

const userTypeConfig: Record<UserType, { label: string; icon: React.ElementType; description: string }> = {
  "end-users": { 
    label: "End Users", 
    icon: User, 
    description: "Guides for everyday platform usage" 
  },
  "developers": { 
    label: "Developers", 
    icon: Code2, 
    description: "API docs, SDKs, and integrations" 
  },
  "admins": { 
    label: "Admins", 
    icon: Shield, 
    description: "Team management and security" 
  },
  "ai-agents": { 
    label: "AI Agents", 
    icon: Bot, 
    description: "Machine-readable specifications" 
  },
};

const docSections: Record<UserType, DocSection[]> = {
  "end-users": [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      description: "5-minute quickstart guide to using GalaxyCo.ai",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Welcome to GalaxyCo! Here's how to get started in under 5 minutes:\n\n**1. Create Your Account:** Sign up with email or use Google/Microsoft OAuth. You'll be prompted to create your first workspace.\n\n**2. Set Up Your Workspace:** Give your workspace a name (you can change this later). This is where all your agents, contacts, and workflows will live.\n\n**3. Explore the Dashboard:** After signup, you'll land on your dashboard where Neptune AI greets you. The sidebar on the left gives you access to all major features: CRM, Library, Marketing, and more.\n\n**4. Chat with Neptune:** Click on Neptune AI in the sidebar and ask it anything. Try: 'Show me what I can do' or 'Help me create my first contact.' Neptune understands natural language and can guide you through the platform.\n\n**5. Add Your First Contact:** Go to CRM → Leads and click 'Add Lead'. Fill in the basic info. Watch as Neptune automatically suggests next actions and scores the lead.\n\n**6. Try Quick Actions:** On the dashboard, you'll see quick action buttons like 'Help me create my first agent' and 'Upload a document'. These are shortcuts to common tasks.\n\n**Pro Tips:**\n• Use ⌘K (Mac) or Ctrl+K (Windows) to open the command palette from anywhere\n• Neptune learns from your usage - the more you interact, the smarter it gets\n• Check the 'Launchpad' section for guided tutorials\n• Invite team members from Settings → Team Management\n\nYou're now ready to start using GalaxyCo! Explore the other documentation sections to dive deeper into specific features.",
      topics: ["Account Setup", "Workspace Configuration", "First Agent", "Team Invitations", "Quick Tour"]
    },
    {
      id: "core-concepts",
      title: "Core Concepts",
      icon: BookOpen,
      description: "Understanding workflows, agents, and automation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "GalaxyCo is built around three core concepts that work together:\n\n**AI Agents:** Think of agents as specialized AI workers. Each agent has a specific job: scoring leads, drafting content, scheduling follow-ups, etc. Unlike chatbots that just answer questions, our agents take action on your behalf. When a new lead comes in, an agent can automatically research them, score their fit, and draft a personalized follow-up—all without you lifting a finger.\n\n**Workflows:** Workflows connect triggers, conditions, and actions into automated processes. For example: 'When a new contact is added (trigger) AND they're from Enterprise segment (condition), THEN assign to senior sales rep AND send welcome sequence (actions).' You can build workflows visually without code using our Creator studio, or let Neptune AI help you design them.\n\n**Neptune AI Orchestrator:** Neptune is the brain that coordinates everything. It sits above all your agents and workflows, understanding context across your entire workspace. When you ask Neptune 'What should I work on today?', it analyzes your CRM, active workflows, and pending tasks to give you prioritized recommendations. Neptune can also execute workflows, create new agents, and explain what's happening in your workspace.\n\n**How They Work Together:**\n1. You add a new lead to your CRM\n2. An AI agent automatically enriches and scores them\n3. A workflow triggers based on the score\n4. Actions execute: sending email, creating tasks, updating pipeline\n5. Neptune surfaces next steps to you\n\n**Data Models:** Everything in GalaxyCo has a consistent structure. Contacts, Deals, Documents, and Agents all have properties, relationships, and histories. This consistency means agents can work across different parts of your workspace intelligently.\n\n**Integrations:** Connect external tools (Google Calendar, QuickBooks, Shopify) to extend what agents can do. When integrated, agents can read/write data to these tools as part of workflows.",
      topics: ["AI Agents", "Workflows", "Triggers & Actions", "Data Models", "Integrations"]
    },
    {
      id: "neptune-ai",
      title: "Neptune AI Assistant",
      icon: Bot,
      description: "How to interact with and train your AI assistant",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Neptune is your AI business assistant that understands your workspace and takes action on your behalf.\n\n**What Neptune Can Do:**\n• Answer questions about your data ('How many hot leads do I have?')\n• Execute tasks ('Create a contact for John Smith at Acme Corp')\n• Surface insights ('Show me deals that haven't been touched in 7 days')\n• Draft content ('Write a follow-up email for this lead')\n• Explain decisions ('Why did you score this lead as Hot?')\n• Suggest next actions ('What should I prioritize today?')\n\n**How to Use Neptune:**\n\n**Natural Language:** Just type or speak naturally. Neptune understands context. Instead of clicking through menus, ask: 'Add a follow-up task for next Tuesday' or 'Show me my pipeline.'\n\n**Tool Execution:** Neptune has access to tools across your workspace. When you ask it to create a contact or schedule a workflow, it actually executes those actions. You'll see confirmations of what it did.\n\n**Context Awareness:** Neptune remembers your conversation history and understands your workspace data. If you say 'Send them a follow-up,' it knows who 'them' refers to based on your conversation.\n\n**Training Neptune:**\n\n**Upload Documents:** In Library → Knowledge Base, upload your company docs, playbooks, or FAQs. Neptune will learn from these and use them to answer questions specific to your business.\n\n**Provide Feedback:** Use the thumbs up/down on Neptune's responses. This teaches it what good answers look like for your use case.\n\n**Set Context:** Tell Neptune about your business: 'We're a B2B SaaS company selling to mid-market HR teams.' It will use this context in all future interactions.\n\n**Pro Tips:**\n• Neptune works best with specific questions\n• You can always undo or modify what Neptune does\n• Use the 'Explain' button to understand Neptune's reasoning\n• Neptune can be accessed from anywhere with the command palette (⌘K)",
      topics: ["Chat Interface", "Training Neptune", "Custom Instructions", "Knowledge Sources", "Response Tuning"]
    },
    {
      id: "workflows",
      title: "Building Workflows",
      icon: Zap,
      description: "Create and manage automated workflows",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Workflows automate repetitive tasks so you can focus on high-value work.\n\n**Anatomy of a Workflow:**\n\n**Trigger:** What starts the workflow. Examples: new contact added, deal stage changed, time-based (every Monday at 9am), webhook received.\n\n**Conditions:** Rules that determine if the workflow continues. Example: 'IF lead score > 80 AND industry = SaaS'\n\n**Actions:** What happens when conditions are met. Examples: send email, create task, update CRM field, call external API, run AI agent.\n\n**Building Your First Workflow:**\n\n1. Go to Orchestration → Workflows → New Workflow\n2. Choose a trigger (start simple with 'New Contact Created')\n3. Add a condition (optional but recommended)\n4. Add actions - drag and drop from the right panel\n5. Configure each action's settings\n6. Test with sample data\n7. Activate when ready\n\n**Common Workflow Examples:**\n\n**Lead Routing:** When new lead created → IF score > 70 → Assign to senior rep, ELSE assign to junior rep → Send Slack notification\n\n**Follow-Up Automation:** When deal sits in stage for 7 days → Create follow-up task → Send reminder email → Alert manager\n\n**Content Approval:** When document uploaded → Request approval from manager → IF approved → Publish to knowledge base, ELSE notify author\n\n**Best Practices:**\n• Start with one workflow at a time\n• Test thoroughly before activating\n• Use clear naming conventions\n• Add error handling (what if API call fails?)\n• Monitor workflow execution logs\n• Don't over-automate - keep human oversight where needed\n\n**Templates:** We provide pre-built templates for common workflows. Browse templates in the workflow builder to get started faster.\n\n**Testing:** Always test workflows with sample data before activating. Use the 'Test Run' button to simulate execution without actually making changes.",
      topics: ["Visual Builder", "Triggers", "Actions", "Conditions", "Templates", "Testing"]
    },
    {
      id: "crm-basics",
      title: "CRM Essentials",
      icon: Users,
      description: "Managing contacts, deals, and pipelines",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Our CRM is built to work with AI, not against it. Here's what you need to know:\n\n**Contacts & Leads:**\n\n**Adding Contacts:** Click 'Add Lead' and fill in basic info (name, email, company). Neptune AI automatically enriches the contact with additional data like company size, industry, and social profiles.\n\n**Import:** Bulk import from CSV or integrate with your existing tools. Go to CRM → Import to upload a file.\n\n**Organization:** Contacts can be tagged, segmented, and organized into lists. Use filters to create views like 'Enterprise Leads' or 'Customers in California.'\n\n**Deals & Pipeline:**\n\n**Creating Deals:** Every serious opportunity should be a deal. Add a deal from any contact record. Set the value, expected close date, and stage.\n\n**Pipeline Stages:** Default stages are: New → Qualified → Demo → Proposal → Negotiation → Closed Won/Lost. Customize these in CRM Settings.\n\n**Moving Deals:** Drag and drop deals between stages in the Kanban view. AI tracks how long deals sit in each stage and alerts you to stalled opportunities.\n\n**AI Scoring:**\n\nEvery lead gets an AI-generated score (Cold, Warm, Hot) based on:  \n• Company fit (size, industry, location)\n• Engagement signals (email opens, site visits, responses)\n• Historical patterns (similar deals that closed)\n• Timing indicators (budget cycle, hiring activity)\n\nYou can adjust the scoring model in CRM Settings → Lead Scoring to match your criteria.\n\n**Activities & Notes:**\n\nTrack all interactions: calls, emails, meetings, notes. Add an activity from any contact/deal page. AI can auto-transcribe calls and extract action items.\n\n**Next Actions:** Neptune suggests what to do next for each deal: 'Send follow-up', 'Schedule demo', 'Request decision maker intro.' These show up in your daily priorities.\n\n**Reporting:**\n\nBuilt-in reports show: pipeline health, conversion rates by stage, average deal size, sales velocity, lead source performance. Access from CRM → Insights.",
      topics: ["Contacts", "Deals & Pipelines", "Activities", "AI Scoring", "Reporting"]
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: CheckCircle2,
      description: "Tips and patterns for power users",
      lastUpdated: "2025-12-08",
      status: "stable",
      details: "**Data Hygiene:**\n• Keep contact data clean - merge duplicates weekly\n• Use consistent naming conventions for deals and companies\n• Archive old data rather than deleting (you might need it later)\n• Tag contacts liberally - tags make segmentation easier\n• Set up data validation rules to prevent junk data\n\n**Workflow Design:**\n• Start simple - one trigger, one action\n• Add complexity gradually as you learn what works\n• Always include error handling\n• Use clear, descriptive names for workflows\n• Document why workflows exist (future you will thank current you)\n• Review and prune unused workflows quarterly\n\n**Agent Training:**\n• Upload your best docs to the knowledge base first\n• Provide feedback on agent actions (thumbs up/down)\n• Be specific when correcting agents\n• Give agents time to learn - they get better with usage\n• Set clear boundaries (what agents CAN'T do)\n\n**Team Collaboration:**\n• Define roles clearly - who owns what\n• Use @ mentions in notes to notify team members\n• Set up team views in CRM for transparency\n• Have a single source of truth for important data\n• Regular team syncs on what's working/not working\n\n**Performance Tips:**\n• Use keyboard shortcuts (⌘K opens command palette)\n• Set up saved views for frequent filters\n• Batch similar tasks (all follow-ups at once)\n• Let AI handle repetitive work, you focus on decisions\n• Review your daily priorities from Neptune every morning\n\n**Security:**\n• Never share API keys publicly\n• Use role-based permissions for team members\n• Enable 2FA for all users\n• Review audit logs monthly\n• Set up IP allowlists for sensitive workspaces\n\n**Getting Unstuck:**\n• Ask Neptune for help first\n• Check the Troubleshooting docs\n• Use the feedback widget to report issues\n• Email support@galaxyco.ai - we respond within 24 hours",
      topics: ["Workflow Patterns", "Agent Training", "Team Collaboration", "Data Hygiene", "Performance Tips"]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: HelpCircle,
      description: "Common issues and solutions",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "**Common Issues:**\n\n**Q: Neptune isn't responding to my questions**\nA: Check your internet connection. Refresh the page. If it persists, try: Settings → Clear Cache. Neptune requires an active connection to our AI service.\n\n**Q: I can't see contacts I just imported**\nA: Imports process in background. Check CRM → Import History for status. Large imports (500+ contacts) can take 2-3 minutes. Refresh the page after the import completes.\n\n**Q: Workflows aren't triggering**\nA: Check three things: 1) Is the workflow active? (green toggle), 2) Do the trigger conditions match? (test with sample data), 3) Check workflow logs for errors (Orchestration → Logs).\n\n**Q: Lead scores seem wrong**\nA: Scoring improves as Neptune learns your patterns. Provide feedback on scores (thumbs up/down). Adjust scoring criteria in CRM Settings → Lead Scoring. New workspaces need ~50 contacts before scores stabilize.\n\n**Q: Can't upload documents to knowledge base**\nA: Supported formats: PDF, DOC, DOCX, TXT, MD. Max file size: 25MB. Check that file isn't password-protected. Clear browser cache if upload hangs.\n\n**Q: Integration isn't syncing**\nA: Go to Settings → Integrations → [Your Integration] → Test Connection. If it fails, you may need to re-authorize. Some integrations have rate limits - check status.\n\n**Q: Slow performance**\nA: Clear browser cache. Try a different browser (Chrome recommended). Check your internet speed. If workspace is >10,000 contacts, performance may vary - contact support for optimization.\n\n**Q: Lost data or made a mistake**\nA: Most actions can be undone immediately. For data recovery, contact support@galaxyco.ai with details. We keep backups for 30 days.\n\n**Q: How do I delete my account?**\nA: Settings → Account → Delete Account. This is permanent and deletes all data. Export your data first if you want to keep it.\n\n**Still Stuck?**\nEmail support@galaxyco.ai with: 1) What you were trying to do, 2) What happened instead, 3) Screenshots if possible, 4) Your browser/OS. We respond within 24 hours.",
      topics: ["Common Errors", "Connection Issues", "Sync Problems", "Performance", "FAQ"]
    }
  ],
  "developers": [
    {
      id: "api-overview",
      title: "API Overview",
      icon: Code2,
      description: "REST API architecture and capabilities",
      lastUpdated: "2025-12-14",
      status: "new",
      details: "GalaxyCo.ai provides a comprehensive REST API for building integrations, automating workflows, and extending platform capabilities.\n\n**Base URL:**\n```\n/api\n```\n\n**Architecture Principles:**\n\n**RESTful Design:** Standard HTTP methods (GET, POST, PUT, PATCH, DELETE). Predictable resource URLs like `/contacts/{id}` or `/workflows/{id}/execute`.\n\n**JSON Everywhere:** All requests accept JSON payloads. All responses return JSON. Content-Type: application/json is required.\n\n**Idempotency:** PUT and DELETE operations are idempotent. POST operations return idempotency keys to prevent duplicate actions.\n\n**Versioning:**\n\nAPI version is specified in the URL path (`/v1/`, `/v2/`, etc.). Current version: v1. We maintain backward compatibility for at least 12 months after a new version is released.\n\n**Response Format:**\n\nSuccess responses (200-299) return the requested resource or confirmation:\n```json\n{\"data\": {...}, \"meta\": {\"timestamp\": \"2025-12-14T10:00:00Z\"}}\n```\n\nError responses (400-599) include error details:\n```json\n{\"error\": {\"code\": \"invalid_request\", \"message\": \"Missing required field: email\"}}\n```\n\n**Pagination:**\n\nList endpoints support cursor-based pagination:\n- `?limit=50` - Number of results (max 100, default 25)\n- `?cursor=abc123` - Pagination cursor from previous response\n\nResponses include pagination metadata with `next_cursor`.\n\n**Common Capabilities:**\n\n- Full CRUD on Contacts, Deals, Workflows, Documents\n- Execute workflows programmatically\n- Query Neptune AI assistant\n- Subscribe to webhooks for real-time events\n- Upload/download files\n- Manage team members and permissions\n\n**Getting Started:** Generate an API key in Settings → Developers → API Keys. Include it in all requests via `Authorization: Bearer YOUR_KEY` header.",
      topics: ["REST Architecture", "Base URLs", "Versioning", "Response Formats", "Pagination"]
    },
    {
      id: "authentication",
      title: "Authentication",
      icon: Key,
      description: "API keys, OAuth, and security",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "GalaxyCo.ai supports two authentication methods: API Keys for server-to-server integrations and OAuth 2.0 for user-authorized applications.\n\n**API Keys (Recommended for Server-to-Server):**\n\n**Generating Keys:** Go to Settings → Developers → API Keys → Create Key. Name your key (e.g., 'Production Server') and select scopes.\n\n**Using Keys:** Include in Authorization header:\n```\nAuthorization: Bearer gco_live_abc123xyz789\n```\n\n**Key Prefixes:**\n- `gco_live_` - Production keys\n- `gco_test_` - Test/sandbox keys\n\n**Security:** Never commit keys to version control. Rotate keys every 90 days. Delete unused keys immediately.\n\n**OAuth 2.0 (For User-Authorized Apps):**\n\n**Flow:** Standard Authorization Code flow with PKCE for security.\n\n**Setup:**\n1. Register your app in Settings → Developers → OAuth Apps\n2. Get client_id and client_secret\n3. Set redirect_uri (must be HTTPS in production)\n\n**Authorization URL:**\n```\nhttps://app.galaxyco.ai/oauth/authorize?\n  client_id=YOUR_CLIENT_ID\n  &redirect_uri=YOUR_REDIRECT\n  &response_type=code\n  &scope=contacts:read contacts:write\n```\n\n**Token Exchange:** After user approves, exchange auth code for access token:\n```\nPOST https://api.galaxyco.ai/v1/oauth/token\n{\"code\": \"AUTH_CODE\", \"client_id\": \"...\", \"client_secret\": \"...\"}\n```\n\n**Access Tokens:** Valid for 1 hour. Use refresh tokens to get new access tokens without re-prompting users.\n\n**Scopes:**\n- `contacts:read` - Read contacts/deals\n- `contacts:write` - Create/update contacts\n- `workflows:read` - View workflows\n- `workflows:execute` - Run workflows\n- `knowledge:read` - Access knowledge base\n- `admin:all` - Full admin access (use sparingly)\n\n**Best Practices:**\n- Request minimum scopes needed\n- Store tokens encrypted\n- Implement token refresh logic\n- Handle 401 errors by refreshing token",
      topics: ["API Keys", "OAuth 2.0", "Scopes", "Token Management", "Security"]
    },
    {
      id: "api-reference",
      title: "API Reference",
      icon: Database,
      description: "Complete endpoint documentation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Comprehensive API endpoint documentation organized by resource type.\n\n**Contacts API:**\n```\nGET    /v1/contacts          List contacts\nPOST   /v1/contacts          Create contact\nGET    /v1/contacts/{id}     Get contact\nPATCH  /v1/contacts/{id}     Update contact\nDELETE /v1/contacts/{id}     Delete contact\nGET    /v1/contacts/{id}/activities  Get activity history\n```\n\n**Example - Create Contact:**\n```json\nPOST /v1/contacts\n{\n  \"email\": \"john@acme.com\",\n  \"first_name\": \"John\",\n  \"last_name\": \"Smith\",\n  \"company\": \"Acme Corp\",\n  \"tags\": [\"enterprise\", \"hot-lead\"]\n}\n```\n\n**Workflows API:**\n```\nGET    /v1/workflows                List workflows\nPOST   /v1/workflows                Create workflow\nGET    /v1/workflows/{id}           Get workflow details\nPATCH  /v1/workflows/{id}           Update workflow\nDELETE /v1/workflows/{id}           Delete workflow\nPOST   /v1/workflows/{id}/execute   Trigger workflow\nGET    /v1/workflows/{id}/runs      Get execution history\n```\n\n**Neptune AI API:**\n```\nPOST   /v1/neptune/chat       Send message to Neptune\nGET    /v1/neptune/context    Get workspace context\nPOST   /v1/neptune/execute    Execute Neptune command\n```\n\n**Knowledge Base API:**\n```\nGET    /v1/knowledge/documents       List documents\nPOST   /v1/knowledge/documents       Upload document\nGET    /v1/knowledge/documents/{id}  Get document\nDELETE /v1/knowledge/documents/{id}  Delete document\nPOST   /v1/knowledge/search          Search knowledge base\n```\n\n**Webhooks API:**\n```\nGET    /v1/webhooks          List webhooks\nPOST   /v1/webhooks          Create webhook\nDELETE /v1/webhooks/{id}     Delete webhook\n```\n\n**Query Parameters:**\nMost list endpoints support filtering:\n- `?filter[status]=active` - Filter by field\n- `?sort=-created_at` - Sort (prefix with - for descending)\n- `?fields=id,name,email` - Return only specific fields\n\n**Full interactive API reference with live examples:** https://api.galaxyco.ai/docs",
      topics: ["Contacts API", "Workflows API", "Agents API", "Knowledge API", "Webhooks API"]
    },
    {
      id: "webhooks",
      title: "Webhooks & Events",
      icon: Webhook,
      description: "Real-time event notifications",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Webhooks deliver real-time event notifications to your server when things happen in GalaxyCo.ai.\n\n**Setting Up Webhooks:**\n\n1. Go to Settings → Developers → Webhooks\n2. Click Create Webhook\n3. Enter your endpoint URL (must be HTTPS)\n4. Select events to subscribe to\n5. Save and note the signing secret\n\n**Event Types:**\n\n**CRM Events:**\n- `contact.created` - New contact added\n- `contact.updated` - Contact modified\n- `contact.deleted` - Contact removed\n- `deal.stage_changed` - Deal moved to new stage\n- `deal.closed_won` - Deal marked as won\n\n**Workflow Events:**\n- `workflow.started` - Workflow execution began\n- `workflow.completed` - Workflow finished successfully\n- `workflow.failed` - Workflow encountered error\n\n**System Events:**\n- `user.invited` - Team member invited\n- `integration.connected` - New integration added\n\n**Webhook Payload Format:**\n```json\n{\n  \"event\": \"contact.created\",\n  \"timestamp\": \"2025-12-14T10:00:00Z\",\n  \"data\": {\n    \"id\": \"cnt_123\",\n    \"email\": \"john@acme.com\",\n    // ... full contact object\n  },\n  \"workspace_id\": \"ws_abc\"\n}\n```\n\n**Signature Verification:**\n\nEvery webhook includes `X-GalaxyCo-Signature` header. Verify it to ensure the request came from us:\n\n```javascript\nconst crypto = require('crypto');\nconst signature = request.headers['x-galaxyco-signature'];\nconst payload = JSON.stringify(request.body);\nconst expected = crypto\n  .createHmac('sha256', SIGNING_SECRET)\n  .update(payload)\n  .digest('hex');\nif (signature !== expected) throw new Error('Invalid signature');\n```\n\n**Retry Logic:**\nIf your endpoint returns non-2xx status or times out (>10s), we retry with exponential backoff: 1min, 5min, 30min, 2hr, 12hr. After 5 failures, webhook is disabled.\n\n**Best Practices:**\n- Return 200 immediately, process async\n- Implement idempotency (use event ID)\n- Store signing secret securely\n- Log all webhook receipts for debugging",
      topics: ["Event Types", "Webhook Setup", "Signature Verification", "Retry Logic", "Debugging"]
    },
    {
      id: "rate-limits",
      title: "Rate Limits",
      icon: BarChart3,
      description: "API quotas and best practices",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "API rate limits prevent abuse and ensure reliable service for all users.\n\n**Limits by Plan:**\n\n**Starter:** 1,000 requests/hour\n**Professional:** 5,000 requests/hour\n**Enterprise:** 20,000 requests/hour (customizable)\n\n**Limits by Endpoint Type:**\n\n**Read Operations (GET):** Standard rate limit\n**Write Operations (POST/PUT/PATCH):** 50% of standard limit\n**Delete Operations:** 25% of standard limit\n**Bulk Operations:** 10% of standard limit, max 100 items per request\n\n**Rate Limit Headers:**\n\nEvery API response includes rate limit info:\n```\nX-RateLimit-Limit: 5000\nX-RateLimit-Remaining: 4850\nX-RateLimit-Reset: 1702558800\n```\n\n**When You Hit the Limit:**\n\nYou'll receive a 429 Too Many Requests response:\n```json\n{\n  \"error\": {\n    \"code\": \"rate_limit_exceeded\",\n    \"message\": \"Rate limit exceeded. Retry after 120 seconds.\",\n    \"retry_after\": 120\n  }\n}\n```\n\n**Retry-After** header tells you when to retry.\n\n**Optimization Strategies:**\n\n**1. Use Bulk Endpoints:** Instead of creating 100 contacts individually, use bulk create endpoint:\n```\nPOST /v1/contacts/bulk\n{\"contacts\": [...]}\n```\n\n**2. Cache Responses:** Cache data that doesn't change frequently (team members, workflow definitions).\n\n**3. Use Webhooks:** Instead of polling for changes, subscribe to webhooks for real-time updates.\n\n**4. Implement Exponential Backoff:** When you hit a rate limit, wait progressively longer between retries: 1s, 2s, 4s, 8s, etc.\n\n**5. Batch Requests:** Group related operations together during off-peak hours.\n\n**6. Monitor Usage:** Track your rate limit headers to predict when you'll hit limits.\n\n**Need Higher Limits?** Enterprise plans support custom rate limits. Contact sales@galaxyco.ai to discuss your requirements.",
      topics: ["Limits by Endpoint", "Headers", "Retry Strategies", "Bulk Operations", "Optimization"]
    },
    {
      id: "sdks",
      title: "SDKs & Libraries",
      icon: Code2,
      description: "Official client libraries",
      lastUpdated: "2025-12-05",
      status: "beta",
      details: "Official SDKs make integrating with GalaxyCo.ai faster and easier. We handle authentication, retries, and error handling.\n\n**JavaScript/TypeScript SDK:**\n\n**Installation:**\n```bash\nnpm install @galaxyco/sdk\n```\n\n**Quick Start:**\n```typescript\nimport { GalaxyCo } from '@galaxyco/sdk';\n\nconst client = new GalaxyCo({\n  apiKey: process.env.GALAXYCO_API_KEY\n});\n\n// Create a contact\nconst contact = await client.contacts.create({\n  email: 'john@acme.com',\n  firstName: 'John',\n  lastName: 'Smith'\n});\n\n// Execute a workflow\nawait client.workflows.execute('wf_123', {\n  input: { leadId: contact.id }\n});\n```\n\n**Python SDK:**\n\n**Installation:**\n```bash\npip install galaxyco\n```\n\n**Quick Start:**\n```python\nfrom galaxyco import GalaxyCo\n\nclient = GalaxyCo(api_key=os.environ['GALAXYCO_API_KEY'])\n\n# Create a contact\ncontact = client.contacts.create(\n  email='john@acme.com',\n  first_name='John',\n  last_name='Smith'\n)\n\n# List workflows\nworkflows = client.workflows.list(status='active')\n```\n\n**Features:**\n- Automatic retry with exponential backoff\n- Built-in rate limit handling\n- Type-safe (TypeScript) / Type-hinted (Python)\n- Async/await support\n- Pagination helpers\n- Webhook signature verification\n- Comprehensive error types\n\n**Other Languages:**\n\n**Ruby:** `gem install galaxyco` (community-maintained)\n**Go:** `go get github.com/galaxyco/go-sdk` (coming soon)\n**.NET:** NuGet package in development\n\n**SDK Documentation:**\nFull SDK docs with examples: https://docs.galaxyco.ai/sdks\n\n**Contributing:** SDKs are open source! Contributions welcome at github.com/galaxyco",
      topics: ["JavaScript SDK", "Python SDK", "Installation", "Quick Start", "Examples"]
    },
    {
      id: "errors",
      title: "Error Handling",
      icon: AlertCircle,
      description: "Error codes and debugging",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Understand API errors and implement robust error handling.\n\n**Error Response Format:**\n```json\n{\n  \"error\": {\n    \"code\": \"invalid_request\",\n    \"message\": \"Missing required field: email\",\n    \"field\": \"email\",\n    \"request_id\": \"req_abc123\"\n  }\n}\n```\n\n**HTTP Status Codes:**\n\n**400 Bad Request:** Invalid request parameters. Check the error message for details.\n\n**401 Unauthorized:** Invalid or missing API key. Verify your Authorization header.\n\n**403 Forbidden:** Valid credentials but insufficient permissions. Check your API key scopes.\n\n**404 Not Found:** Resource doesn't exist. Verify the ID is correct.\n\n**409 Conflict:** Resource already exists or state conflict. Check if the resource was already created.\n\n**422 Unprocessable Entity:** Request is valid but business logic prevents action (e.g., can't delete contact with active deals).\n\n**429 Too Many Requests:** Rate limit exceeded. Check Retry-After header.\n\n**500 Internal Server Error:** Something went wrong on our end. Include request_id when contacting support.\n\n**503 Service Unavailable:** Temporary downtime, usually during maintenance. Retry with exponential backoff.\n\n**Common Error Codes:**\n\n**invalid_request:** Malformed request. Fix the syntax.\n\n**missing_field:** Required field not provided.\n\n**invalid_field:** Field value doesn't meet validation rules.\n\n**not_found:** Resource ID doesn't exist.\n\n**duplicate:** Resource already exists (e.g., contact with same email).\n\n**rate_limit_exceeded:** Too many requests.\n\n**invalid_credentials:** API key is invalid or expired.\n\n**insufficient_permissions:** Your API key lacks required scopes.\n\n**Error Handling Best Practices:**\n\n```typescript\ntry {\n  const contact = await client.contacts.create(data);\n} catch (error) {\n  if (error.code === 'duplicate') {\n    // Handle duplicate - maybe update instead?\n  } else if (error.status === 429) {\n    // Rate limited - wait and retry\n    await sleep(error.retryAfter * 1000);\n    return retry();\n  } else {\n    // Log error with request_id for support\n    logger.error('API error', { requestId: error.requestId });\n    throw error;\n  }\n}\n```\n\n**Debugging:** Every response includes `X-Request-ID` header. Include this when contacting support.",
      topics: ["Error Codes", "HTTP Status", "Error Objects", "Debugging Tips", "Common Errors"]
    },
    {
      id: "changelog",
      title: "Changelog",
      icon: Clock,
      description: "API version history",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Stay informed about API changes and plan your integration updates.\n\n**Current Version: v1**\n\n**2025-12-14 - v1.3.0 (Latest)**\n- Added Neptune AI chat endpoint (`POST /v1/neptune/chat`)\n- New bulk contact update endpoint\n- Improved rate limit headers with reset timestamp\n- Fixed: Workflow execution webhook payload format\n\n**2025-12-01 - v1.2.0**\n- Added knowledge base API endpoints\n- New webhook events for deal stage changes\n- OAuth 2.0 with PKCE support\n- Enhanced error responses with field-level details\n\n**2025-11-15 - v1.1.0**\n- Webhook signature verification (all webhooks now signed)\n- Pagination cursor improvements\n- Added `fields` query parameter for selective response fields\n- Beta: Bulk operations API\n\n**2025-11-01 - v1.0.0 (Initial Release)**\n- Core REST API launched\n- Contacts, Deals, Workflows, Webhooks APIs\n- API key authentication\n\n**Deprecations:**\n\n**2025-12-01:** `POST /v1/contacts/import` is deprecated in favor of `POST /v1/contacts/bulk`. Old endpoint will be removed in v2 (no earlier than 2026-12-01).\n\n**Migration Guide:** Replace import calls with bulk create. The payload format is identical.\n\n**Breaking Changes (v2 Preview):**\n\nv2 is planned for Q2 2026. Expected changes:\n- Cursor-based pagination required for all list endpoints (no more offset-based)\n- Webhook payload structure changes\n- Some field names standardized (e.g., `created_at` → `createdAt`)\n\nWe'll provide 12 months notice before v2 launch.\n\n**Subscribe to Updates:**\n\nGet notified of API changes: developers@galaxyco.ai\n\nOr watch our changelog: https://api.galaxyco.ai/changelog\n\n**Roadmap (Next 6 Months):**\n- GraphQL API (Q1 2026)\n- Advanced filtering & search\n- Real-time subscriptions via WebSockets\n- File upload API improvements\n- Expanded bulk operations",
      topics: ["Latest Changes", "Breaking Changes", "Deprecations", "Migration Guides", "Roadmap"]
    }
  ],
  "admins": [
    {
      id: "team-management",
      title: "Team Management",
      icon: Users,
      description: "Add, remove, and manage team members",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Manage your team effectively with comprehensive controls for adding, organizing, and managing members.\n\n**Inviting Team Members:**\n\nGo to Settings → Team → Invite Member. Enter email addresses (one per line for bulk invites). Select their role (Admin, Member, or Read-Only). They'll receive an email with a signup link valid for 7 days.\n\n**User Roles:**\n\n**Admin:** Full access including billing, team management, and workspace settings.\n**Member:** Can create/edit contacts, workflows, and documents. Cannot manage billing or invite users.\n**Read-Only:** View-only access to all data. Cannot make changes.\n\n**Organizing Teams:**\n\nCreate teams to group users by department or function (e.g., Sales, Marketing, Support). Teams can have shared access to specific contacts, deals, or workflows. Navigate to Settings → Teams → Create Team.\n\n**Managing Existing Members:**\n\n**Edit Roles:** Click on any team member → Change Role. This takes effect immediately.\n**Deactivate Users:** Instead of removing, deactivate users to preserve their data and activity history. Reactivate anytime.\n**Remove Users:** Permanently remove users from Settings → Team. Their data remains but is reassigned to workspace owner.\n\n**User Profiles:**\n\nEach user has a profile with: name, email, role, last active timestamp, and activity summary. View by clicking on any user in the team list.\n\n**Bulk Actions:**\n\nSelect multiple users to: change roles in bulk, add to teams, send announcements, or export user lists. Use checkboxes in the team list.\n\n**Seat Management:**\n\nYour plan includes a certain number of seats. Current usage shown in Settings → Team. Deactivated users don't count toward your seat limit. Need more seats? Upgrade your plan or contact us for custom pricing.\n\n**Best Practices:**\n• Use read-only access for contractors or external stakeholders\n• Create teams that mirror your org structure\n• Regular audit of active users (quarterly)\n• Use descriptive team names\n• Assign team leads who can manage their team's access",
      topics: ["Invite Users", "Remove Members", "Teams & Groups", "User Profiles", "Bulk Actions"]
    },
    {
      id: "permissions",
      title: "Permissions & Roles",
      icon: Shield,
      description: "Role-based access control",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Control exactly what team members can do with granular role-based permissions.\n\n**Built-in Roles:**\n\n**Workspace Admin:** Full control over everything including billing, team, settings, and all data.\n**Team Admin:** Manage team members and their permissions. Cannot access billing or workspace settings.\n**Member:** Standard access - create/edit contacts, deals, workflows. Cannot manage team or settings.\n**Read-Only:** View all data but cannot make changes. Perfect for stakeholders or auditors.\n\n**Permission Matrix:**\n\nPermissions are organized by resource type:\n\n**Contacts & Deals:**\n- View: See contact/deal data\n- Create: Add new contacts/deals\n- Edit: Modify existing records\n- Delete: Remove records\n- Export: Download data\n\n**Workflows & Agents:**\n- View: See workflow definitions\n- Execute: Trigger workflows\n- Edit: Modify workflow logic\n- Create: Build new workflows\n- Delete: Remove workflows\n\n**Knowledge Base:**\n- Read: Access documents\n- Upload: Add documents\n- Edit: Modify documents\n- Delete: Remove documents\n\n**Settings:**\n- View: See workspace settings\n- Edit: Modify settings\n- Billing: Manage subscriptions\n- Team: Invite/remove users\n- Integrations: Connect external tools\n\n**Custom Roles (Professional & Enterprise):**\n\nCreate custom roles tailored to your needs. Go to Settings → Roles → Create Custom Role.\n\nExample custom roles:\n• 'Sales Rep' - Full CRM access, limited workflow edit\n• 'Marketing Manager' - Workflow creation, read-only CRM\n• 'Support Agent' - Contact view/edit, no delete\n\n**Resource-Level Permissions:**\n\nFine-tune access at the resource level. Set permissions on specific workflows, contact lists, or documents. Navigate to the resource → Share → Manage Access.\n\n**Permission Inheritance:**\n\nTeam permissions inherit to all members. If a team has 'Edit' access to a workflow, all team members get that access. Individual user permissions override team permissions.",
      topics: ["Built-in Roles", "Custom Roles", "Permission Matrix", "Resource Access", "Inheritance"]
    },
    {
      id: "security",
      title: "Security Configuration",
      icon: Key,
      description: "SSO, 2FA, and security policies",
      lastUpdated: "2025-12-10",
      status: "beta",
      details: "Secure your workspace with enterprise-grade security controls.\n\n**Single Sign-On (SSO):**\n\nAvailable on Enterprise plans. Supports SAML 2.0 and OAuth 2.0 providers:\n• Okta\n• Azure AD / Microsoft Entra\n• Google Workspace\n• OneLogin\n• Custom SAML providers\n\n**Setup:** Settings → Security → SSO. Follow the provider-specific guide. Test with a pilot user before enforcing for all users.\n\n**Two-Factor Authentication (2FA):**\n\nAdd extra layer of security. Supports:\n• Authenticator apps (Google Authenticator, Authy)\n• SMS codes\n• Hardware keys (YubiKey)\n\n**User 2FA:** Each user enables 2FA in their profile settings.\n**Admin Enforcement:** Settings → Security → Require 2FA. Set grace period (7, 14, or 30 days) for users to enable.\n\n**Session Management:**\n\n**Session Timeout:** Set how long users stay logged in (1 hour to 30 days). Default: 7 days.\n**Concurrent Sessions:** Limit how many devices a user can be logged in on simultaneously. Default: 5.\n**Force Logout:** Immediately log out all users (useful if credentials compromised).\n\nConfigure in Settings → Security → Sessions.\n\n**IP Allowlisting:**\n\nRestrict access to specific IP addresses or ranges. Enable in Settings → Security → IP Allowlist. Add IPs in CIDR notation (e.g., 203.0.113.0/24). Users outside allowlist are blocked.\n\n**Password Policies:**\n\nEnforce strong passwords:\n• Minimum length (8-32 characters)\n• Require uppercase, lowercase, numbers, symbols\n• Password expiration (30, 60, 90 days, or never)\n• Prevent reuse of last N passwords\n• Block common passwords\n\nSettings → Security → Password Policy.\n\n**Additional Security:**\n• Audit logs track all security events\n• Failed login alerts\n• API key rotation reminders\n• Data encryption at rest and in transit (AES-256)",
      topics: ["SSO Setup", "2FA Enforcement", "Session Management", "IP Allowlists", "Password Policies"]
    },
    {
      id: "billing",
      title: "Billing & Usage",
      icon: BarChart3,
      description: "Monitor usage and manage subscriptions",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Manage your subscription, track usage, and control costs.\n\n**Usage Dashboard:**\n\nSettings → Billing → Usage shows real-time metrics:\n• Active users / seat limit\n• API requests (current month)\n• Storage used / limit\n• Workflow executions\n• AI credits consumed\n\nUsage resets monthly on your billing date.\n\n**Subscription Plans:**\n\n**Starter:** $49/mo - 5 seats, 10K contacts, 1K workflow runs/mo\n**Professional:** $149/mo - 15 seats, 50K contacts, 10K workflow runs/mo\n**Enterprise:** Custom - Unlimited seats, contacts, and runs\n\n**Upgrade/Downgrade:** Settings → Billing → Change Plan. Upgrades take effect immediately. Downgrades at next billing cycle.\n\n**Managing Payment Methods:**\n\nAdd/update credit cards in Settings → Billing → Payment Methods. We accept Visa, Mastercard, Amex, and ACH transfers (Enterprise only). Update card before expiration to avoid service interruption.\n\n**Invoices:**\n\nAccess all invoices in Settings → Billing → Invoices. Download as PDF. Invoices include:\n• Subscription charges\n• Overage fees (if applicable)\n• Tax breakdown\n• Payment method used\n\nInvoices sent via email on billing date.\n\n**Overages:**\n\nIf you exceed plan limits:\n• **Seats:** $10 per extra seat/month (prorated)\n• **API Requests:** $5 per 1,000 additional requests\n• **Storage:** $2 per GB over limit\n• **Workflow Runs:** $0.01 per additional run\n\nOverages billed monthly. Monitor usage to avoid surprises.\n\n**Cost Optimization Tips:**\n• Deactivate unused users to free up seats\n• Archive old workflows to reduce executions\n• Use bulk API operations to reduce request count\n• Clean up unused documents to free storage\n• Review usage monthly and adjust plan accordingly\n\n**Billing Support:**\nQuestions about billing? Email billing@galaxyco.ai or chat with us in Settings → Billing → Contact Support.",
      topics: ["Usage Dashboard", "Subscription Plans", "Invoices", "Payment Methods", "Cost Optimization"]
    },
    {
      id: "audit-logs",
      title: "Audit Logs",
      icon: FileText,
      description: "Track all system activities",
      lastUpdated: "2025-12-08",
      status: "beta",
      details: "Comprehensive activity tracking for security, compliance, and debugging.\n\n**What Gets Logged:**\n\n**User Actions:**\n• Login/logout events\n• Failed login attempts\n• Password changes\n• 2FA enable/disable\n\n**Data Changes:**\n• Contact/deal created, updated, deleted\n• Workflow modified or executed\n• Document uploaded or removed\n• Settings changed\n\n**Team Actions:**\n• User invited or removed\n• Role changes\n• Permission updates\n\n**API Activity:**\n• API key created or revoked\n• API requests (with endpoints and status codes)\n• Webhook deliveries\n\n**Accessing Audit Logs:**\n\nSettings → Security → Audit Logs. Available on Professional and Enterprise plans.\n\n**Log Entry Format:**\nEach log entry includes:\n• Timestamp (UTC)\n• User who performed action\n• Action type\n• Resource affected\n• Before/after values (for updates)\n• IP address\n• User agent\n\n**Search & Filter:**\n\nFilter logs by:\n• Date range\n• User\n• Action type\n• Resource type\n• Outcome (success/failure)\n\nSearch supports text queries across all fields.\n\n**Export Logs:**\n\nExport filtered logs as CSV or JSON for external analysis. Settings → Audit Logs → Export. Useful for compliance reporting or security investigations.\n\n**Retention:**\n\n**Professional:** 90-day retention\n**Enterprise:** 1-year retention (customizable up to 7 years)\n\nOlder logs are automatically archived and can be retrieved upon request.\n\n**Common Use Cases:**\n• Compliance audits (SOC 2, GDPR, HIPAA)\n• Security investigations\n• Debugging workflow issues\n• Tracking data changes\n• User activity monitoring\n\n**Alerts:**\nSet up alerts for suspicious activity (Professional & Enterprise). Configure in Settings → Security → Alerts. Examples: multiple failed logins, bulk data exports, permission changes.",
      topics: ["Activity Logs", "User Actions", "Export Logs", "Retention", "Search & Filter"]
    },
    {
      id: "advanced-settings",
      title: "Advanced Settings",
      icon: Settings,
      description: "System configuration and customization",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Advanced configuration options for customizing your workspace.\n\n**Workspace Settings:**\n\n**General:**\n• Workspace name and icon\n• Default timezone\n• Date/time format\n• Language (English, Spanish, French, German)\n• Currency for deals\n\n**Notifications:**\n• Email digest frequency (daily, weekly, never)\n• Slack integration for alerts\n• In-app notification preferences\n• Mobile push notifications\n\n**Defaults:**\n\nSet default values for new records:\n• Contact owner (creator, round-robin, specific user)\n• Deal pipeline and stage\n• Lead source\n• Tags\n\nNavigate to Settings → Defaults.\n\n**Custom Fields:**\n\nAdd custom fields to contacts, deals, or workflows:\n1. Settings → Custom Fields → Add Field\n2. Choose field type: text, number, date, dropdown, checkbox\n3. Set if required or optional\n4. Appears on all relevant forms\n\n**Integrations:**\n\nManage connected tools in Settings → Integrations. Available integrations:\n• CRMs: Salesforce, HubSpot\n• Calendar: Google Calendar, Outlook\n• Communication: Slack, Teams\n• Accounting: QuickBooks, Xero\n• E-commerce: Shopify, Stripe\n\n**Data Retention:**\n\nControl how long data is kept:\n• Deleted items: 30 days in trash before permanent deletion\n• Completed workflows: 90 days of execution logs\n• Audit logs: 90 days (Professional), 1 year (Enterprise)\n• Archived contacts: Never deleted automatically\n\n**Feature Flags (Enterprise):**\n\nEnable/disable features for controlled rollouts:\n• Beta features preview\n• Experimental AI models\n• New UI components\n\nSettings → Advanced → Feature Flags.\n\n**API & Webhooks:**\n• Generate API keys\n• Configure webhooks\n• Set rate limits\n• View API usage\n\nSettings → Developers.",
      topics: ["Workspace Settings", "Defaults", "Integrations", "Data Retention", "Feature Flags"]
    },
    {
      id: "compliance",
      title: "Compliance",
      icon: Shield,
      description: "GDPR, SOC 2, and data protection",
      lastUpdated: "2025-12-01",
      status: "stable",
      details: "GalaxyCo.ai meets stringent compliance standards to protect your data.\n\n**Certifications:**\n\n**SOC 2 Type II:** Annual audit of security, availability, processing integrity, confidentiality, and privacy controls. Report available upon request to Enterprise customers.\n\n**GDPR Compliant:** Full compliance with EU General Data Protection Regulation. Data processing agreements available.\n\n**CCPA Compliant:** California Consumer Privacy Act requirements met for US customers.\n\n**ISO 27001** (In Progress): Expected Q2 2026.\n\n**GDPR Features:**\n\n**Data Subject Rights:**\n• Right to access: Export user data\n• Right to erasure: Permanently delete user data\n• Right to rectification: Update incorrect data\n• Right to data portability: Download data in JSON format\n\nProcess requests in Settings → Privacy → Data Subject Requests.\n\n**Consent Management:** Track and manage user consent for data processing. Cookie consent banners available.\n\n**Data Residency:**\n\nChoose where your data is stored (Enterprise only):\n• US (Virginia)\n• EU (Frankfurt)\n• UK (London)\n• Canada (Montreal)\n• Australia (Sydney)\n\nData never leaves your chosen region.\n\n**Data Export:**\n\nExport all workspace data anytime. Settings → Data → Export Workspace. Includes:\n• All contacts, deals, workflows\n• Documents and knowledge base\n• User and team data\n• Audit logs\n\nDelivered as JSON files.\n\n**Data Processing Agreement (DPA):**\n\nDPA available for all customers. Includes:\n• Data processing terms\n• Sub-processor list\n• Security measures\n• Liability terms\n\nRequest DPA: legal@galaxyco.ai\n\n**Security Measures:**\n• Encryption at rest (AES-256)\n• Encryption in transit (TLS 1.3)\n• Regular penetration testing\n• Employee background checks\n• 24/7 security monitoring\n• Incident response plan\n\n**Subprocessors:**\nFull list of subprocessors (hosting, email, etc.) available at galaxyco.ai/subprocessors.",
      topics: ["GDPR", "SOC 2", "Data Residency", "Data Export", "DPA"]
    }
  ],
  "ai-agents": [
    {
      id: "platform-overview",
      title: "Platform Overview",
      icon: Database,
      description: "Complete capabilities and constraints",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Machine-readable specifications for AI agents integrating with GalaxyCo.ai.\n\n**Platform Capabilities:**\n\n**Core Functions:**\n• CRM operations (contacts, deals, activities)\n• Workflow creation and execution\n• Knowledge base management\n• Neptune AI orchestration\n• Real-time webhook events\n• Team and permission management\n\n**Supported Operations:**\n• CRUD on all resources\n• Complex queries with filtering, sorting, pagination\n• Bulk operations (max 100 items)\n• File uploads (max 25MB)\n• Transactional workflows\n• Async job processing\n\n**Architecture:**\n\n**API Style:** RESTful with JSON payloads\n**Base URL:** /api\n**Authentication:** Bearer token (API keys or OAuth 2.0)\n**Rate Limiting:** Token bucket algorithm, per-endpoint limits\n**Pagination:** Cursor-based, max 100 items per page\n**Webhooks:** Event-driven with signature verification\n**Idempotency:** Supported via Idempotency-Key header\n\n**Rate Limits:**\n\n**By Plan:**\n• Starter: 1K req/hr\n• Professional: 5K req/hr\n• Enterprise: 20K req/hr (customizable)\n\n**By Operation Type:**\n• GET: Full rate limit\n• POST/PUT/PATCH: 50% of rate limit\n• DELETE: 25% of rate limit\n• Bulk: 10% of rate limit\n\n**Data Access:**\n\n**Read Access:** All resources accessible via API with proper scopes\n**Write Access:** All mutations supported with validation\n**Search:** Full-text search on contacts, deals, documents\n**Filtering:** Support for complex boolean queries\n**Relationships:** Nested resource loading available\n\n**Operational Constraints:**\n\n**Hard Limits:**\n• Max payload size: 10MB\n• Max bulk operations: 100 items\n• Max webhook payload: 1MB\n• Workflow timeout: 5 minutes\n• API response timeout: 30 seconds\n\n**Soft Limits:**\n• Contacts per workspace: 1M (Enterprise)\n• Workflows per workspace: 1000\n• Concurrent workflow executions: 100\n\n**Data Types:**\n• Timestamps: ISO 8601 UTC\n• IDs: Prefixed strings (cnt_, wf_, doc_)\n• Currency: ISO 4217 codes\n• Enums: Predefined string values\n\n**Error Handling:**\n• Standard HTTP status codes\n• Structured error objects with codes\n• Request IDs for debugging",
      topics: ["Capabilities", "Architecture", "Rate Limits", "Data Access", "Constraints"]
    },
    {
      id: "data-models",
      title: "Data Models",
      icon: Database,
      description: "Entity schemas and relationships",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Comprehensive data schemas for all platform entities.\n\n**Contact Schema:**\n```json\n{\n  \"id\": \"cnt_abc123\",\n  \"email\": \"string (required, unique)\",\n  \"first_name\": \"string\",\n  \"last_name\": \"string\",\n  \"company\": \"string\",\n  \"title\": \"string\",\n  \"phone\": \"string\",\n  \"score\": \"enum[cold, warm, hot]\",\n  \"tags\": \"array[string]\",\n  \"custom_fields\": \"object\",\n  \"created_at\": \"ISO 8601\",\n  \"updated_at\": \"ISO 8601\",\n  \"owner_id\": \"string (user ID)\"\n}\n```\n\n**Deal Schema:**\n```json\n{\n  \"id\": \"deal_abc123\",\n  \"name\": \"string (required)\",\n  \"contact_id\": \"string (required)\",\n  \"value\": \"number\",\n  \"currency\": \"ISO 4217 code\",\n  \"stage\": \"string\",\n  \"probability\": \"number (0-100)\",\n  \"expected_close_date\": \"ISO 8601 date\",\n  \"status\": \"enum[open, won, lost]\",\n  \"created_at\": \"ISO 8601\",\n  \"owner_id\": \"string\"\n}\n```\n\n**Workflow Schema:**\n```json\n{\n  \"id\": \"wf_abc123\",\n  \"name\": \"string (required)\",\n  \"description\": \"string\",\n  \"trigger\": {\n    \"type\": \"enum[event, schedule, webhook]\",\n    \"config\": \"object\"\n  },\n  \"conditions\": \"array[condition]\",\n  \"actions\": \"array[action]\",\n  \"active\": \"boolean\",\n  \"created_at\": \"ISO 8601\",\n  \"updated_at\": \"ISO 8601\"\n}\n```\n\n**Agent Schema:**\n```json\n{\n  \"id\": \"agent_abc123\",\n  \"name\": \"string\",\n  \"type\": \"enum[scoring, enrichment, content, custom]\",\n  \"ai_provider\": \"enum[openai, anthropic, custom]\",\n  \"model\": \"string\",\n  \"instructions\": \"string\",\n  \"inputs\": \"array[string]\",\n  \"outputs\": \"array[string]\",\n  \"active\": \"boolean\"\n}\n```\n\n**Document Schema:**\n```json\n{\n  \"id\": \"doc_abc123\",\n  \"name\": \"string\",\n  \"content\": \"string\",\n  \"type\": \"enum[pdf, docx, txt, md]\",\n  \"size_bytes\": \"number\",\n  \"tags\": \"array[string]\",\n  \"created_at\": \"ISO 8601\",\n  \"uploaded_by\": \"string (user ID)\"\n}\n```\n\n**Relationships:**\n\n• Contact → Deals (one-to-many)\n• Contact → Activities (one-to-many)\n• Deal → Contact (many-to-one)\n• Workflow → Actions (one-to-many)\n• Agent → Workflows (many-to-many)\n\n**Custom Fields:**\nAll entities support custom fields via `custom_fields` object. Keys are field names, values match field type (string, number, boolean, date, array).",
      topics: ["Contacts Schema", "Workflows Schema", "Agents Schema", "Relationships", "Custom Fields"]
    },
    {
      id: "use-case-taxonomy",
      title: "Use Case Taxonomy",
      icon: BookOpen,
      description: "Categorized use cases and patterns",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Categorized use cases with recommended implementation patterns for AI agents.\n\n**CRM Use Cases:**\n\n**Lead Management:**\n• Auto-enrich contacts from email/company domain\n• Score leads based on fit criteria\n• Route leads to appropriate sales rep\n• De-duplicate and merge contacts\n\nPattern: Event-driven workflow triggered on contact.created\n\n**Deal Management:**\n• Track deal progression through pipeline\n• Predict deal close probability\n• Alert on stalled deals\n• Generate deal summaries\n\nPattern: Scheduled workflow checking deal.updated_at\n\n**Activity Tracking:**\n• Log emails, calls, meetings\n• Extract action items from transcripts\n• Suggest next best actions\n• Generate activity summaries\n\nPattern: Real-time via API on activity completion\n\n**Automation Patterns:**\n\n**Event-Driven:**\nTrigger: Webhook or platform event\nUse when: Real-time response required\nExample: New contact → Enrich → Score → Route\n\n**Scheduled:**\nTrigger: Time-based (cron)\nUse when: Batch processing acceptable\nExample: Daily report generation at 9am\n\n**Request-Response:**\nTrigger: Explicit API call\nUse when: On-demand execution needed\nExample: User clicks 'Generate Summary'\n\n**Hybrid:**\nTrigger: Combination of above\nUse when: Complex multi-stage processes\nExample: Event triggers workflow, workflow schedules follow-ups\n\n**Integration Scenarios:**\n\n**Bidirectional Sync:**\nSync data between GalaxyCo and external CRM (Salesforce, HubSpot). Use webhooks + API calls.\n\n**Enrichment:**\nFetch additional data from external sources (Clearbit, LinkedIn). Use API + background jobs.\n\n**Notification:**\nSend alerts to Slack, Teams, email. Use webhooks → external service.\n\n**Reporting:**\nPush data to BI tools (Tableau, Looker). Use scheduled export + API.\n\n**Best Practices:**\n• Use idempotency keys for writes\n• Implement exponential backoff for retries\n• Cache frequently accessed data\n• Batch operations when possible\n• Monitor rate limits proactively\n\n**Anti-Patterns:**\n• Polling instead of webhooks\n• Individual API calls instead of bulk\n• Ignoring error codes\n• Hard-coding IDs or assumptions\n• Over-requesting data (fetch only needed fields)",
      topics: ["CRM Use Cases", "Automation Patterns", "Integration Scenarios", "Best Practices", "Anti-Patterns"]
    },
    {
      id: "api-specs",
      title: "API Specifications",
      icon: Code2,
      description: "OpenAPI/Swagger documentation",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Machine-readable specifications for automated tooling and code generation.\n\n**OpenAPI 3.1 Specification:**\n\nFull API spec available at: /api/openapi\n\nIncludes:\n• All endpoints with parameters\n• Request/response schemas\n• Authentication requirements\n• Error responses\n• Examples for all operations\n\n**Interactive Documentation:**\n\nExplore API interactively: /docs/api\n\nSwagger UI features:\n• Try API calls directly from browser\n• See real request/response examples\n• Authentication playground\n• Response schema viewer\n\n**Code Generation:**\n\nGenerate client code from OpenAPI spec:\n\n```bash\n# JavaScript/TypeScript\nnpx openapi-generator-cli generate \\\n  -i /api/openapi \\\n  -g typescript-fetch \\\n  -o ./generated-client\n\n# Python\nopenapi-generator generate \\\n  -i /api/openapi \\\n  -g python \\\n  -o ./generated-client\n```\n\nSupported generators: JavaScript, TypeScript, Python, Go, Ruby, Java, C#, PHP, and more.\n\n**Postman Collection:**\n\nImport into Postman: https://api.galaxyco.ai/postman.json\n\nIncludes:\n• Pre-configured authentication\n• Environment variables\n• Sample requests for all endpoints\n• Test scripts\n\n**Official SDKs:**\n\nWe provide and maintain official SDKs:\n\n**JavaScript/TypeScript:**\n```bash\nnpm install @galaxyco/sdk\n```\n\n**Python:**\n```bash\npip install galaxyco\n```\n\nSDKs include:\n• Type-safe interfaces\n• Auto-retry logic\n• Rate limit handling\n• Comprehensive error types\n• Pagination helpers\n• Webhook verification\n\n**Schema Validation:**\n\nAll requests validated against JSON Schema. Validation errors return 400 with detailed field-level errors.\n\n**Versioning:**\n\nAPI version in URL (/v1/). Spec includes version info. We maintain backward compatibility for 12 months.",
      topics: ["OpenAPI Spec", "Swagger UI", "Code Generation", "Postman Collection", "SDKs"]
    },
    {
      id: "integration-patterns",
      title: "Integration Patterns",
      icon: Webhook,
      description: "Common integration architectures",
      lastUpdated: "2025-12-12",
      status: "stable",
      details: "Reference architectures for common integration patterns.\n\n**Event-Driven Architecture:**\n\n**Flow:** GalaxyCo → Webhook → Your Service → Process → API Call Back\n\n**Best for:** Real-time reactions (new contact → enrich)\n**Latency:** <1s\n**Reliability:** High (retries + idempotency)\n\n**Implementation:**\n1. Register webhook in GalaxyCo\n2. Implement endpoint to receive events\n3. Return 200 immediately\n4. Process async in background\n5. Call API to update GalaxyCo\n\n**Request-Response Pattern:**\n\n**Flow:** Your Service → API Call → GalaxyCo → Response → Process\n\n**Best for:** On-demand queries (show contact details)\n**Latency:** <500ms\n**Reliability:** Depends on API availability\n\n**Implementation:**\n1. Call API with proper auth\n2. Handle response\n3. Implement retry logic\n4. Cache when appropriate\n\n**Batch Processing:**\n\n**Flow:** Schedule → Fetch Data → Process Bulk → Bulk Update\n\n**Best for:** Periodic updates (nightly scoring)\n**Latency:** Minutes to hours\n**Reliability:** High (can retry entire batch)\n\n**Implementation:**\n1. Use cron or scheduler\n2. Fetch data via API (paginated)\n3. Process in batches of 100\n4. Use bulk endpoints\n5. Track progress/failures\n\n**Real-Time Sync (Bidirectional):**\n\n**Flow:** System A ↔ Webhooks + API ↔ System B\n\n**Best for:** Keeping two systems in sync (GalaxyCo ↔ Salesforce)\n**Latency:** <5s\n**Reliability:** Medium (requires conflict resolution)\n\n**Implementation:**\n1. Webhooks in both directions\n2. Dedupe logic (track sync IDs)\n3. Conflict resolution strategy\n4. Exponential backoff\n5. Dead letter queue for failures\n\n**Hybrid Pattern:**\n\n**Flow:** Webhook triggers workflow → Workflow schedules follow-ups → API polls status\n\n**Best for:** Complex multi-stage processes\n**Latency:** Varies by stage\n**Reliability:** High (each stage isolated)\n\n**Implementation:**\n1. Event triggers initial workflow\n2. Workflow uses multiple patterns\n3. State machine tracks progress\n4. Monitoring at each stage\n\n**Reliability Patterns:**\n\n• Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s\n• Circuit breaker: Stop after N failures\n• Idempotency: Use Idempotency-Key header\n• Dead letter queue: Store failed events\n• Monitoring: Track success/failure rates",
      topics: ["Event-Driven", "Request-Response", "Batch Processing", "Real-Time Sync", "Hybrid"]
    },
    {
      id: "performance",
      title: "Performance Benchmarks",
      icon: Zap,
      description: "Response times and throughput",
      lastUpdated: "2025-12-10",
      status: "stable",
      details: "Performance characteristics and optimization guidelines.\n\n**API Response Times (P95):**\n\n**Read Operations:**\n• GET /contacts/{id}: 50ms\n• GET /contacts (list): 150ms\n• GET /workflows/{id}: 40ms\n• Search queries: 200ms\n\n**Write Operations:**\n• POST /contacts: 120ms\n• PATCH /contacts/{id}: 80ms\n• DELETE /contacts/{id}: 60ms\n• Bulk operations: 500ms (for 100 items)\n\n**Workflow Execution:**\n• Simple workflow (1-2 actions): 300ms\n• Complex workflow (5+ actions): 2s\n• AI agent execution: 3-10s (depending on model)\n\n**Throughput:**\n\n**Per Plan:**\n• Starter: 1K requests/hour = ~0.3 req/s\n• Professional: 5K requests/hour = ~1.4 req/s\n• Enterprise: 20K requests/hour = ~5.5 req/s\n\n**Burst Capacity:**\nShort bursts (10s) can exceed rate limit by 2x. Sustained load must stay within limit.\n\n**Concurrency:**\n\n**API Calls:** No explicit limit. Rate limit is shared across all concurrent requests.\n**Workflow Executions:** Max 100 concurrent per workspace.\n**Webhook Deliveries:** Max 50 concurrent per endpoint.\n\n**Optimization Guidelines:**\n\n**Reduce Latency:**\n1. Use field selection (?fields=id,name,email)\n2. Enable HTTP/2 for connection reuse\n3. Cache frequently accessed data\n4. Use CDN for static content\n5. Call APIs from same region as data\n\n**Increase Throughput:**\n1. Use bulk endpoints instead of loops\n2. Parallelize independent requests\n3. Batch updates into fewer API calls\n4. Use webhooks instead of polling\n5. Implement request deduplication\n\n**Optimize Workflows:**\n1. Minimize number of actions\n2. Use conditions to skip unnecessary steps\n3. Avoid nested workflow calls\n4. Cache workflow results\n5. Use async execution for non-critical paths\n\n**Monitoring:**\n\n**Key Metrics to Track:**\n• API response time (P50, P95, P99)\n• Error rate by endpoint\n• Rate limit utilization\n• Workflow execution time\n• Webhook delivery success rate\n\n**Alerting Thresholds:**\n• P95 latency >2x baseline\n• Error rate >5%\n• Rate limit >80% utilization\n• Workflow failures >10%\n\n**Available via:** Status page (status.galaxyco.ai) and API metrics endpoint.",
      topics: ["Latency", "Throughput", "Concurrency", "Optimization", "Monitoring"]
    },
    {
      id: "limitations",
      title: "Limitations",
      icon: AlertCircle,
      description: "Known constraints and boundaries",
      lastUpdated: "2025-12-14",
      status: "stable",
      details: "Known limitations and constraints to design around.\n\n**API Limits:**\n\n**Rate Limits:** Enforced per plan (1K-20K req/hr). No way to temporarily exceed.\n**Payload Size:** Max 10MB per request. Use file upload endpoint for larger files.\n**Bulk Operations:** Max 100 items per request. No exceptions.\n**Timeout:** All API calls timeout after 30s. Long-running operations return 202 with job ID.\n**Concurrency:** Max 100 concurrent workflow executions per workspace.\n\n**Data Constraints:**\n\n**String Fields:** Max 10,000 characters (except for document content).\n**Arrays:** Max 1,000 items per array field.\n**Custom Fields:** Max 50 custom fields per entity type.\n**Tags:** Max 100 tags per contact/deal.\n**Relationships:** No cascading deletes. Must handle related records manually.\n\n**Search Limitations:**\n• Full-text search limited to 100K documents\n• Search results max 1,000 items\n• No fuzzy matching (exact or prefix only)\n• Search indexes updated every 5 minutes (eventual consistency)\n\n**Workflow Limitations:**\n• Max 50 actions per workflow\n• No loops or recursion\n• Workflow execution timeout: 5 minutes\n• Cannot call external webhooks directly (use API action)\n• No conditional branching beyond simple IF/ELSE\n\n**Known Issues:**\n\n**Beta Features:**\n• Audit logs: 5-minute delay in availability\n• Webhook retries: Max 5 attempts (no manual retry)\n• Bulk delete: No undo functionality\n\n**Regional Limitations:**\n• Data residency only on Enterprise plan\n• Some AI models not available in all regions\n• Webhook delivery may be slower to certain regions\n\n**Integration Limitations:**\n• External API calls from workflows: Max 10s timeout\n• OAuth refresh tokens expire after 90 days of inactivity\n• SSO limited to SAML 2.0 and OAuth 2.0\n\n**Workarounds:**\n\n**Large Payloads:** Split into multiple requests or use file upload.\n**Complex Workflows:** Chain multiple workflows via webhooks.\n**Search Limits:** Use filters instead of full-text search when possible.\n**Rate Limits:** Implement queuing system in your application.\n**Timeouts:** For long operations, use async pattern: POST to create job, GET to poll status.\n\n**Upcoming Improvements:**\n• GraphQL API (Q1 2026)\n• Increased rate limits for all plans (Q2 2026)\n• Workflow debugging tools (Q2 2026)\n• Real-time search (Q3 2026)",
      topics: ["API Limits", "Data Constraints", "Feature Gaps", "Known Issues", "Workarounds"]
    }
  ]
};

const quickLinks = [
  { label: "API Reference", href: "#api-reference", icon: Code2 },
  { label: "Changelog", href: "#changelog", icon: Clock },
  { label: "Contact Support", href: "/contact", icon: HelpCircle },
];

const statusConfig = {
  stable: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  beta: { bg: "bg-nebula-violet/10", text: "text-nebula-violet", border: "border-nebula-violet/20" },
  new: { bg: "bg-nebula-teal/10", text: "text-nebula-teal", border: "border-nebula-teal/20" },
};

export default function DocsPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("end-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const currentSections = docSections[userType];
  const filteredSections = searchQuery
    ? currentSections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentSections;

  // Close sidebar on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentConfig = userTypeConfig[userType];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      {/* Minimal Hero Section */}
      <section className="relative pt-[73px] overflow-hidden">
        {/* Dark nebula background */}
        <div className="absolute inset-0 bg-gradient-to-b from-nebula-void via-nebula-deep to-nebula-dark" />
        
        {/* Subtle nebula accents */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-nebula-violet/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-nebula-teal/8 rounded-full blur-[80px]" />
        
        {/* Hero content */}
        <div className="relative z-10 px-6 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-nebula-frost tracking-widest mb-4 uppercase">
              Documentation
            </h1>
            <p className="text-lg sm:text-xl text-nebula-frost/60 max-w-2xl mx-auto">
              Everything you need to build, integrate, and scale with GalaxyCo.ai
            </p>
          </motion.div>
        </div>
        
        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Subtle nebula background for content area */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ top: "300px" }}>
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-nebula-violet/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[500px] bg-nebula-teal/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="flex min-h-[calc(100vh-300px)]">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 lg:hidden h-12 w-12 rounded-full bg-nebula-dark text-nebula-frost shadow-lg flex items-center justify-center border border-nebula-frost/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-nebula-void/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen w-72 lg:w-64 xl:w-72
            bg-background/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
            border-r border-border/50 lg:border-0
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            pt-0
          `}
        >
          <div className="h-full overflow-y-auto py-6 px-4 lg:px-6">
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Type Pills */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Documentation
              </span>
              {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
                const config = userTypeConfig[type];
                const Icon = config.icon;
                const isActive = userType === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setUserType(type);
                      setActiveSection(null);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive 
                        ? "bg-nebula-dark text-nebula-frost shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive 
                        ? "bg-gradient-to-br from-nebula-teal to-nebula-violet" 
                        : "bg-muted"
                      }
                    `}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-nebula-frost" : "text-muted-foreground"}`} />
                    </div>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Section Links */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                {currentConfig.label} Docs
              </span>
              {currentSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      transition-all duration-150
                      ${isActive 
                        ? "bg-nebula-teal/10 text-nebula-teal font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                    {section.status === "new" && (
                      <span className="ml-auto text-[10px] font-semibold text-nebula-teal bg-nebula-teal/10 px-1.5 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Quick Links */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Quick Links
              </span>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-150"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 min-w-0 lg:pl-0">
          {/* Subtle nebula background for content area */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-1/4 w-[600px] h-[400px] bg-nebula-violet/[0.03] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] bg-nebula-teal/[0.02] rounded-full blur-[100px]" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft focus-visible:ring-nebula-teal/30"
                  aria-label="Search documentation"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">K</kbd>
                </div>
              </div>
            </motion.div>

            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-nebula-teal to-nebula-violet flex items-center justify-center">
                  <CurrentIcon className="h-5 w-5 text-nebula-frost" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{currentConfig.label}</h1>
                  <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Doc Cards - Expandable */}
            <div className="space-y-3">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                const status = section.status ? statusConfig[section.status] : null;
                const isExpanded = activeSection === section.id;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div className={`
                      relative rounded-2xl bg-card/60 backdrop-blur-sm border transition-all duration-300 shadow-soft
                      ${isExpanded 
                        ? "border-nebula-teal/40 bg-card/80 shadow-soft-hover" 
                        : "border-border/50 hover:border-nebula-teal/30 hover:bg-card/80 hover:shadow-soft-hover"
                      }
                    `}>
                      {/* Nebula glow */}
                      <div className={`
                        absolute inset-0 rounded-2xl bg-gradient-to-r from-nebula-teal/5 to-nebula-violet/5 transition-opacity duration-300
                        ${isExpanded ? "opacity-100" : "opacity-0"}
                      `} />
                      
                      {/* Header - Clickable */}
                      <button
                        onClick={() => setActiveSection(isExpanded ? null : section.id)}
                        className="w-full group"
                        aria-expanded={isExpanded}
                        aria-controls={`doc-content-${section.id}`}
                      >
                        <div className="relative flex items-center gap-4 p-4 sm:p-5 text-left">
                          {/* Icon */}
                          <div className={`
                            relative h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                            ${isExpanded 
                              ? "bg-gradient-to-br from-nebula-teal/20 to-nebula-violet/20" 
                              : "bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-nebula-teal/20 group-hover:to-nebula-violet/20"
                            }
                          `}>
                            <Icon className={`h-6 w-6 transition-colors ${isExpanded ? "text-nebula-teal" : "text-muted-foreground group-hover:text-nebula-teal"}`} />
                          </div>

                          {/* Content */}
                          <div className="relative flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold transition-colors ${isExpanded ? "text-nebula-teal" : "text-foreground group-hover:text-nebula-teal"}`}>
                                {section.title}
                              </h3>
                              {status && (
                                <Badge className={`${status.bg} ${status.text} ${status.border} border text-[10px] px-1.5 py-0`}>
                                  {section.status === "stable" ? "Stable" : section.status === "beta" ? "Beta" : "New"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {section.description}
                            </p>
                          </div>

                          {/* Arrow - rotates when expanded */}
                          <ChevronRight className={`
                            relative h-5 w-5 transition-all flex-shrink-0
                            ${isExpanded 
                              ? "text-nebula-teal rotate-90" 
                              : "text-muted-foreground/50 group-hover:text-nebula-teal group-hover:translate-x-1"
                            }
                          `} />
                        </div>
                      </button>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            id={`doc-content-${section.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="relative px-4 sm:px-5 pb-5 pt-0">
                              {/* Divider */}
                              <div className="h-px bg-border/50 mb-4" />
                              
                              {/* Details - Enhanced Components or Standard Markdown */}
                              {section.id === "getting-started" ? (
                                <GettingStartedContent />
                              ) : section.id === "core-concepts" ? (
                                <CoreConceptsContent />
                              ) : section.id === "neptune-ai" ? (
                                <NeptuneAIContent />
                              ) : section.id === "workflows" ? (
                                <BuildingWorkflowsContent />
                              ) : section.id === "crm-basics" ? (
                                <CRMEssentialsContent />
                              ) : section.id === "best-practices" ? (
                                <BestPracticesContent />
                              ) : section.id === "troubleshooting" ? (
                                <TroubleshootingContent />
                              ) : section.id === "api-overview" ? (
                                <APIOverviewContent />
                              ) : section.id === "authentication" ? (
                                <AuthenticationContent />
                              ) : section.id === "api-reference" ? (
                                <APIReferenceContent />
                              ) : section.id === "webhooks" ? (
                                <WebhooksContent />
                              ) : section.id === "rate-limits" ? (
                                <RateLimitsContent />
                              ) : section.id === "sdks" ? (
                                <SDKsContent />
                              ) : section.id === "errors" ? (
                                <ErrorHandlingContent />
                              ) : section.id === "changelog" ? (
                                <ChangelogContent />
                              ) : section.id === "team-management" ? (
                                <TeamManagementContent />
                              ) : section.id === "permissions" ? (
                                <PermissionsContent />
                              ) : section.id === "security" ? (
                                <SecurityContent />
                              ) : section.id === "billing" ? (
                                <BillingContent />
                              ) : section.id === "audit-logs" ? (
                                <AuditLogsContent />
                              ) : section.id === "advanced-settings" ? (
                                <AdvancedSettingsContent />
                              ) : section.id === "compliance" ? (
                                <ComplianceContent />
                              ) : section.id === "platform-overview" ? (
                                <PlatformOverviewContent />
                              ) : section.id === "data-models" ? (
                                <DataModelsContent />
                              ) : section.id === "use-cases" ? (
                                <UseCaseTaxonomyContent />
                              ) : section.id === "api-specs" ? (
                                <APISpecificationsContent />
                              ) : section.id === "integration-patterns" ? (
                                <IntegrationPatternsContent />
                              ) : section.id === "performance" ? (
                                <PerformanceBenchmarksContent />
                              ) : section.id === "limitations" ? (
                                <LimitationsContent />
                              ) : section.details && (
                                <div className="text-base text-muted-foreground/90 mb-6 leading-[1.7] prose prose-base max-w-none
                                  prose-headings:text-foreground prose-headings:font-semibold prose-headings:leading-tight
                                  prose-headings:mt-8 prose-headings:mb-4 first:prose-headings:mt-0
                                  prose-h3:text-lg prose-h3:tracking-tight
                                  prose-h4:text-base prose-h4:font-medium
                                  prose-p:my-4 prose-p:leading-[1.7]
                                  prose-strong:text-foreground prose-strong:font-medium
                                  prose-ul:my-5 prose-ul:list-none prose-ul:space-y-2.5 prose-ul:pl-0
                                  prose-ol:my-5 prose-ol:space-y-2.5 prose-ol:pl-5
                                  prose-li:my-0 prose-li:pl-0 prose-li:leading-[1.6]
                                  prose-li:before:content-['•'] prose-li:before:mr-3 prose-li:before:text-nebula-teal prose-li:before:font-bold
                                  prose-code:text-nebula-teal prose-code:bg-nebula-teal/15 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                                  prose-pre:bg-nebula-dark/80 prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:shadow-sm prose-pre:my-5
                                  prose-pre:text-nebula-frost/90 prose-pre:text-sm prose-pre:leading-relaxed
                                  prose-a:text-nebula-teal prose-a:no-underline hover:prose-a:underline
                                ">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {section.details}
                                  </ReactMarkdown>
                                </div>
                              )}
                              
                              {/* Topics */}
                              {section.topics && section.topics.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-border/40">
                                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    Topics Covered
                                  </h4>
                                  <div className="flex flex-wrap gap-2.5">
                                    {section.topics.map((topic: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-3.5 py-2 rounded-lg bg-nebula-teal/10 text-nebula-teal text-sm font-medium border border-nebula-teal/20 transition-colors hover:bg-nebula-teal/15"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Coming Soon Note */}
                              <div className="mt-6 pt-4 border-t border-border/30 flex items-center gap-2.5 text-sm text-muted-foreground/70">
                                <Clock className="h-4 w-4" />
                                <span>Full content coming soon • Updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* No results */}
            {filteredSections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  No documentation matches "{searchQuery}"
                </p>
              </motion.div>
            )}

            {/* Coming Soon CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nebula-dark to-nebula-void p-8 text-nebula-frost">
                {/* Nebula accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-violet/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-nebula-teal/20 rounded-full blur-[60px]" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-nebula-frost/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-7 w-7 text-nebula-teal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Full Documentation Coming Soon</h3>
                    <p className="text-nebula-frost/70 text-sm">
                      We're actively writing comprehensive guides. Get started with the platform while we expand our docs.
                    </p>
                  </div>
                  <Button
                    onClick={handleEnterApp}
                    className="bg-nebula-frost text-nebula-void hover:bg-nebula-frost/90"
                  >
                    Start Building
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Footer spacing */}
            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}