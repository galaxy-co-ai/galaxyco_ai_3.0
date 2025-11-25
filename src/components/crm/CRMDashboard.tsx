"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Building2,
  Users,
  TrendingUp,
  ArrowUpRight,
  Mail,
  Phone,
  Sparkles,
  Target,
  Filter,
  Calendar,
  MessageSquare,
  FileText,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LeadsTable from "./LeadsTable";
import OrganizationsTable from "./OrganizationsTable";
import ContactsTable from "./ContactsTable";
import DealsTable from "./DealsTable";
import LeadDetailView from "./LeadDetailView";
import OrganizationDetailView from "./OrganizationDetailView";
import ContactDetailView from "./ContactDetailView";
import InsightsTab from "./InsightsTab";
import AutomationsTab from "./AutomationsTab";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title?: string;
  phone?: string;
  stage: string;
  score: number;
  estimatedValue: number;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  interactionCount: number;
  source?: string;
  tags: string[];
  notes?: string;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  status: string;
  industry?: string;
  size?: string;
  revenue: number;
  tags: string[];
  notes?: string;
  lastContactedAt: Date | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  tags: string[];
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: Date | null;
  source?: string;
  tags: string[];
  notes?: string;
}

interface CRMDashboardProps {
  initialLeads: Lead[];
  initialOrganizations: Organization[];
  initialContacts: Contact[];
  initialDeals: Deal[];
  initialTab?: TabType;
  stats: {
    totalLeads: number;
    hotLeads: number;
    totalOrgs: number;
    totalValue: number;
  };
}

type TabType = 'leads' | 'organizations' | 'contacts' | 'deals' | 'insights' | 'automations';

