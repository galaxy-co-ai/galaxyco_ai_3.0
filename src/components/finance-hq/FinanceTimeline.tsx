"use client";

import * as React from "react";
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FinanceEvent, FinanceObject, FinanceProvider, FinanceEventType } from "@/types/finance";

/**
 * Map event types to icons
 */
const eventIconMap: Record<FinanceEventType, LucideIcon> = {
  invoice_created: Receipt,
  invoice_paid: ArrowUpRight,
  payout: ArrowDownRight,
  order: ShoppingCart,
  expense: CreditCard,
  refund: RefreshCw,
};

/**
 * Get colors for each event type
 */
function getEventColors(type: FinanceEventType) {
  const colors: Record<FinanceEventType, { bg: string; icon: string }> = {
    invoice_created: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      icon: "text-blue-600 dark:text-blue-400",
    },
    invoice_paid: {
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: "text-green-600 dark:text-green-400",
    },
    payout: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      icon: "text-purple-600 dark:text-purple-400",
    },
    order: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      icon: "text-orange-600 dark:text-orange-400",
    },
    expense: {
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: "text-red-600 dark:text-red-400",
    },
    refund: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
  };
  return colors[type];
}

/**
 * Get badge colors for each source
 */
function getSourceBadgeClass(source: FinanceProvider): string {
  const classes = {
    quickbooks: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    stripe: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    shopify: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-800",
  };
  return classes[source];
}

/**
 * Format date to display string
 */
function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format currency amount
 */
function formatAmount(amount?: number): string {
  if (amount === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

interface TimelineEventProps {
  event: FinanceEvent;
  onClick: () => void;
}

/**
 * Individual event card in the timeline
 */
function TimelineEvent({ event, onClick }: TimelineEventProps) {
  const Icon = eventIconMap[event.type] || Receipt;
  const colors = getEventColors(event.type);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="flex-shrink-0 w-44 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${event.label}${event.amount ? `: ${formatAmount(event.amount)}` : ""} on ${formatEventDate(event.date)}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn("p-1 rounded-md", colors.bg)}>
          <Icon className={cn("h-3 w-3", colors.icon)} aria-hidden="true" />
        </div>
        <Badge
          variant="outline"
          className={cn("text-[9px] h-4 px-1 border capitalize", getSourceBadgeClass(event.source))}
        >
          {event.source}
        </Badge>
      </div>
      <p className="text-xs font-medium text-foreground truncate">{event.label}</p>
      {event.amount !== undefined && (
        <p className="text-sm font-semibold text-foreground mt-0.5">
          {formatAmount(event.amount)}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {formatEventDate(event.date)}
      </p>
    </div>
  );
}

interface FinanceTimelineProps {
  events?: FinanceEvent[];
  isLoading?: boolean;
  onEventClick: (item: FinanceObject) => void;
}

/**
 * Horizontal scrolling timeline of financial events.
 * Shows recent invoices, payouts, orders, etc.
 */
export function FinanceTimeline({
  events,
  isLoading,
  onEventClick,
}: FinanceTimelineProps) {
  if (isLoading) {
    return <FinanceTimelineSkeleton />;
  }

  if (!events || events.length === 0) {
    return (
      <Card className="p-4 rounded-xl shadow-sm border">
        <h3 className="text-sm font-medium text-foreground mb-3">Financial Timeline</h3>
        <p className="text-xs text-muted-foreground text-center py-6">
          No recent financial events to display.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 rounded-xl shadow-sm border" role="region" aria-label="Financial timeline">
      <h3 className="text-sm font-medium text-foreground mb-3">Financial Timeline</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-3">
          {events.map((event) => (
            <TimelineEvent
              key={event.id}
              event={event}
              onClick={() =>
                onEventClick({ type: "event", id: event.id, data: event as unknown as Record<string, unknown> })
              }
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}

/**
 * Loading skeleton for FinanceTimeline
 */
export function FinanceTimelineSkeleton() {
  return (
    <Card className="p-4 rounded-xl shadow-sm border">
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-44 p-3 rounded-lg border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-28 mb-1" />
            <Skeleton className="h-4 w-16 mb-0.5" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

