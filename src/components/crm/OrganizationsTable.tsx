"use client";

import { Organization } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Mail, Phone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationsTableProps {
  organizations: Organization[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
}

export default function OrganizationsTable({
  organizations,
  selectedId,
  onSelect,
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
      <div className="flex items-center justify-center h-full text-center px-6">
        <div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No organizations found</p>
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
