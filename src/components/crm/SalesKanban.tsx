"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Deal } from "@/types/crm";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SalesKanbanProps {
  deals: Deal[];
  onSelectDeal?: (dealId: string) => void;
  onDealStageChange?: (dealId: string, newStage: string) => Promise<void>;
}

const stageMeta = [
  {
    id: "lead",
    label: "New Leads",
    accent: "from-blue-50/70 to-blue-100/70",
    border: "border-blue-200/60",
    emptyMessage: "Nothing captured yet. Promote inbound demos or SDR outreach.",
  },
  {
    id: "qualified",
    label: "Qualified",
    accent: "from-purple-50/70 to-purple-100/70",
    border: "border-purple-200/60",
    emptyMessage: "Qualify promising prospects to understand buying intent.",
  },
  {
    id: "proposal",
    label: "Proposal",
    accent: "from-amber-50/70 to-amber-100/70",
    border: "border-amber-200/60",
    emptyMessage: "Send polished proposals to keep momentum high.",
  },
  {
    id: "negotiation",
    label: "Negotiation",
    accent: "from-green-50/70 to-green-100/70",
    border: "border-green-200/60",
    emptyMessage: "Follow up on legal + procurement loops to close faster.",
  },
  {
    id: "closed",
    label: "Closed",
    accent: "from-slate-50/70 to-slate-100/70",
    border: "border-slate-200/60",
    emptyMessage: "Closed deals land here. Celebrate wins, learn from losses.",
  },
] as const;

export function SalesKanban({ deals, onSelectDeal, onDealStageChange }: SalesKanbanProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) return;

    // Check if dropped over a stage column
    const overStage = stageMeta.find((s) => over.id === s.id);
    if (overStage && onDealStageChange) {
      await onDealStageChange(active.id as string, overStage.id);
    }
  };

  const stats = useMemo(() => {
    const totalValue = deals.reduce((sum, deal) => sum + parseCurrency(deal.value), 0);
    const highRisk = deals.filter((deal) => deal.aiRisk === "high").length;
    const winRate = deals.length
      ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length)
      : 0;
    const closingSoon = deals.filter((deal) => ["proposal", "negotiation"].includes(deal.stage)).length;

    return {
      totalValue: formatCurrency(totalValue),
      highRisk,
      winRate,
      closingSoon,
    };
  }, [deals]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="grid w-full grid-cols-2 gap-3 md:flex md:flex-row md:gap-4">
            <StatTile label="Pipeline Value" value={stats.totalValue} caption="AI forecast +6.4%" accent="from-indigo-500 to-purple-600" />
            <StatTile label="Deals at Risk" value={stats.highRisk.toString()} caption="AI flagged follow-ups" accent="from-rose-500 to-orange-400" />
            <StatTile label="Win Rate" value={`${stats.winRate}%`} caption="Rolling 30 days" accent="from-emerald-500 to-teal-500" />
            <StatTile label="Closing Soon" value={stats.closingSoon.toString()} caption="Negotiation & proposal" accent="from-blue-500 to-cyan-500" />
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <Button
              variant="outline"
              className="h-9 rounded-xl border-purple-200 bg-purple-50/60 text-sm font-medium text-purple-600 hover:bg-purple-100"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-prioritize
            </Button>
            <Button className="h-9 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-soft hover:bg-indigo-700">
              <Plus className="mr-1.5 h-4 w-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stageMeta.map((stage) => {
            const items = deals.filter((deal) => deal.stage === stage.id);

            return (
              <DroppableColumn
                key={stage.id}
                stageId={stage.id}
                label={stage.label}
                count={items.length}
                accent={stage.accent}
                border={stage.border}
                emptyMessage={stage.emptyMessage}
              >
                {items.map((deal) => (
                  <DraggableDealCard
                    key={deal.id}
                    deal={deal}
                    onSelectDeal={onSelectDeal}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} onSelectDeal={onSelectDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function StatTile({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${accent} p-[1px] shadow-soft`}>
      <div className="flex h-full flex-col justify-between rounded-[1.1rem] bg-white/90 px-4 py-3 backdrop-blur-sm">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="mt-1 text-lg font-semibold text-slate-900">{value}</span>
        <span className="text-[11px] text-slate-500">{caption}</span>
      </div>
    </div>
  );
}

function ColumnHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-start justify-between rounded-2xl bg-white/70 px-3 py-2 backdrop-blur-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900 leading-tight">{label}</p>
        <p className="text-[11px] text-slate-500">{count} {count === 1 ? "deal" : "deals"}</p>
      </div>
      <Badge variant="outline" className="rounded-full border-white/60 bg-white/80 text-xs text-purple-600">
        Focus
      </Badge>
    </div>
  );
}

function DealCard({ deal, onSelectDeal }: { deal: Deal; onSelectDeal?: (dealId: string) => void }) {
  return (
    <button
      onClick={() => onSelectDeal?.(deal.id)}
      className="group w-full rounded-3xl border border-white/60 bg-white px-4 py-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 leading-tight">{deal.title}</h4>
          <p className="text-xs text-slate-500">{deal.company}</p>
        </div>
        <Badge
          variant="outline"
          className={`rounded-full border-0 text-[10px] ${
            deal.aiRisk === "low"
              ? "bg-green-100 text-green-700"
              : deal.aiRisk === "medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          {deal.aiRisk} risk
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>{deal.value}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-indigo-600">
          <Target className="h-3.5 w-3.5" />
          {deal.probability}% win
        </span>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ width: `${deal.probability}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3 text-slate-400" />
          {deal.closeDate}
        </span>
        <span className={`flex items-center gap-1 ${deal.probability > 60 ? "text-emerald-600" : "text-amber-600"}`}>
          {deal.probability > 60 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          momentum
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
          Assigned: Team AI
        </span>
        <span className="flex items-center gap-1 text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

function DroppableColumn({
  stageId,
  label,
  count,
  accent,
  border,
  emptyMessage,
  children,
}: {
  stageId: string;
  label: string;
  count: number;
  accent: string;
  border: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[240px] flex-shrink-0 rounded-3xl border ${border} bg-gradient-to-b ${accent} p-3 shadow-soft transition-colors ${
        isOver ? "ring-2 ring-indigo-400 ring-offset-2" : ""
      }`}
    >
      <ColumnHeader label={label} count={count} />
      <div className="mt-3 space-y-3">
        {count === 0 ? <EmptyState message={emptyMessage} /> : children}
      </div>
    </div>
  );
}

function DraggableDealCard({
  deal,
  onSelectDeal,
}: {
  deal: Deal;
  onSelectDeal?: (dealId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onSelectDeal={onSelectDeal} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/70 bg-white/70 px-4 py-6 text-center text-xs text-slate-500 shadow-soft">
      {message}
    </div>
  );
}

function parseCurrency(value: string): number {
  const numeric = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
