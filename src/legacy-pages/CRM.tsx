"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Edit,
  Filter,
  Flag,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
  Video,
  Zap,
  User,
  FolderKanban,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CRMHeader } from "@/components/crm/CRMHeader";
import { CRMStatsGrid } from "@/components/crm/CRMStatsGrid";
import { EnhancedContactHeader } from "@/components/crm/EnhancedContactHeader";
import { AIActionCard } from "@/components/crm/AIActionCard";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";
import { SalesKanban } from "@/components/crm/SalesKanban";
import { ContactDialog } from "@/components/crm/ContactDialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Contact, Deal, Interaction, Project } from "@/types/crm";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ... (Keep existing data constants: contacts, projects, deals, interactions, etc.)
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
    sentiment: "positive",
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
    sentiment: "neutral",
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
    sentiment: "concerned",
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
    sentiment: "neutral",
  },
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
    description: "Full-scale deployment of GalaxyCo.ai with AI Assistants, Knowledge Base, and CRM automations.",
    tasks: [
      {
        id: "1",
        title: "Complete data migration",
        status: "completed",
        assignee: "SC",
        dueDate: "Nov 1, 2025",
      },
      {
        id: "2",
        title: "Configure AI playbooks for sales",
        status: "in-progress",
        assignee: "MR",
        dueDate: "Nov 20, 2025",
      },
      {
        id: "3",
        title: "Executive enablement workshop",
        status: "pending",
        assignee: "SC",
        dueDate: "Dec 5, 2025",
      },
    ],
    milestones: [
      { id: "1", title: "Kickoff", date: "Oct 1, 2025", completed: true },
      { id: "2", title: "Pilot live", date: "Nov 10, 2025", completed: false },
      { id: "3", title: "Company rollout", date: "Dec 15, 2025", completed: false },
    ],
    updates: [
      { id: "1", author: "SC", date: "Today", content: "Data migration completed ahead of schedule." },
      { id: "2", author: "MR", date: "Yesterday", content: "Sales playbooks drafted for review." },
    ],
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
    description: "API integrations connecting GalaxyCo.ai to Slack, Salesforce, and internal tools.",
    tasks: [
      { id: "1", title: "API review + requirements", status: "completed", assignee: "MR", dueDate: "Nov 10, 2025" },
      { id: "2", title: "Integration architecture", status: "in-progress", assignee: "MR", dueDate: "Nov 20, 2025" },
      { id: "3", title: "Salesforce connector", status: "pending", assignee: "MR", dueDate: "Dec 20, 2025" },
    ],
    milestones: [
      { id: "1", title: "Kickoff", date: "Nov 15, 2025", completed: false },
      { id: "2", title: "Architecture approved", date: "Nov 20, 2025", completed: false },
      { id: "3", title: "All integrations live", date: "Jan 30, 2026", completed: false },
    ],
    updates: [{ id: "1", author: "MR", date: "Today", content: "Green light from their CTO on approach." }],
  },
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
    aiRisk: "low",
  },
  {
    id: "2",
    title: "API Integration Package",
    company: "InnovateLabs",
    value: "$28,000",
    stage: "proposal",
    probability: 60,
    closeDate: "Dec 15, 2025",
    aiRisk: "medium",
  },
  {
    id: "3",
    title: "Custom Development",
    company: "Global Systems",
    value: "$62,000",
    stage: "qualified",
    probability: 70,
    closeDate: "Dec 1, 2025",
    aiRisk: "medium",
  },
  {
    id: "4",
    title: "Pilot Program",
    company: "Northwind Labs",
    value: "$18,000",
    stage: "lead",
    probability: 35,
    closeDate: "Jan 12, 2026",
    aiRisk: "high",
  },
  {
    id: "5",
    title: "Renewal + Expansion",
    company: "Apex Holdings",
    value: "$75,000",
    stage: "closed",
    probability: 100,
    closeDate: "Oct 15, 2025",
    aiRisk: "low",
  },
];