export default function CRMDashboard({
  initialLeads,
  initialOrganizations,
  initialContacts,
  initialDeals,
  initialTab = 'leads',
  stats,
}: CRMDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dealStageFilter, setDealStageFilter] = useState<string>("all");
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    company: "",
    title: "",
    phone: "",
    stage: "new",
    estimatedValue: "",
    source: "",
    notes: "",
  });
  const [showAddOrgDialog, setShowAddOrgDialog] = useState(false);
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    website: "",
    status: "active",
    industry: "",
    size: "",
    revenue: "",
    notes: "",
  });
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    phone: "",
  });
  const [showAddDealDialog, setShowAddDealDialog] = useState(false);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [newDeal, setNewDeal] = useState({
    title: "",
    company: "",
    value: "",
    stage: "new",
    probability: "50",
    closeDate: "",
    source: "",
    notes: "",
  });

  // Update leads when initialLeads changes (from server refresh)
  useEffect(() => {
    setLeads(prevLeads => {
      const existingMap = new Map(prevLeads.map(lead => [lead.id, lead]));
      const merged = initialLeads.map(serverLead => existingMap.get(serverLead.id) || serverLead);
      const localOnly = prevLeads.filter(lead => !initialLeads.some(sl => sl.id === lead.id));
      return Array.from(new Map([...merged, ...localOnly].map(l => [l.id, l])).values());
    });
  }, [initialLeads]);

  // Update organizations when initialOrganizations changes
  useEffect(() => {
    setOrganizations(prevOrgs => {
      const existingMap = new Map(prevOrgs.map(org => [org.id, org]));
      const merged = initialOrganizations.map(serverOrg => existingMap.get(serverOrg.id) || serverOrg);
      const localOnly = prevOrgs.filter(org => !initialOrganizations.some(so => so.id === org.id));
      return Array.from(new Map([...merged, ...localOnly].map(o => [o.id, o])).values());
    });
  }, [initialOrganizations]);

  // Update contacts when initialContacts changes
  useEffect(() => {
    setContacts(prevContacts => {
      const existingMap = new Map(prevContacts.map(contact => [contact.id, contact]));
      const merged = initialContacts.map(serverContact => existingMap.get(serverContact.id) || serverContact);
      const localOnly = prevContacts.filter(contact => !initialContacts.some(sc => sc.id === contact.id));
      return Array.from(new Map([...merged, ...localOnly].map(c => [c.id, c])).values());
    });
  }, [initialContacts]);

  // Update deals when initialDeals changes
  useEffect(() => {
    setDeals(prevDeals => {
      const existingMap = new Map(prevDeals.map(deal => [deal.id, deal]));
      const merged = initialDeals.map(serverDeal => existingMap.get(serverDeal.id) || serverDeal);
      const localOnly = prevDeals.filter(deal => !initialDeals.some(sd => sd.id === deal.id));
      return Array.from(new Map([...merged, ...localOnly].map(d => [d.id, d])).values());
    });
  }, [initialDeals]);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.company.toLowerCase().includes(query) ||
          lead.title?.toLowerCase().includes(query)
      );
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter((lead) => lead.stage === stageFilter);
    }

    return filtered;
  }, [leads, searchQuery, stageFilter]);

  const filteredOrganizations = useMemo(() => {
    let filtered = organizations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.email?.toLowerCase().includes(query) ||
          org.company?.toLowerCase().includes(query) ||
          org.industry?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((org) => org.status === statusFilter);
    }

    return filtered;
  }, [organizations, searchQuery, statusFilter]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.firstName.toLowerCase().includes(query) ||
          contact.lastName.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [contacts, searchQuery]);

  const filteredDeals = useMemo(() => {
    let filtered = deals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (deal) =>
          deal.title.toLowerCase().includes(query) ||
          deal.company.toLowerCase().includes(query)
      );
    }

    if (dealStageFilter !== "all") {
      filtered = filtered.filter((deal) => deal.stage === dealStageFilter);
    }

    return filtered;
  }, [deals, searchQuery, dealStageFilter]);

  const selectedLeadData = useMemo(
    () => leads.find((l) => l.id === selectedLead) || null,
    [leads, selectedLead]
  );

  const selectedOrgData = useMemo(
    () => organizations.find((o) => o.id === selectedOrg) || null,
    [organizations, selectedOrg]
  );

  const selectedContactData = useMemo(
    () => contacts.find((c) => c.id === selectedContact) || null,
    [contacts, selectedContact]
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/crm/prospects/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete lead' }));
        throw new Error(errorData.error || `Failed to delete lead: ${response.status}`);
      }

      // Optimistically remove from list
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      
      // Clear selection if this was the selected lead
      if (selectedLead === leadId) {
        setSelectedLead(null);
      }

      toast.success('Lead deleted successfully');

      // Refresh server data after a delay
      setTimeout(async () => {
        try {
          const response = await fetch('/api/crm/prospects');
          if (response.ok) {
            const fresh = await response.json();
            const transformed = fresh.map((lead: any) => ({
              id: lead.id,
              name: lead.name,
              email: lead.email || '',
              company: lead.company || '',
              title: lead.title,
              phone: lead.phone,
              stage: lead.stage,
              score: lead.score || 0,
              estimatedValue: lead.estimatedValue || 0,
              lastContactedAt: lead.lastContactedAt,
              nextFollowUpAt: lead.nextFollowUpAt,
              interactionCount: lead.interactionCount || 0,
              source: lead.source,
              tags: lead.tags || [],
              notes: lead.notes,
            }));
            setLeads(transformed);
          }
        } catch (error) {
          console.error('Failed to refresh leads:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete lead. Please try again.');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete contact' }));
        throw new Error(errorData.error || `Failed to delete contact: ${response.status}`);
      }

      // Optimistically remove from list
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      
      // Clear selection if this was the selected contact
      if (selectedContact === contactId) {
        setSelectedContact(null);
      }

      toast.success('Contact deleted successfully');

      // Refresh server data after a delay
      setTimeout(async () => {
        try {
          const response = await fetch('/api/crm/contacts');
          if (response.ok) {
            const fresh = await response.json();
            const transformed = fresh.map((contact: any) => ({
              id: contact.id,
              firstName: contact.firstName || '',
              lastName: contact.lastName || '',
              email: contact.email,
              company: contact.company || '',
              title: contact.title,
              phone: contact.phone,
              tags: contact.tags || [],
            }));
            setContacts(transformed);
          }
        } catch (error) {
          console.error('Failed to refresh contacts:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete contact. Please try again.');
    }
  };

  // Stat badges
  const statBadges = [
    { label: `${stats.totalLeads} Total Leads`, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: `${stats.hotLeads} Hot Leads`, icon: TrendingUp, color: "bg-red-100 text-red-700" },
    { label: `${stats.totalOrgs} Organizations`, icon: Building2, color: "bg-purple-100 text-purple-700" },
    { label: `${formatCurrency(stats.totalValue)} Pipeline`, icon: ArrowUpRight, color: "bg-green-100 text-green-700" },
  ];

  // Tab configuration
  const tabs = [
    { id: 'leads' as TabType, label: 'Leads', icon: Users, badge: stats.totalLeads.toString(), badgeColor: 'bg-blue-500', activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'organizations' as TabType, label: 'Organizations', icon: Building2, badge: stats.totalOrgs.toString(), badgeColor: 'bg-purple-500', activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Mail, activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'deals' as TabType, label: 'Deals', icon: Target, activeColor: 'bg-green-100 text-green-700' },
    { id: 'insights' as TabType, label: 'Insights', icon: Sparkles, activeColor: 'bg-indigo-100 text-indigo-700' },
    { id: 'automations' as TabType, label: 'Automations', icon: Zap, activeColor: 'bg-orange-100 text-orange-700' },
  ];

  // Quick actions for CRM
  const quickActions = [
    { 
      icon: Mail, 
      iconColor: 'bg-blue-100 text-blue-600',
      title: "Auto-respond to 12 emails", 
      subtitle: "Save ~45 min • Drafts ready for review" 
    },
    { 
      icon: Target, 
      iconColor: 'bg-purple-100 text-purple-600',
      title: "Score and prioritize 5 new leads", 
      subtitle: "AI confidence: High • Ready to assign" 
    },
    { 
      icon: FileText, 
      iconColor: 'bg-green-100 text-green-600',
      title: "Generate meeting brief for 3pm call", 
      subtitle: "TechCorp • Context from 8 sources" 
    },
    { 
      icon: Building2, 
      iconColor: 'bg-blue-100 text-blue-600',
      title: "Sync 24 contacts to Salesforce", 
      subtitle: "Updated data • Resolve duplicates" 
    },
    { 
      icon: Calendar, 
      iconColor: 'bg-orange-100 text-orange-600',
      title: "Create daily action digest", 
      subtitle: "Top 10 priorities • Morning summary" 
    },
  ];

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden">
      {/* Header Section - Matching Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground text-base">
            Manage your leads, organizations, and customer relationships.
          </p>

          {/* Stat Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {statBadges.map((stat, index) => (
              <Badge 
                key={index}
                className={`${stat.color} px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Floating Tab Bar - Matching Dashboard */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge 
                    className={`${activeTab === tab.id ? 'bg-white/90 text-gray-700' : tab.badgeColor + ' text-white'} text-xs px-1.5 py-0 h-5 min-w-[20px]`}
                  >
                    {tab.badge}
                  </Badge>
                )}
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
          className="max-w-7xl mx-auto px-6"
        >
          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Leads List */}
                <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Leads</h3>
                          <p className="text-[13px] text-blue-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            {filteredLeads.length} leads
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => setShowAddLeadDialog(true)}
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                        aria-label="Add lead"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white dark:bg-card"
                        aria-label="Search leads"
                      />
                    </div>

                    {/* Filters - Tab Bar */}
                    <div className="mt-3">
                      <Tabs value={stageFilter} onValueChange={setStageFilter}>
                        <TabsList className="bg-background/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm p-0.5 h-6 w-full justify-start">
                          {["all", "new", "cold", "warm", "hot", "closed", "lost"].map(
                            (stage) => (
                              <TabsTrigger
                                key={stage}
                                value={stage}
                                className="text-xs px-2.5 py-0 h-5 rounded-full leading-none flex-none data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:h-5"
                              >
                                {stage.charAt(0).toUpperCase() + stage.slice(1)}
                              </TabsTrigger>
                            )
                          )}
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Leads List */}
                  <div className="flex-1 overflow-y-auto">
                    <LeadsTable
                      leads={filteredLeads}
                      selectedId={selectedLead}
                      onSelect={setSelectedLead}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>

                {/* Right: Lead Detail View */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {selectedLeadData ? (
                    <div className="flex-1 overflow-y-auto">
                      <LeadDetailView 
                        lead={selectedLeadData} 
                        formatDate={formatDate} 
                        formatCurrency={formatCurrency}
                        onDelete={handleDeleteLead}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center max-w-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Select a lead</h3>
                        <p className="text-sm text-gray-500">
                          Choose a lead from the list to view detailed information, contact history, and AI insights.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* ORGANIZATIONS TAB */}
          {activeTab === 'organizations' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Organizations List */}
                <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Organizations</h3>
                          <p className="text-[13px] text-purple-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                            {filteredOrganizations.length} organizations
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => setShowAddOrgDialog(true)}
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                        aria-label="Add organization"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white dark:bg-card"
                        aria-label="Search organizations"
                      />
                    </div>

                    {/* Filters - Tab Bar */}
                    <div className="mt-3">
                      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList className="bg-background/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm p-0.5 h-6 w-full justify-start">
                          {["all", "lead", "customer", "partner", "inactive"].map((status) => (
                            <TabsTrigger
                              key={status}
                              value={status}
                              className="text-xs px-2.5 py-0 h-5 rounded-full leading-none flex-none data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm data-[state=active]:h-5"
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Organizations List */}
                  <div className="flex-1 overflow-y-auto">
                    <OrganizationsTable
                      organizations={filteredOrganizations}
                      selectedId={selectedOrg}
                      onSelect={setSelectedOrg}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>

                {/* Right: Organization Detail View */}
                <div className="space-y-6">
                  {selectedOrgData ? (
                    <div className="p-4 rounded-lg border bg-white">
                      <OrganizationDetailView
                        organization={selectedOrgData}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center px-6">
                      <div>
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Select an organization</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Choose from the list to view details and AI insights
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Contacts List */}
                <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-cyan-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Contacts</h3>
                          <p className="text-[13px] text-cyan-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                            {filteredContacts.length} contacts
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => setShowAddContactDialog(true)}
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                        aria-label="Add contact"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white dark:bg-card"
                        aria-label="Search contacts"
                      />
                    </div>
                  </div>

                  {/* Contacts List */}
                  <div className="flex-1 overflow-y-auto">
                    <ContactsTable
                      contacts={filteredContacts}
                      selectedId={selectedContact}
                      onSelect={setSelectedContact}
                    />
                  </div>
                </div>

                {/* Right: Contact Detail View */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {selectedContactData ? (
                    <div className="flex-1 overflow-y-auto">
                      <ContactDetailView 
                        contact={selectedContactData} 
                        formatDate={formatDate}
                        onDelete={handleDeleteContact}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center max-w-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Mail className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Select a contact</h3>
                        <p className="text-sm text-gray-500">
                          Choose a contact from the list to view detailed information and contact history.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* DEALS TAB */}
          {activeTab === 'deals' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Deals List */}
                <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Deals</h3>
                          <p className="text-[13px] text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {filteredDeals.length} deals
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => setShowAddDealDialog(true)}
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                        aria-label="Add deal"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search deals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white dark:bg-card"
                        aria-label="Search deals"
                      />
                    </div>

                    {/* Filters - Tab Bar */}
                    <div className="mt-3">
                      <Tabs value={dealStageFilter} onValueChange={setDealStageFilter}>
                        <TabsList className="bg-background/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm p-0.5 h-6 w-full justify-start">
                          {["all", "new", "qualified", "proposal", "negotiation", "won", "lost", "closed"].map((stage) => (
                            <TabsTrigger
                              key={stage}
                              value={stage}
                              className="text-xs px-2.5 py-0 h-5 rounded-full leading-none flex-none data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:h-5"
                            >
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="flex-1 overflow-y-auto">
                    <DealsTable
                      deals={filteredDeals}
                      selectedId={selectedDeal}
                      onSelect={setSelectedDeal}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>

                {/* Right: Deal Detail View */}
                <div className="space-y-6">
                  {selectedDeal ? (
                    <div className="p-4 rounded-lg border bg-white">
                      <p className="text-sm text-muted-foreground">Deal detail view coming soon</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center px-6">
                      <div>
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Select a deal</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Choose from the list to view details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <InsightsTab
              leads={initialLeads}
              organizations={initialOrganizations}
              deals={initialDeals}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {/* AUTOMATIONS TAB */}
          {activeTab === 'automations' && (
            <AutomationsTab />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead's information to add them to your CRM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Full Name *</Label>
                  <Input
                    id="lead-name"
                    placeholder="John Doe"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="john@example.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-company">Company</Label>
                  <Input
                    id="lead-company"
                    placeholder="Acme Inc."
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    placeholder="123-456-7890"
                    value={newLead.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setNewLead({ ...newLead, phone: formatted });
                    }}
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Lead Details</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lead-stage">Stage</Label>
                  <select
                    id="lead-stage"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    value={newLead.stage}
                    onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-value">Estimated Value</Label>
                  <Input
                    id="lead-value"
                    type="number"
                    placeholder="50000"
                    value={newLead.estimatedValue}
                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddLeadDialog(false);
                  setNewLead({
                    name: "",
                    email: "",
                    company: "",
                    title: "",
                    phone: "",
                    stage: "new",
                    estimatedValue: "",
                    source: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newLead.name || !newLead.email) {
                    toast.error("Please fill in required fields (Name and Email)");
                    return;
                  }

                  setIsAddingLead(true);
                  try {
                    const response = await fetch('/api/crm/prospects', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: newLead.name,
                        email: newLead.email,
                        company: newLead.company || undefined,
                        title: newLead.title || undefined,
                        phone: newLead.phone || undefined,
                        stage: newLead.stage || 'new',
                        estimatedValue: newLead.estimatedValue ? parseFloat(newLead.estimatedValue) : undefined,
                        source: newLead.source || undefined,
                        notes: newLead.notes || undefined,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Failed to create lead' }));
                      throw new Error(errorData.error || `Failed to create lead: ${response.status}`);
                    }

                    const createdLead = await response.json();

                    // Optimistically update the leads list
                    const newLeadData: Lead = {
                      id: createdLead.id,
                      name: createdLead.name,
                      email: createdLead.email || '',
                      company: createdLead.company || '',
                      title: createdLead.title,
                      phone: createdLead.phone,
                      stage: createdLead.stage,
                      score: 0,
                      estimatedValue: createdLead.estimatedValue || 0,
                      lastContactedAt: null,
                      nextFollowUpAt: null,
                      interactionCount: 0,
                      source: createdLead.source,
                      tags: createdLead.tags || [],
                      notes: createdLead.notes,
                    };

                    // Optimistically update the leads list immediately
                    setLeads([newLeadData, ...leads]);
                    toast.success(`Lead "${newLead.name}" added successfully!`);
                    setShowAddLeadDialog(false);
                    setNewLead({
                      name: "",
                      email: "",
                      company: "",
                      title: "",
                      phone: "",
                      stage: "new",
                      estimatedValue: "",
                      source: "",
                      notes: "",
                    });

                    // Refresh server data after a delay to allow DB commit and cache invalidation
                    // Use a longer delay to ensure the database transaction is fully committed
                    setTimeout(async () => {
                      try {
                        // Fetch fresh leads from the API instead of full page refresh
                        const response = await fetch('/api/crm/prospects');
                        if (response.ok) {
                          const freshLeads = await response.json();
                          // Transform to match Lead interface
                          const transformedLeads: Lead[] = freshLeads.map((lead: any) => ({
                            id: lead.id,
                            name: lead.name,
                            email: lead.email || '',
                            company: lead.company || '',
                            title: lead.title,
                            phone: lead.phone,
                            stage: lead.stage,
                            score: lead.score || 0,
                            estimatedValue: lead.estimatedValue || 0,
                            lastContactedAt: lead.lastContactedAt,
                            nextFollowUpAt: lead.nextFollowUpAt,
                            interactionCount: lead.interactionCount || 0,
                            source: lead.source,
                            tags: lead.tags || [],
                            notes: lead.notes,
                          }));
                          // Merge with existing leads, preserving the new one
                          setLeads(prevLeads => {
                            const existingMap = new Map(prevLeads.map(l => [l.id, l]));
                            const merged = transformedLeads.map(serverLead => 
                              existingMap.get(serverLead.id) || serverLead
                            );
                            // Add any leads that exist locally but not in server data
                            const localOnly = prevLeads.filter(lead => 
                              !transformedLeads.some((sl: Lead) => sl.id === lead.id)
                            );
                            return [...merged, ...localOnly];
                          });
                        }
                      } catch (error) {
                        console.error('Failed to refresh leads:', error);
                        // Don't show error to user - optimistic update already succeeded
                      }
                    }, 2000);
                  } catch (error) {
                    console.error('Failed to create lead:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to create lead. Please try again.';
                    toast.error(errorMessage);
                  } finally {
                    setIsAddingLead(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isAddingLead}
              >
                {isAddingLead ? 'Adding...' : 'Add Lead'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Organization Dialog */}
      <Dialog open={showAddOrgDialog} onOpenChange={setShowAddOrgDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogDescription>
              Enter the organization's information to add them to your CRM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    placeholder="Acme Corporation"
                    value={newOrganization.name}
                    onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="contact@acme.com"
                    value={newOrganization.email}
                    onChange={(e) => setNewOrganization({ ...newOrganization, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    placeholder="123-456-7890"
                    value={newOrganization.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setNewOrganization({ ...newOrganization, phone: formatted });
                    }}
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Organization Details</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="org-status">Status</Label>
                  <select
                    id="org-status"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    value={newOrganization.status}
                    onChange={(e) => setNewOrganization({ ...newOrganization, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-industry">Industry</Label>
                  <Input
                    id="org-industry"
                    placeholder="Technology, Healthcare, etc."
                    value={newOrganization.industry}
                    onChange={(e) => setNewOrganization({ ...newOrganization, industry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddOrgDialog(false);
                  setNewOrganization({
                    name: "",
                    email: "",
                    company: "",
                    phone: "",
                    website: "",
                    status: "active",
                    industry: "",
                    size: "",
                    revenue: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newOrganization.name) {
                    toast.error("Please fill in the organization name");
                    return;
                  }

                  setIsAddingOrg(true);
                  try {
                    const response = await fetch('/api/crm/customers', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newOrganization.name,
                        email: newOrganization.email || undefined,
                        phone: newOrganization.phone || undefined,
                        company: newOrganization.company || undefined,
                        website: newOrganization.website || undefined,
                        status: newOrganization.status === 'active' ? 'active' : 
                                newOrganization.status === 'customer' ? 'customer' :
                                newOrganization.status === 'prospect' ? 'prospect' :
                                newOrganization.status === 'partner' ? 'partner' : 'lead',
                        industry: newOrganization.industry || undefined,
                        size: newOrganization.size || undefined,
                        revenue: newOrganization.revenue ? parseFloat(newOrganization.revenue) : undefined,
                        notes: newOrganization.notes || undefined,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Failed to create organization' }));
                      throw new Error(errorData.error || `Failed to create organization: ${response.status}`);
                    }

                    const created = await response.json();
                    const newOrgData: Organization = {
                      id: created.id,
                      name: created.name,
                      email: created.email || '',
                      company: created.company || '',
                      phone: created.phone || '',
                      website: created.website || '',
                      status: created.status,
                      industry: created.industry,
                      size: created.size,
                      revenue: created.revenue || 0,
                      tags: created.tags || [],
                      notes: created.notes,
                      lastContactedAt: created.lastContactedAt,
                    };

                    setOrganizations([newOrgData, ...organizations]);
                    toast.success(`Organization "${newOrganization.name}" added successfully!`);
                    setShowAddOrgDialog(false);
                    setNewOrganization({
                      name: "",
                      email: "",
                      company: "",
                      phone: "",
                      website: "",
                      status: "active",
                      industry: "",
                      size: "",
                      revenue: "",
                      notes: "",
                    });

                    setTimeout(async () => {
                      try {
                        const response = await fetch('/api/crm/customers');
                        if (response.ok) {
                          const fresh = await response.json();
                          const transformed = fresh.map((org: any) => ({
                            id: org.id,
                            name: org.name,
                            email: org.email || '',
                            company: org.company || '',
                            phone: org.phone || '',
                            website: org.website || '',
                            status: org.status,
                            industry: org.industry,
                            size: org.size,
                            revenue: org.revenue || 0,
                            tags: org.tags || [],
                            notes: org.notes,
                            lastContactedAt: org.lastContactedAt,
                          }));
                          setOrganizations(prev => {
                            const map = new Map(prev.map(o => [o.id, o]));
                            const merged = transformed.map((so: Organization) => map.get(so.id) || so);
                            const localOnly = prev.filter(o => !transformed.some((so: Organization) => so.id === o.id));
                            return [...merged, ...localOnly];
                          });
                        }
                      } catch (error) {
                        console.error('Failed to refresh organizations:', error);
                      }
                    }, 2000);
                  } catch (error) {
                    console.error('Failed to create organization:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to create organization. Please try again.');
                  } finally {
                    setIsAddingOrg(false);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isAddingOrg}
              >
                {isAddingOrg ? 'Adding...' : 'Add Organization'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the contact's information to add them to your CRM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="contact-firstname">First Name *</Label>
                  <Input
                    id="contact-firstname"
                    placeholder="John"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-lastname">Last Name *</Label>
                  <Input
                    id="contact-lastname"
                    placeholder="Doe"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Professional Information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="contact-company">Company</Label>
                  <Input
                    id="contact-company"
                    placeholder="Acme Inc."
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="123-456-7890"
                    value={newContact.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setNewContact({ ...newContact, phone: formatted });
                    }}
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddContactDialog(false);
                  setNewContact({
                    firstName: "",
                    lastName: "",
                    email: "",
                    company: "",
                    title: "",
                    phone: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newContact.firstName || !newContact.lastName || !newContact.email) {
                    toast.error("Please fill in required fields (First Name, Last Name, and Email)");
                    return;
                  }

                  setIsAddingContact(true);
                  try {
                    const response = await fetch('/api/crm/contacts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        firstName: newContact.firstName,
                        lastName: newContact.lastName,
                        email: newContact.email,
                        company: newContact.company || undefined,
                        title: newContact.title || undefined,
                        phone: newContact.phone || undefined,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Failed to create contact' }));
                      throw new Error(errorData.error || `Failed to create contact: ${response.status}`);
                    }

                    const created = await response.json();
                    const newContactData: Contact = {
                      id: created.id,
                      firstName: created.firstName,
                      lastName: created.lastName,
                      email: created.email,
                      company: created.company,
                      title: created.title,
                      phone: created.phone,
                      tags: created.tags || [],
                    };

                    setContacts([newContactData, ...contacts]);
                    toast.success(`Contact "${newContact.firstName} ${newContact.lastName}" added successfully!`);
                    setShowAddContactDialog(false);
                    setNewContact({
                      firstName: "",
                      lastName: "",
                      email: "",
                      company: "",
                      title: "",
                      phone: "",
                    });

                    setTimeout(async () => {
                      try {
                        const response = await fetch('/api/crm/contacts');
                        if (response.ok) {
                          const fresh = await response.json();
                          const transformed = fresh.map((contact: any) => ({
                            id: contact.id,
                            firstName: contact.firstName || '',
                            lastName: contact.lastName || '',
                            email: contact.email,
                            company: contact.company || '',
                            title: contact.title,
                            phone: contact.phone,
                            tags: contact.tags || [],
                          }));
                          setContacts(prev => {
                            const map = new Map(prev.map(c => [c.id, c]));
                            const merged = transformed.map((sc: Contact) => map.get(sc.id) || sc);
                            const localOnly = prev.filter(c => !transformed.some((sc: Contact) => sc.id === c.id));
                            return [...merged, ...localOnly];
                          });
                        }
                      } catch (error) {
                        console.error('Failed to refresh contacts:', error);
                      }
                    }, 2000);
                  } catch (error) {
                    console.error('Failed to create contact:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to create contact. Please try again.');
                  } finally {
                    setIsAddingContact(false);
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
                disabled={isAddingContact}
              >
                {isAddingContact ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={showAddDealDialog} onOpenChange={setShowAddDealDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>
              Enter the deal's information to add it to your pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Deal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Deal Information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="deal-title">Deal Title *</Label>
                  <Input
                    id="deal-title"
                    placeholder="Q4 Enterprise License"
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-company">Company *</Label>
                  <Input
                    id="deal-company"
                    placeholder="Acme Corporation"
                    value={newDeal.company}
                    onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-value">Deal Value *</Label>
                  <Input
                    id="deal-value"
                    type="number"
                    placeholder="100000"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Deal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Deal Details</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="deal-stage">Stage</Label>
                  <select
                    id="deal-stage"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed">Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-probability">Win Probability (%)</Label>
                  <Input
                    id="deal-probability"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDealDialog(false);
                  setNewDeal({
                    title: "",
                    company: "",
                    value: "",
                    stage: "new",
                    probability: "50",
                    closeDate: "",
                    source: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newDeal.title || !newDeal.company || !newDeal.value) {
                    toast.error("Please fill in required fields (Title, Company, and Value)");
                    return;
                  }

                  setIsAddingDeal(true);
                  try {
                    // Map dialog stage to API stage (API uses 'won' instead of 'closed')
                    const stageMap: Record<string, string> = {
                      'new': 'new',
                      'contacted': 'contacted',
                      'qualified': 'qualified',
                      'proposal': 'proposal',
                      'negotiation': 'negotiation',
                      'closed': 'won',
                      'lost': 'lost',
                    };

                    const response = await fetch('/api/crm/deals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newDeal.title,
                        company: newDeal.company,
                        estimatedValue: newDeal.value ? parseFloat(newDeal.value) : undefined, // Will be converted to cents in API
                        stage: stageMap[newDeal.stage] || newDeal.stage || 'new',
                        score: newDeal.probability ? parseInt(newDeal.probability) : undefined,
                        nextFollowUpAt: newDeal.closeDate || undefined,
                        notes: newDeal.notes || undefined,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Failed to create deal' }));
                      throw new Error(errorData.error || `Failed to create deal: ${response.status}`);
                    }

                    const created = await response.json();
                    const newDealData: Deal = {
                      id: created.id,
                      title: created.name,
                      company: created.company || '',
                      value: created.estimatedValue || 0,
                      stage: created.stage === 'closed_won' ? 'closed' : created.stage === 'closed_lost' ? 'lost' : created.stage,
                      probability: created.score || 0,
                      closeDate: created.nextFollowUpAt,
                      source: created.source || '',
                      tags: created.tags || [],
                      notes: created.notes,
                    };

                    setDeals([newDealData, ...deals]);
                    toast.success(`Deal "${newDeal.title}" added successfully!`);
                    setShowAddDealDialog(false);
                    setNewDeal({
                      title: "",
                      company: "",
                      value: "",
                      stage: "new",
                      probability: "50",
                      closeDate: "",
                      source: "",
                      notes: "",
                    });

                    setTimeout(async () => {
                      try {
                        const response = await fetch('/api/crm/deals');
                        if (response.ok) {
                          const fresh = await response.json();
                          const transformed = fresh.map((deal: any) => ({
                            id: deal.id,
                            title: deal.name,
                            company: deal.company || '',
                            value: deal.estimatedValue || 0,
                            stage: deal.stage === 'closed_won' ? 'closed' : deal.stage === 'closed_lost' ? 'lost' : deal.stage,
                            probability: deal.score || 0,
                            closeDate: deal.nextFollowUpAt,
                            source: deal.source || '',
                            tags: deal.tags || [],
                            notes: deal.notes,
                          }));
                          setDeals(prev => {
                            const map = new Map(prev.map(d => [d.id, d]));
                            const merged = transformed.map((sd: Deal) => map.get(sd.id) || sd);
                            const localOnly = prev.filter(d => !transformed.some((sd: Deal) => sd.id === d.id));
                            return [...merged, ...localOnly];
                          });
                        }
                      } catch (error) {
                        console.error('Failed to refresh deals:', error);
                      }
                    }, 2000);
                  } catch (error) {
                    console.error('Failed to create deal:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to create deal. Please try again.');
                  } finally {
                    setIsAddingDeal(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isAddingDeal}
              >
                {isAddingDeal ? 'Adding...' : 'Add Deal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
