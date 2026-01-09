"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { PageTitle } from "@/components/ui/page-title";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Mail,
  Sparkles,
  Target,
  Calendar,
  FileText,
  Zap,
  DollarSign,
  Upload,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LeadsTable from "./LeadsTable";
import OrganizationsTable from "./OrganizationsTable";
import ContactsTable from "./ContactsTable";
import DealsTable from "./DealsTable";
import LeadDetailView from "./LeadDetailView";
import OrganizationDetailView from "./OrganizationDetailView";
import ContactDetailView from "./ContactDetailView";
import DealDetailView from "./DealDetailView";
import { DealDialog } from "./DealDialog";
import InsightsTab from "./InsightsTab";
import { ImportContactsDialog } from "./ImportContactsDialog";
import { LeadScoringRulesDialog } from "./LeadScoringRulesDialog";
import { LeadRoutingRulesDialog } from "./LeadRoutingRulesDialog";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils";
import { logger } from "@/lib/logger";
import NeptuneAssistPanel from "@/components/conversations/NeptuneAssistPanel";
import { usePageContext } from "@/hooks/usePageContext";

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

// API response types for transforming raw data
interface ApiLead {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  stage?: string;
  score?: number;
  estimatedValue?: number;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
  interactionCount?: number;
  source?: string;
  tags?: string[];
  notes?: string;
}

interface ApiOrganization {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  status?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  tags?: string[];
  notes?: string;
  lastContactedAt?: Date | null;
}

interface ApiContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  tags?: string[];
}