const interactions: Interaction[] = [
  {
    id: "1",
    type: "call",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Today, 2:30 PM",
    duration: "23 min",
    summary:
      "Discussed Q4 timeline and budget. Team is ready pending executive approval; asked for a final proposal with revised pricing.",
    actionItems: [
      { text: "Send proposal by Friday", completed: false },
      { text: "Schedule technical demo for next week", completed: false },
      { text: "Connect with their CTO", completed: true },
    ],
    status: "completed",
    sentiment: "positive",
  },
  {
    id: "2",
    type: "email",
    contactId: "1",
    contact: "Sarah Chen",
    date: "Yesterday, 9:15 AM",
    summary: "Requested enterprise security documentation and SOC 2 report for legal review.",
    actionItems: [
      { text: "Share compliance docs", completed: true },
      { text: "Prepare security FAQ deck", completed: false },
    ],
    status: "completed",
    sentiment: "neutral",
  },
  {
    id: "3",
    type: "meeting",
    contactId: "2",
    contact: "Michael Rodriguez",
    date: "Today, 10:00 AM",
    duration: "45 min",
    summary: "Roadmap workshop covering API limits and webhook strategy; awaiting pricing follow-up.",
    actionItems: [
      { text: "Share API documentation", completed: false },
      { text: "Provide enterprise pricing options", completed: false },
    ],
    status: "transcribing",
    sentiment: "neutral",
  },
  {
    id: "4",
    type: "email",
    contactId: "3",
    contact: "Emma Thompson",
    date: "Yesterday, 4:15 PM",
    summary: "Contract negotiation follow-up; legal team wants SLA updates before signing.",
    actionItems: [
      { text: "Review SLA changes with legal", completed: false },
      { text: "Schedule call for Thursday", completed: false },
    ],
    status: "completed",
    sentiment: "neutral",
  },
  {
    id: "5",
    type: "call",
    contactId: "4",
    contact: "James Park",
    date: "1 week ago, 10:00 AM",
    duration: "20 min",
    summary: "Budget constraints surfaced; asked for flexible payment options.",
    actionItems: [{ text: "Draft flexible payment plan", completed: true }],
    status: "completed",
    sentiment: "neutral",
  },
];

const aiCohorts = ["High value + warm", "Needs legal review", "Dormant > 7 days", "Exec sponsor involved"];
const quickFilters = ["hot", "warm", "cold"] as const;

const gradients = [
  { bg: "from-blue-500 via-blue-600 to-cyan-600", ring: "ring-blue-400/50", shadow: "shadow-blue-500/20" },
  { bg: "from-purple-500 via-purple-600 to-pink-600", ring: "ring-purple-400/50", shadow: "shadow-purple-500/20" },
  { bg: "from-orange-500 via-orange-600 to-red-600", ring: "ring-orange-400/50", shadow: "shadow-orange-500/20" },
  { bg: "from-green-500 via-green-600 to-emerald-600", ring: "ring-green-400/50", shadow: "shadow-green-500/20" },
  { bg: "from-pink-500 via-pink-600 to-rose-600", ring: "ring-pink-400/50", shadow: "shadow-pink-500/20" },
  { bg: "from-cyan-500 via-cyan-600 to-teal-600", ring: "ring-cyan-400/50", shadow: "shadow-cyan-500/20" },
];

const statusColors: Record<string, string> = {
  hot: "bg-soft-red/20 text-soft-red border-soft-red/30",
  warm: "bg-soft-amber/20 text-soft-amber border-soft-amber/30",
  cold: "bg-soft-cold/20 text-soft-cold border-soft-cold/30",
};

const sentimentMap = {
  positive: { icon: TrendingUp, color: "text-green-500" },
  concerned: { icon: AlertCircle, color: "text-orange-500" },
  neutral: { icon: TrendingDown, color: "text-muted-foreground" },
};

const getHealthScoreColor = (score: number): string => {
  if (score >= 85) {
    return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  }
  if (score >= 70) {
    return "bg-blue-50 text-blue-600 border border-blue-200";
  }
  if (score >= 50) {
    return "bg-amber-50 text-amber-600 border border-amber-200";
  }
  return "bg-rose-50 text-rose-600 border border-rose-200";
};

