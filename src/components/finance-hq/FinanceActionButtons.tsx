"use client";

import * as React from "react";
import {
  Plus,
  FileText,
  Download,
  Receipt,
  FileBarChart,
  PiggyBank,
  ChevronDown,
  ClipboardList,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FinanceActionButtonsProps {
  onAction?: (action: FinanceAction) => void;
  className?: string;
}

export type FinanceAction =
  | "create_invoice"
  | "create_estimate"
  | "create_receipt"
  | "create_expense"
  | "record_payment"
  | "report_pnl"
  | "report_cashflow"
  | "report_balance"
  | "export_csv"
  | "export_pdf";

/**
 * Action buttons for creating financial documents and generating reports.
 * Right-aligned group that appears next to the filter chips.
 */
export function FinanceActionButtons({
  onAction,
  className,
}: FinanceActionButtonsProps) {
  const handleAction = (action: FinanceAction) => {
    onAction?.(action);
  };

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label="Finance actions"
    >
      {/* Create Document Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-normal gap-1.5"
            aria-label="Create document"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Create
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => handleAction("create_invoice")}
            className="text-xs"
          >
            <Receipt className="h-3.5 w-3.5 mr-2 text-emerald-600" aria-hidden="true" />
            New Invoice
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("create_estimate")}
            className="text-xs"
          >
            <ClipboardList className="h-3.5 w-3.5 mr-2 text-blue-600" aria-hidden="true" />
            New Estimate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("create_receipt")}
            className="text-xs"
          >
            <ReceiptText className="h-3.5 w-3.5 mr-2 text-teal-600" aria-hidden="true" />
            New Receipt
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleAction("create_expense")}
            className="text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-2 text-red-500" aria-hidden="true" />
            New Expense
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("record_payment")}
            className="text-xs"
          >
            <PiggyBank className="h-3.5 w-3.5 mr-2 text-indigo-600" aria-hidden="true" />
            Record Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Generate Reports Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-normal gap-1.5"
            aria-label="Generate report"
          >
            <FileBarChart className="h-3.5 w-3.5" aria-hidden="true" />
            Reports
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleAction("report_pnl")}
            className="text-xs"
          >
            <FileBarChart className="h-3.5 w-3.5 mr-2 text-purple-600" aria-hidden="true" />
            Profit & Loss
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("report_cashflow")}
            className="text-xs"
          >
            <FileBarChart className="h-3.5 w-3.5 mr-2 text-blue-600" aria-hidden="true" />
            Cash Flow Statement
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("report_balance")}
            className="text-xs"
          >
            <FileBarChart className="h-3.5 w-3.5 mr-2 text-amber-600" aria-hidden="true" />
            Balance Sheet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleAction("export_csv")}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction("export_pdf")}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