interface ApiDeal {
  id: string;
  title?: string;
  name?: string;
  company?: string;
  value?: number;
  estimatedValue?: number;
  stage?: string;
  probability?: number;
  score?: number;
  closeDate?: Date | null;
  nextFollowUpAt?: Date | null;
  source?: string;
  tags?: string[];
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

type TabType = 'leads' | 'organizations' | 'contacts' | 'deals' | 'insights';

export default function CRMDashboard({
  initialLeads,
  initialOrganizations,
  initialContacts,
  initialDeals,
  initialTab = 'leads',
  stats,
}: CRMDashboardProps) {
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
  const [showImportContactsDialog, setShowImportContactsDialog] = useState(false);
  const [showLeadScoringDialog, setShowLeadScoringDialog] = useState(false);
  const [showLeadRoutingDialog, setShowLeadRoutingDialog] = useState(false);
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
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
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

  const [showNeptune, setShowNeptune] = useState(false);

  // Report page context to Neptune for contextual awareness
  const { setSelectedItems, setFocusedItem } = usePageContext({
    module: 'crm',
    pageName: 'CRM Dashboard',
    pageType: selectedLead || selectedOrg || selectedContact || selectedDeal ? 'view' : 'list',
    activeTab,
    customData: {
      stats,
      leadsCount: leads.length,
      dealsCount: deals.length,
      contactsCount: contacts.length,
      organizationsCount: organizations.length,
      activeFilter: activeTab === 'leads' ? stageFilter : activeTab === 'organizations' ? statusFilter : activeTab === 'deals' ? dealStageFilter : null,
    },
  });

  // Update Neptune when selections change
  useEffect(() => {
    if (selectedLead) {
      const lead = leads.find(l => l.id === selectedLead);
      setSelectedItems([{ id: selectedLead, type: 'lead', name: lead?.name || '' }]);
      setFocusedItem({ id: selectedLead, type: 'lead', name: lead?.name || '' });
    } else if (selectedContact) {
      const contact = contacts.find(c => c.id === selectedContact);
      setSelectedItems([{ id: selectedContact, type: 'contact', name: contact?.firstName || '' }]);
      setFocusedItem({ id: selectedContact, type: 'contact', name: contact?.firstName || '' });
    } else {
      setSelectedItems([]);
      setFocusedItem(undefined);
    }
  }, [selectedLead, selectedContact, leads, contacts, setSelectedItems, setFocusedItem]);

  // Floating detail dialog states
  const [showLeadDetailDialog, setShowLeadDetailDialog] = useState(false);
  const [showOrgDetailDialog, setShowOrgDetailDialog] = useState(false);
  const [showContactDetailDialog, setShowContactDetailDialog] = useState(false);
  const [showDealDetailDialog, setShowDealDetailDialog] = useState(false);


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

      // Refresh server data after a delay
      setTimeout(async () => {
        try {
          const response = await fetch('/api/crm/prospects');
          if (response.ok) {
            const fresh: ApiLead[] = await response.json();
            const transformed = fresh.map((lead) => ({
              id: lead.id,
              name: lead.name ?? '',
              email: lead.email ?? '',
              company: lead.company ?? '',
              title: lead.title,
              phone: lead.phone,
              stage: lead.stage ?? 'new',
              score: lead.score ?? 0,
              estimatedValue: lead.estimatedValue ?? 0,
              lastContactedAt: lead.lastContactedAt ?? null,
              nextFollowUpAt: lead.nextFollowUpAt ?? null,
              interactionCount: lead.interactionCount ?? 0,
              source: lead.source,
              tags: lead.tags ?? [],
              notes: lead.notes,
            }));
            setLeads(transformed);
          }
        } catch (error) {
          logger.error('Failed to refresh leads', error);
        }
      }, 1000);
    } catch (error) {
      logger.error('Failed to delete lead', error);
      // Silently fail - item already removed optimistically
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

      // Refresh server data after a delay
      setTimeout(async () => {
        try {
          const response = await fetch('/api/crm/contacts');
          if (response.ok) {
            const fresh = await response.json();
            const transformed = fresh.map((contact: ApiContact) => ({
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
          logger.error('Failed to refresh contacts', error);
        }
      }, 1000);
    } catch (error) {
      logger.error('Failed to delete contact', error);
      // Silently fail - item already removed optimistically
    }
  };

  const handleExportContacts = async () => {
    try {
      const response = await fetch('/api/crm/contacts/export');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      
      // Get the CSV content
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${contacts.length} contacts`);
    } catch (error) {
      logger.error('Failed to export contacts', error);
      toast.error('Failed to export contacts');
    }
  };

  const refreshContacts = async () => {
    try {
      const response = await fetch('/api/crm/contacts');
      if (response.ok) {
        const fresh = await response.json();
        const transformed = fresh.map((contact: ApiContact) => ({
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
      logger.error('Failed to refresh contacts', error);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      const response = await fetch(`/api/crm/customers/${orgId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete organization' }));
        throw new Error(errorData.error || `Failed to delete organization: ${response.status}`);
      }

      // Optimistically remove from list
      setOrganizations(prev => prev.filter(org => org.id !== orgId));

      // Refresh server data after a delay
      setTimeout(async () => {
        try {
          const response = await fetch('/api/crm/customers');
          if (response.ok) {
            const fresh = await response.json();
            const transformed = fresh.map((org: ApiOrganization) => ({
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
          logger.error('Failed to refresh organizations', error);
        }
      }, 1000);
    } catch (error) {
      logger.error('Failed to delete organization', error);
      // Silently fail - item already removed optimistically
    }
  };

  const handleDealEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowDealDialog(true);
  };

  const handleDealDelete = async (dealId: string) => {
    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete deal' }));
        throw new Error(errorData.error || `Failed to delete deal: ${response.status}`);
      }

      // Optimistically remove from list
      setDeals(prev => prev.filter(deal => deal.id !== dealId));
      
      // Clear selection if this was the selected deal
      if (selectedDeal === dealId) {
        setSelectedDeal(null);
      }

      toast.success('Deal deleted successfully');

      // Refresh server data after a delay
      setTimeout(() => refreshDeals(), 1000);
    } catch (error) {
      logger.error('Failed to delete deal', error);
      // Silently fail - item already removed optimistically
    }
  };

  const handleDealSuccess = () => {
    setShowDealDialog(false);
    setEditingDeal(null);
    // Refresh deals list after mutation
    setTimeout(() => refreshDeals(), 1000);
  };

  const refreshDeals = async () => {
    try {
      const response = await fetch('/api/crm/deals');
      if (response.ok) {
        const fresh = await response.json();
        const transformed = fresh.map((deal: ApiDeal) => ({
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
      logger.error('Failed to refresh deals', error);
    }
  };

  const handleDealStageChange = async (dealId: string, newStage: string) => {
    try {
      // Optimistically update UI
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      ));

      // Map UI stages to API stages
      const stageMap: Record<string, string> = {
        'lead': 'new',
        'qualified': 'qualified',
        'proposal': 'proposal',
        'negotiation': 'negotiation',
        'closed': 'won',
      };

      const apiStage = stageMap[newStage] || newStage;

      // Call PATCH endpoint to update stage
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: apiStage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update deal stage' }));
        throw new Error(errorData.error || `Failed to update deal stage: ${response.status}`);
      }

      toast.success(`Deal moved to ${newStage}`);

      // Refresh to ensure consistency
      setTimeout(() => refreshDeals(), 500);
    } catch (error) {
      logger.error('Failed to update deal stage', error);
      toast.error('Failed to move deal. Please try again.');
      
      // Revert optimistic update on error
      setTimeout(() => refreshDeals(), 500);
    }
  };


  // Tab configuration - dynamically calculate counts from state
  const tabs = useMemo(() => [
    { id: 'leads' as TabType, label: 'Leads', icon: Users, badge: leads.length.toString(), badgeColor: 'bg-blue-500', activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'organizations' as TabType, label: 'Companies', icon: Building2, badge: organizations.length.toString(), badgeColor: 'bg-purple-500', activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Mail, badge: contacts.length.toString(), badgeColor: 'bg-cyan-500', activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'deals' as TabType, label: 'Deals', icon: Target, badge: deals.length.toString(), badgeColor: 'bg-green-500', activeColor: 'bg-green-100 text-green-700' },
    { id: 'insights' as TabType, label: 'Insights', icon: Sparkles, activeColor: 'bg-indigo-100 text-indigo-700' },
  ], [leads.length, organizations.length, contacts.length, deals.length]);

  const pillTabs = useMemo<Array<PillTab<TabType>>>(() => {
    return tabs.map((tab) => ({
      value: tab.id,
      label: tab.label,
      Icon: tab.icon,
      activeClassName: tab.activeColor,
      badgeClassName: tab.badgeColor,
      badge: tab.badge ? Number(tab.badge) : undefined,
      ariaLabel: `Switch to ${tab.label} tab`,
    }));
  }, [tabs]);

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


  // Handle item click - open floating dialog
  const handleLeadClick = (leadId: string) => {
    setSelectedLead(leadId);
    setShowLeadDetailDialog(true);
  };

  const handleOrgClick = (orgId: string) => {
    setSelectedOrg(orgId);
    setShowOrgDetailDialog(true);
  };

  const handleContactClick = (contactId: string) => {
    setSelectedContact(contactId);
    setShowContactDetailDialog(true);
  };

  const handleDealClick = (dealId: string) => {
    setSelectedDeal(dealId);
    setShowDealDetailDialog(true);
  };

  // Get selected item data
  const selectedLeadData = leads.find(l => l.id === selectedLead);
  const selectedOrgData = organizations.find(o => o.id === selectedOrg);
  const selectedContactData = contacts.find(c => c.id === selectedContact);
  const selectedDealData = deals.find(d => d.id === selectedDeal);

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header Section - Matching Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="CRM" icon={Users} />

          {/* Stats Bar */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <Badge variant="soft" tone="info" size="pill">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.totalLeads}</span>
              <span className="ml-1 font-normal opacity-70">Leads</span>
            </Badge>
            <Badge variant="soft" tone="violet" size="pill">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{deals.length}</span>
              <span className="ml-1 font-normal opacity-70">Deals</span>
            </Badge>
            <Badge variant="soft" tone="success" size="pill">
              <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{formatCurrency(stats.totalValue)}</span>
              <span className="ml-1 font-normal opacity-70">Pipeline</span>
            </Badge>
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center overflow-x-auto pb-2 -mb-2">
          <PillTabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={pillTabs}
            className="justify-start sm:justify-center"
            listClassName="flex-nowrap"
          />
          <div className="absolute right-0">
            <Button
              size="sm"
              variant="surface"
              onClick={() => setShowNeptune(!showNeptune)}
              aria-label="Toggle Neptune AI assistant"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Neptune</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content with Neptune Panel */}
      <div className="flex flex-1 overflow-hidden gap-6 px-4 sm:px-6 pb-6">
        <div className="flex-1 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1">
                {/* Leads List */}
                <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                          <Users className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Leads</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          {filteredLeads.length} leads
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowLeadScoringDialog(true)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          aria-label="Configure lead scoring"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Scoring</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowLeadRoutingDialog(true)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          aria-label="Configure lead routing"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Routing</span>
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => setShowAddLeadDialog(true)}
                          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                          aria-label="Add lead"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                      onSelect={handleLeadClick}
                      onAddNew={() => setShowAddLeadDialog(true)}
                      onDelete={handleDeleteLead}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ORGANIZATIONS TAB */}
          {activeTab === 'organizations' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1">
                {/* Organizations List */}
                <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Organizations</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-purple-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                          {filteredOrganizations.length} organizations
                        </p>
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
                      onSelect={handleOrgClick}
                      onAddNew={() => setShowAddOrgDialog(true)}
                      onDelete={handleDeleteOrganization}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1">
                {/* Contacts List */}
                <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] rounded-xl border bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-cyan-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                          <Mail className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-cyan-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                          {filteredContacts.length} contacts
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowImportContactsDialog(true)}
                          className="h-8 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                          aria-label="Import contacts"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleExportContacts}
                          className="h-8 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                          aria-label="Export contacts"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => setShowAddContactDialog(true)}
                          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                          aria-label="Add contact"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                      onSelect={handleContactClick}
                      onAddNew={() => setShowAddContactDialog(true)}
                      onDelete={handleDeleteContact}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* DEALS TAB */}
          {activeTab === 'deals' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1">
                {/* Deals List */}
                <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] rounded-xl border bg-white overflow-hidden shadow-sm">
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
                        onClick={() => {
                          setEditingDeal(null);
                          setShowDealDialog(true);
                        }}
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
                      onSelect={handleDealClick}
                      onAddNew={() => {
                        setEditingDeal(null);
                        setShowDealDialog(true);
                      }}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Neptune Panel */}
        <AnimatePresence>
          {showNeptune && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '30%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col shrink-0 relative z-40"
            >
              <Card className="flex flex-col h-[calc(100vh-316px)] min-h-[464px] rounded-l-2xl shadow-lg border-0 border-r-0 bg-card overflow-hidden mb-6">
                <NeptuneAssistPanel
                  conversationId={null}
                  conversation={null}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                          const transformedLeads: Lead[] = freshLeads.map((lead: ApiLead) => ({
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
                        logger.error('Failed to refresh leads', error);
                        // Don't show error to user - optimistic update already succeeded
                      }
                    }, 2000);
                  } catch (error) {
                    logger.error('Failed to create lead', error);
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
                          const transformed = fresh.map((org: ApiOrganization) => ({
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
                        logger.error('Failed to refresh organizations', error);
                      }
                    }, 2000);
                  } catch (error) {
                    logger.error('Failed to create organization', error);
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
                          const transformed = fresh.map((contact: ApiContact) => ({
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
                        logger.error('Failed to refresh contacts', error);
                      }
                    }, 2000);
                  } catch (error) {
                    logger.error('Failed to create contact', error);
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

      {/* Import Contacts Dialog */}
      <ImportContactsDialog
        open={showImportContactsDialog}
        onOpenChange={setShowImportContactsDialog}
        onSuccess={refreshContacts}
      />

      {/* Lead Scoring Rules Dialog */}
      <LeadScoringRulesDialog
        open={showLeadScoringDialog}
        onOpenChange={setShowLeadScoringDialog}
      />

      {/* Lead Routing Rules Dialog */}
      <LeadRoutingRulesDialog
        open={showLeadRoutingDialog}
        onOpenChange={setShowLeadRoutingDialog}
      />

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
                          const transformed = fresh.map((deal: ApiDeal) => ({
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
                        logger.error('Failed to refresh deals', error);
                      }
                    }, 2000);
                  } catch (error) {
                    logger.error('Failed to create deal', error);
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

      {/* Floating Lead Detail Dialog */}
      <Dialog open={showLeadDetailDialog} onOpenChange={setShowLeadDetailDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{selectedLeadData?.name || 'Lead Details'}</DialogTitle>
                  <DialogDescription className="text-blue-600">{selectedLeadData?.company || 'No company'}</DialogDescription>
                </div>
              </div>
            </div>
          </div>
          {selectedLeadData && (
            <LeadDetailView 
              lead={selectedLeadData} 
              formatDate={formatDate} 
              formatCurrency={formatCurrency}
              onDelete={(id) => {
                handleDeleteLead(id);
                setShowLeadDetailDialog(false);
              }}
              onUpdate={(updatedLead) => {
                // Update lead in local state - selectedLeadData will auto-update since it's derived from leads.find()
                setLeads(prevLeads => 
                  prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l)
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Organization Detail Dialog */}
      <Dialog open={showOrgDetailDialog} onOpenChange={setShowOrgDetailDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{selectedOrgData?.name || 'Organization Details'}</DialogTitle>
                  <DialogDescription className="text-purple-600">{selectedOrgData?.industry || 'No industry'}</DialogDescription>
                </div>
              </div>
            </div>
          </div>
          {selectedOrgData && (
            <OrganizationDetailView
              organization={selectedOrgData}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Contact Detail Dialog */}
      <Dialog open={showContactDetailDialog} onOpenChange={setShowContactDetailDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-50 to-cyan-100/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{selectedContactData ? `${selectedContactData.firstName} ${selectedContactData.lastName}` : 'Contact Details'}</DialogTitle>
                  <DialogDescription className="text-cyan-600">{selectedContactData?.company || 'No company'}</DialogDescription>
                </div>
              </div>
            </div>
          </div>
          {selectedContactData && (
            <ContactDetailView 
              contact={selectedContactData} 
              formatDate={formatDate}
              onDelete={(id) => {
                handleDeleteContact(id);
                setShowContactDetailDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Deal Detail Dialog */}
      <Dialog open={showDealDetailDialog} onOpenChange={setShowDealDetailDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{selectedDealData?.title || 'Deal Details'}</DialogTitle>
                  <DialogDescription className="text-green-600">{selectedDealData ? formatCurrency(selectedDealData.value) : 'No value'}</DialogDescription>
                </div>
              </div>
            </div>
          </div>
          {selectedDealData && (
            <DealDetailView
              deal={{
                id: selectedDealData.id,
                name: selectedDealData.title,
                company: selectedDealData.company,
                estimatedValue: selectedDealData.value,
                stage: selectedDealData.stage,
                score: selectedDealData.probability,
                nextFollowUpAt: selectedDealData.closeDate,
                notes: selectedDealData.notes,
                tags: selectedDealData.tags,
              }}
              onEdit={() => {
                handleDealEdit(selectedDealData);
                setShowDealDetailDialog(false);
              }}
              onDelete={(id) => {
                handleDealDelete(id);
                setShowDealDetailDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deal Dialog (Create/Edit) */}
      <DealDialog
        open={showDealDialog}
        onOpenChange={(open) => {
          setShowDealDialog(open);
          if (!open) setEditingDeal(null);
        }}
        deal={editingDeal}
        onSuccess={handleDealSuccess}
      />
    </div>
  );
}