interface CRMProps {
  initialContacts?: Contact[];
  initialProjects?: Project[];
  initialDeals?: Deal[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CRM({ 
  initialContacts = contacts, 
  initialProjects = projects, 
  initialDeals = deals 
}: CRMProps = {}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts" | "projects" | "sales">("contacts");
  const [contactSearch, setContactSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  
  // Use SWR for live data fetching
  const { data: liveContacts, mutate: mutateContacts } = useSWR('/api/crm/contacts', fetcher, {
    fallbackData: initialContacts,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const [contactsList] = useState<Contact[]>(liveContacts || initialContacts);
  const [projectsList] = useState<Project[]>(initialProjects);
  const [dealsList] = useState<Deal[]>(initialDeals);
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "neutral" | "concerned">("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(contactsList[0]?.id || '');
  const [selectedProject, setSelectedProject] = useState(projectsList[0]?.id || '');
  const [selectedDeal, setSelectedDeal] = useState(dealsList[0]?.id || '');
  const [showAIAction, setShowAIAction] = useState(true);
  const [actionState, setActionState] = useState<Record<string, boolean[]>>(
    interactions.reduce((acc, interaction) => {
      acc[interaction.id] = interaction.actionItems.map((item) => item.completed);
      return acc;
    }, {} as Record<string, boolean[]>),
  );
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    return contactsList.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        contact.company.toLowerCase().includes(contactSearch.toLowerCase()) ||
        contact.email.toLowerCase().includes(contactSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
      const matchesSentiment = sentimentFilter === "all" || contact.sentiment === sentimentFilter;
      const matchesCohort =
        cohortFilter === "all" || contact.aiInsight.toLowerCase().includes(cohortFilter.toLowerCase());
      return matchesSearch && matchesStatus && matchesSentiment && matchesCohort;
    });
  }, [contactSearch, statusFilter, sentimentFilter, cohortFilter]);

  const transcribingCount = useMemo(() => interactions.filter((i) => i.status === "transcribing").length, []);
  const currentContact = contactsList.find((c) => c.id === selectedContact);
  const currentProject = projectsList.find((p) => p.id === selectedProject);
  const currentDeal = dealsList.find((d) => d.id === selectedDeal);
  const contactTimeline = useMemo(
    () => interactions.filter((interaction) => interaction.contactId === selectedContact),
    [selectedContact],
  );

  const toggleActionItem = (interactionId: string, index: number) => {
    setActionState((prev) => ({
      ...prev,
      [interactionId]: prev[interactionId].map((value, idx) => (idx === index ? !value : value)),
    }));
  };

  const handleContactDialogSuccess = () => {
    mutateContacts(); // Refresh contact list after create/edit
    setEditingContact(undefined);
  };

  const handleAddContact = () => {
    setEditingContact(undefined);
    setIsContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    // Transform contact data from UI format to API format
    // Note: Contact type has 'name', but API uses firstName/lastName
    const nameParts = contact.name.split(' ');
    const apiContact = {
      id: contact.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: contact.email,
      company: contact.company || '',
      phone: '', // Contact type doesn't have phone, may need to fetch full data
      title: '', // Contact type doesn't have title, may need to fetch full data
      status: contact.status,
    };
    setEditingContact(apiContact as any);
    setIsContactDialogOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const res = await fetch(`/api/crm/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete contact');
      }

      toast.success('Contact deleted successfully');
      mutateContacts(); // Refresh contact list
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      
      // Clear selection if deleted contact was selected
      if (selectedContact === contactToDelete.id) {
        const remainingContacts = contactsList.filter(c => c.id !== contactToDelete.id);
        setSelectedContact(remainingContacts[0]?.id || '');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete contact. Please try again.');
    }
  };

  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50">
      <div className="flex min-h-full">
        {/* Left Sidebar Navigation */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            contactsCount={filteredContacts.length}
            dealsCount={dealsList.length}
          />
        </div>
        
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-xl shadow-soft bg-white"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {!sidebarCollapsed && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarCollapsed(true)} />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`md:hidden fixed left-0 top-0 bottom-0 z-40 transition-transform ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}>
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            contactsCount={filteredContacts.length}
            dealsCount={dealsList.length}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:ml-0">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 md:py-6 flex flex-col gap-4 md:gap-6 min-h-full w-full">
            <CRMHeader transcribingCount={transcribingCount} onRunCommand={setLastCommand} />
            
            <div className="mb-2 hidden md:block">
              <CRMStatsGrid />
            </div>

            <ResizablePanelGroup direction="horizontal" className="gap-4 md:gap-6 flex-1 min-h-[640px] hidden md:flex">
              <ResizablePanel defaultSize={35} minSize={28} className="rounded-2xl shadow-soft border-0 bg-white">
                <LeftPanel
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  contactSearch={contactSearch}
                  onSearchChange={setContactSearch}
                  contacts={filteredContacts}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  sentimentFilter={sentimentFilter}
                  onSentimentFilterChange={setSentimentFilter}
                  cohortFilter={cohortFilter}
                  onCohortFilterChange={setCohortFilter}
                  selectedContact={selectedContact}
                  onSelectContact={setSelectedContact}
                  onEditContact={handleEditContact}
                  onDeleteContact={openDeleteDialog}
                  projects={projectsList}
                  selectedProject={selectedProject}
                  onSelectProject={setSelectedProject}
                  deals={dealsList}
                  onSelectDeal={setSelectedDeal}
                  onAddContact={handleAddContact}
                />
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-transparent w-2" />

              <ResizablePanel defaultSize={70} minSize={40} className="rounded-2xl shadow-soft border-0 bg-white">
                <RightPanel
                  activeTab={activeTab}
                  contact={currentContact}
                  timeline={contactTimeline}
                  actionState={actionState}
                  onToggleAction={toggleActionItem}
                  onEditContact={handleEditContact}
                  onDeleteContact={openDeleteDialog}
                  project={currentProject}
                  deal={currentDeal}
                  lastCommand={lastCommand}
                  showAIAction={showAIAction}
                  setShowAIAction={setShowAIAction}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
            
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-4 md:hidden">
              <div className="rounded-2xl shadow-soft border-0 bg-white p-4">
                <LeftPanel
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  contactSearch={contactSearch}
                  onSearchChange={setContactSearch}
                  contacts={filteredContacts}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  sentimentFilter={sentimentFilter}
                  onSentimentFilterChange={setSentimentFilter}
                  cohortFilter={cohortFilter}
                  onCohortFilterChange={setCohortFilter}
                  selectedContact={selectedContact}
                  onSelectContact={setSelectedContact}
                  onEditContact={handleEditContact}
                  onDeleteContact={openDeleteDialog}
                  projects={projectsList}
                  selectedProject={selectedProject}
                  onSelectProject={setSelectedProject}
                  deals={dealsList}
                  onSelectDeal={setSelectedDeal}
                  onAddContact={handleAddContact}
                />
              </div>
              
              {selectedContact && (
                <div className="rounded-2xl shadow-soft border-0 bg-white">
                  <RightPanel
                    activeTab={activeTab}
                    contact={currentContact}
                    timeline={contactTimeline}
                    actionState={actionState}
                    onToggleAction={toggleActionItem}
                    onEditContact={handleEditContact}
                    onDeleteContact={openDeleteDialog}
                    project={currentProject}
                    deal={currentDeal}
                    lastCommand={lastCommand}
                    showAIAction={showAIAction}
                    setShowAIAction={setShowAIAction}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        contact={editingContact}
        onSuccess={handleContactDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contactToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sidebar Component
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: "contacts" | "projects" | "sales";
  onTabChange: (tab: "contacts" | "projects" | "sales") => void;
  contactsCount: number;
  dealsCount: number;
}

function Sidebar({ collapsed, onToggleCollapse, activeTab, onTabChange, contactsCount, dealsCount }: SidebarProps) {
  return (
    <motion.div
      className="bg-white border-r border-border/40 flex flex-col h-full"
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Desk</span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Deal Flow Section */}
          <div className="space-y-1 mb-4">
            {!collapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deal Flow
              </div>
            )}
            <button
              onClick={() => onTabChange("contacts")}
              className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all ${
                activeTab === "contacts"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Contacts</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-indigo-100 text-indigo-700">
                    {contactsCount}
                  </Badge>
                </>
              )}
            </button>
            <button
              onClick={() => onTabChange("projects")}
              className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all ${
                activeTab === "projects"
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <FolderKanban className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Opportunities</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-amber-100 text-amber-700">
                    1
                  </Badge>
                </>
              )}
            </button>
            <button
              onClick={() => onTabChange("sales")}
              className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all ${
                activeTab === "sales"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <Target className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Deals</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-100 text-green-700">
                    {dealsCount}
                  </Badge>
                </>
              )}
            </button>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/40">
        <Button
          variant="ghost"
          size="icon"
          className={`w-full ${collapsed ? '' : 'justify-start'} h-10 rounded-xl`}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </Button>
      </div>
    </motion.div>
  );
}

interface LeftPanelProps {
  activeTab: "contacts" | "projects" | "sales";
  onTabChange: (tab: "contacts" | "projects" | "sales") => void;
  contactSearch: string;
  onSearchChange: (value: string) => void;
  contacts: Contact[];
  statusFilter: "all" | "hot" | "warm" | "cold";
  onStatusFilterChange: (value: "all" | "hot" | "warm" | "cold") => void;
  sentimentFilter: "all" | "positive" | "neutral" | "concerned";
  onSentimentFilterChange: (value: "all" | "positive" | "neutral" | "concerned") => void;
  cohortFilter: string;
  onCohortFilterChange: (value: string) => void;
  selectedContact: string;
  onSelectContact: (id: string) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  projects: Project[];
  selectedProject: string;
  onSelectProject: (id: string) => void;
  deals: Deal[];
  onSelectDeal: (id: string) => void;
  onAddContact: () => void;
}

function LeftPanel({
  activeTab,
  onTabChange,
  contactSearch,
  onSearchChange,
  contacts,
  statusFilter,
  onStatusFilterChange,
  sentimentFilter,
  onSentimentFilterChange,
  cohortFilter,
  onCohortFilterChange,
  selectedContact,
  onSelectContact,
  onEditContact,
  onDeleteContact,
  projects,
  selectedProject,
  onSelectProject,
  deals,
  onSelectDeal,
  onAddContact,
}: LeftPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-5 py-4 space-y-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "sales" ? "Search deals..." : activeTab === "projects" ? "Search projects..." : "Search contacts..."}
              value={contactSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              disabled={activeTab === "sales"}
              className="pl-10 h-9 rounded-xl border-slate-200 bg-slate-50/70 focus-visible:ring-indigo-500"
            />
          </div>
          {activeTab === "contacts" && (
            <Button
              type="button"
              onClick={onAddContact}
              size="icon"
              className="h-9 w-9 rounded-xl bg-indigo-500 text-white shadow-soft border border-indigo-400/50 hover:bg-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-300"
              aria-label="Add contact"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {activeTab === "contacts" && (
          <div className="flex flex-wrap gap-2">
            {["all", ...quickFilters].map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 rounded-full text-xs transition-all ${
                  statusFilter === filter 
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-soft' 
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => onStatusFilterChange(filter as "all" | "hot" | "warm" | "cold")}
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {activeTab === "contacts" && (
          <div className="px-4 py-4 space-y-3">
            {contacts.map((contact) => {
              const gradient = gradients[(parseInt(contact.id, 10) - 1) % gradients.length];
              return (
                <Card
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className={`p-4 border-0 shadow-soft cursor-pointer transition-all rounded-2xl ${
                    selectedContact === contact.id 
                      ? "bg-indigo-50/50 shadow-soft-hover ring-2 ring-indigo-200/50" 
                      : "bg-white hover:shadow-soft-hover"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className={`h-12 w-12 ring-2 ring-offset-2 ring-white ${gradient.ring}`}>
                        <AvatarFallback className={`bg-gradient-to-br ${gradient.bg} text-white text-base font-semibold`}>
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                          contact.status === "hot" ? "bg-soft-red" : 
                          contact.status === "warm" ? "bg-soft-amber" : 
                          "bg-soft-cold"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.company}</p>
                        </div>
                        <Badge 
                          className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 border-purple-100 rounded-full flex items-center gap-1 flex-shrink-0"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {contact.aiHealthScore}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{contact.lastContact}</span>
                        <span className="font-semibold text-slate-900">{contact.value}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {contacts.length === 0 && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-muted-foreground">No contacts match filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="px-5 py-4 space-y-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selectedProject === project.id 
                    ? "border-purple-200 bg-purple-50/30 shadow-sm" 
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{project.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                  </div>
                  <Badge variant="outline" className="rounded-md border-slate-200 text-xs capitalize px-2.5 py-0.5">
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === "sales" && (
          <div className="p-3">
            <SalesKanban deals={deals} onSelectDeal={onSelectDeal} />
          </div>
        )}
      </ScrollArea>

    </div>
  );
}

interface RightPanelProps {
  activeTab: "contacts" | "projects" | "sales";
  contact?: Contact;
  timeline: Interaction[];
  actionState: Record<string, boolean[]>;
  onToggleAction: (interactionId: string, index: number) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  project?: Project;
  deal?: Deal;
  lastCommand: string | null;
  showAIAction: boolean;
  setShowAIAction: (show: boolean) => void;
}

function RightPanel({ 
  activeTab, 
  contact, 
  timeline, 
  actionState, 
  onToggleAction, 
  onEditContact,
  onDeleteContact,
  project, 
  deal, 
  lastCommand, 
  showAIAction, 
  setShowAIAction 
}: RightPanelProps) {
  if (activeTab === "projects" && project) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <ProjectHeader project={project} />
        <ScrollArea className="flex-1">
          <ProjectOverview project={project} />
        </ScrollArea>
      </div>
    );
  }

  if (activeTab === "sales" && deal) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <DealHeader deal={deal} />
        <ScrollArea className="flex-1">
          <DealDetails deal={deal} />
        </ScrollArea>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3 text-center px-6">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-medium text-slate-900">No Contact Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Select a contact from the list to view details, AI insights, and interaction history.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Contact Header with Edit/Delete */}
      <div className="border-b border-border/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 border-2 border-white ring-2 ring-indigo-200/50">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                  contact.status === 'hot' ? 'bg-soft-red' : 
                  contact.status === 'warm' ? 'bg-soft-amber' : 
                  'bg-soft-cold'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {contact.name}
                </h1>
                <Badge variant="outline" className={`text-xs font-medium rounded-full ${statusColors[contact.status]}`}>
                  {contact.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {contact.company}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {contact.email}
                </div>
              </div>
              {/* Subtle AI Health Score */}
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 border-purple-100 rounded-full flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Health: {contact.aiHealthScore}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditContact(contact)}
              className="h-9 rounded-xl"
              aria-label="Edit contact"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 rounded-xl" aria-label="More options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => onEditContact(contact)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteContact(contact)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Tabbed Content Area */}
      <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/40 px-5 pt-4">
          <TabsList className="bg-slate-50 rounded-xl p-1">
            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Activity
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Details
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Opportunities
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <TabsContent value="activity" className="space-y-6 mt-0">
              {/* Subtle AI Next Action Suggestion */}
              <AnimatePresence>
                {contact.nextAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 bg-purple-50/50 border-purple-100 rounded-2xl border-0 shadow-soft">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            Suggested: {contact.nextAction}
                          </p>
                          <p className="text-xs text-purple-600">AI confidence: 94%</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h3 className="font-medium text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Interaction History
                </h3>
                <InteractionTimeline interactions={timeline} actionState={actionState} onToggleAction={onToggleAction} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-0">
              {/* Contact Details with Inline AI Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-0 shadow-soft rounded-2xl">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-slate-900">{contact.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company</p>
                      <p className="font-medium text-slate-900">{contact.company}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Value</p>
                      <p className="font-medium text-slate-900">{contact.value}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-0 shadow-soft rounded-2xl bg-purple-50/30 border-purple-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Insights
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Interaction</p>
                      <p className="font-medium text-slate-900">"{contact.aiInsight}"</p>
                      <p className="text-xs text-muted-foreground mt-1">{contact.lastContact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interactions (30 days)</p>
                      <p className="font-medium text-slate-900">{contact.interactions} touchpoints</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Smart Tags */}
              <Card className="p-4 border-0 shadow-soft rounded-2xl">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    High Priority
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                    Budget Approved
                  </Badge>
                  {contact.sentiment && (
                    <Badge variant="outline" className={`text-xs ${
                      contact.sentiment === 'positive' ? 'bg-green-50 border-green-200 text-green-700' :
                      contact.sentiment === 'concerned' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {contact.sentiment}
                    </Badge>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-6 mt-0">
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No opportunities yet</p>
                <p className="text-xs mt-1">Create an opportunity to track deals for this contact</p>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ... (Keep existing Project/Deal subcomponents: ProjectHeader, ProjectOverview, DealHeader, DealDetails)
function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="border-b border-border/60 p-6">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20">
          <Target className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              <p className="text-sm text-muted-foreground">{project.client}</p>
            </div>
            <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize">
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Project Progress</span>
              <span className="text-slate-500">{project.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectOverview({ project }: { project: Project }) {
  return (
    <div className="space-y-6 p-6">
      <Card className="p-5 border-0 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 text-sm font-medium text-slate-900">Team Members</h3>
        <div className="flex -space-x-3">
          {project.team.map((initials) => (
            <Avatar key={initials} className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          ))}
           <button className="h-9 w-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 bg-white transition-colors -ml-1 relative z-10">
            <span className="sr-only">Add member</span>
            <Users className="w-4 h-4" />
          </button>
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-medium text-slate-900">Active Tasks</h3>
           <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">View All</Button>
        </div>
        <div className="space-y-3">
          {project.tasks.map((task) => (
            <div key={task.id} className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:border-slate-200 transition-all">
              <div
                className={`mt-1 h-2 w-2 rounded-full flex-none ${
                  task.status === "completed" ? "bg-green-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-slate-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-700"}`}>{task.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {task.dueDate}
                  </p>
                  <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] h-5 capitalize bg-white border border-slate-100">
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              <Avatar className="h-6 w-6 border border-white shadow-sm flex-none">
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">{task.assignee}</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 text-sm font-medium text-slate-900">Recent Updates</h3>
        <div className="space-y-4">
          {project.updates.map((update) => (
            <div key={update.id} className="flex gap-3">
               <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-medium">{update.author}</AvatarFallback>
               </Avatar>
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900">{update.author}</span>
                    <span className="text-xs text-slate-400">{update.date}</span>
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-r-xl rounded-bl-xl">
                    {update.content}
                  </div>
               </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DealHeader({ deal }: { deal: Deal }) {
  return (
    <div className="border-b border-border/60 p-6 space-y-3">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/20">
          <Target className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{deal.title}</h2>
              <p className="text-sm text-muted-foreground">{deal.company}</p>
            </div>
            <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 capitalize">
              {deal.stage}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Deal Value</p>
                <p className="font-semibold text-slate-900">{deal.value}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Win Probability</p>
                <p className="font-semibold text-slate-900">{deal.probability}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealDetails({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6 p-6">
      <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600 mt-1">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">AI Insight</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {deal.aiRisk === "low"
                ? "Momentum is strong. Consider sending a recap and next steps to secure sign-off."
                : deal.aiRisk === "medium"
                  ? "Engagement has slowed. Suggest offering a short workshop to re-energize stakeholders."
                  : "This deal is stalling. Recommend executive outreach and refreshed value messaging."}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 text-sm font-medium text-slate-900 flex items-center gap-2">
           <CheckCircle2 className="w-4 h-4 text-slate-400" />
           Recommended Next Steps
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500 transition-colors" />
            <span className="text-sm text-slate-600 group-hover:text-slate-900">Send personalized follow-up email</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
             <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500 transition-colors" />
            <span className="text-sm text-slate-600 group-hover:text-slate-900">Schedule product deep-dive for technical team</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
             <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500 transition-colors" />
            <span className="text-sm text-slate-600 group-hover:text-slate-900">Share competitor comparison + ROI stats</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
