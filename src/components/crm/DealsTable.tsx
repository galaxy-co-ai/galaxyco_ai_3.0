"use client";

import { Deal } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealsTableProps {
  deals: Deal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
}

export default function DealsTable({
  deals,
  selectedId,
  onSelect,
  formatDate,
  formatCurrency,
}: DealsTableProps) {
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-slate-100 text-slate-700",
      qualified: "bg-blue-100 text-blue-700",
      proposal: "bg-purple-100 text-purple-700",
      negotiation: "bg-amber-100 text-amber-700",
      won: "bg-green-100 text-green-700",
      lost: "bg-red-100 text-red-700",
      closed: "bg-green-100 text-green-700",
    };
    return colors[stage] || "bg-slate-100 text-slate-700";
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "text-green-600";
    if (probability >= 50) return "text-amber-600";
    return "text-slate-600";
  };

  if (deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6">
        <div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No deals found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {deals.map((deal) => (
        <button
          key={deal.id}
          onClick={() => onSelect(deal.id)}
          className={cn(
            "w-full p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selectedId === deal.id && "bg-muted"
          )}
          aria-label={`Select deal ${deal.title}`}
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {deal.company}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", getStageColor(deal.stage))}
                >
                  {deal.stage}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-slate-900">
                    {formatCurrency(deal.value)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className={cn("h-3.5 w-3.5", getProbabilityColor(deal.probability))} />
                  <span className={cn("font-medium", getProbabilityColor(deal.probability))}>
                    {deal.probability}%
                  </span>
                </div>
                {deal.closeDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(deal.closeDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}





