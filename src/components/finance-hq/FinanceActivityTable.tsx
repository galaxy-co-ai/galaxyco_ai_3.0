"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  FinanceTransaction,
  FinanceObject,
  FinanceProvider,
  TransactionType,
} from "@/types/finance";

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
 * Source badge component
 */
function SourceBadge({ source }: { source: FinanceProvider }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] h-5 px-1.5 border capitalize", getSourceBadgeClass(source))}
    >
      {source}
    </Badge>
  );
}

/**
 * Format date to display string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format currency amount with color coding
 */
function AmountDisplay({
  amount,
  type,
}: {
  amount: number;
  type: TransactionType;
}) {
  const isNegative = type === "expense" || type === "fee" || type === "refund";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));

  return (
    <span
      className={cn(
        "text-xs font-medium font-mono",
        isNegative ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
      )}
    >
      {isNegative ? "-" : "+"}
      {formatted}
    </span>
  );
}

/**
 * Get display label for transaction type
 */
function getTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    fee: "Fee",
    refund: "Refund",
  };
  return labels[type];
}

interface FinanceActivityTableProps {
  transactions?: FinanceTransaction[];
  isLoading?: boolean;
  onRowClick: (item: FinanceObject) => void;
}

/**
 * Unified transaction table showing recent financial activity.
 * Rows are clickable to open detail drawer.
 */
export function FinanceActivityTable({
  transactions,
  isLoading,
  onRowClick,
}: FinanceActivityTableProps) {
  if (isLoading) {
    return <FinanceActivityTableSkeleton />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
        </div>
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No recent transactions to display.
        </div>
      </Card>
    );
  }

  const handleRowClick = (tx: FinanceTransaction) => {
    onRowClick({ type: "transaction", id: tx.id, data: tx as unknown as Record<string, unknown> });
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, tx: FinanceTransaction) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(tx);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border overflow-hidden" role="region" aria-label="Recent activity">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead className="bg-muted/50">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Source
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-muted/50 cursor-pointer transition-colors focus-visible:bg-muted/50 focus-visible:outline-none"
                onClick={() => handleRowClick(tx)}
                onKeyDown={(e) => handleRowKeyDown(e, tx)}
                role="row"
                tabIndex={0}
                aria-label={`${tx.description}, ${getTypeLabel(tx.type)}, ${formatDate(tx.date)}`}
              >
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <SourceBadge source={tx.source} />
                </td>
                <td className="px-4 py-2.5 text-xs text-foreground capitalize whitespace-nowrap">
                  {getTypeLabel(tx.type)}
                </td>
                <td className="px-4 py-2.5 text-xs text-foreground max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <AmountDisplay amount={tx.amount} type={tx.type} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for FinanceActivityTable
 */
export function FinanceActivityTableSkeleton() {
  return (
    <Card className="rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left">
                <Skeleton className="h-2.5 w-8" />
              </th>
              <th className="px-4 py-2 text-left">
                <Skeleton className="h-2.5 w-12" />
              </th>
              <th className="px-4 py-2 text-left">
                <Skeleton className="h-2.5 w-8" />
              </th>
              <th className="px-4 py-2 text-left">
                <Skeleton className="h-2.5 w-20" />
              </th>
              <th className="px-4 py-2 text-right">
                <Skeleton className="h-2.5 w-14 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5">
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="px-4 py-2.5">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </td>
                <td className="px-4 py-2.5">
                  <Skeleton className="h-3 w-12" />
                </td>
                <td className="px-4 py-2.5">
                  <Skeleton className="h-3 w-40" />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Skeleton className="h-3 w-16 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

