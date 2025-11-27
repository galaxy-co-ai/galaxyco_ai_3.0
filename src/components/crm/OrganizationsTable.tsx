"use client";

import { Organization } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Mail, Phone, Globe, Plus, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationsTableProps {
  organizations: Organization[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
}

export default function OrganizationsTable({
  organizations,
  selectedId,
  onSelect,
  onAddNew,
  formatDate,
  formatCurrency,
}: OrganizationsTableProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: "bg-slate-100 text-slate-700",
      customer: "bg-green-100 text-green-700",
      partner: "bg-purple-100 text-purple-700",
      inactive: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6 py-8">
        <div className="max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Track your accounts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Organizations help you manage company relationships and track multiple contacts per account.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={onAddNew}
            >
              <Plus className="h-4 w-4" />
              Add Organization
            </Button>
            <p className="text-xs text-muted-foreground">
              Great for B2B sales and account management
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {organizations.map((org) => (
        <button
          key={org.id}
          onClick={() => onSelect(org.id)}
          className={cn(
            "w-full p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selectedId === org.id && "bg-muted"
          )}
          aria-label={`Select organization ${org.name}`}
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {getInitials(org.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  {org.company && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{org.company}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", getStatusColor(org.status))}
                >
                  {org.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {org.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[140px]">{org.email}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{org.phone}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[120px]">{org.website}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                {org.industry && (
                  <span className="text-xs text-muted-foreground">{org.industry}</span>
                )}
                {org.size && (
                  <span className="text-xs text-muted-foreground">· {org.size}</span>
                )}
                {org.revenue > 0 && (
                  <span className="text-xs font-medium text-muted-foreground ml-auto">
                    {formatCurrency(org.revenue)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(org.lastContactedAt)}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
