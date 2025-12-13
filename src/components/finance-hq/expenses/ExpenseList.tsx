"use client";

import * as React from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Search,
  Plus,
  MoreHorizontal,
  Check,
  X,
  Receipt,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExpenseDialog } from "./ExpenseDialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Expense {
  id: string;
  description: string;
  category: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  amount: number;
  currency: string;
  taxAmount?: number | null;
  vendor?: string | null;
  expenseDate: string;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  isReimbursable?: boolean;
  notes?: string | null;
  submittedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
  approvedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

interface ExpenseListProps {
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  reimbursed: {
    label: "Reimbursed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: DollarSign,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel",
  meals: "Meals",
  supplies: "Supplies",
  software: "Software",
  hardware: "Hardware",
  marketing: "Marketing",
  payroll: "Payroll",
  utilities: "Utilities",
  rent: "Rent",
  insurance: "Insurance",
  professional_services: "Professional Services",
  other: "Other",
};

export function ExpenseList({ className }: ExpenseListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = React.useState<Expense | null>(null);
  const [approveExpense, setApproveExpense] = React.useState<Expense | null>(null);
  const [rejectExpense, setRejectExpense] = React.useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/finance/expenses?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const expenses: Expense[] = data?.expenses || [];
  const stats = data?.stats || {
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    reimbursedAmount: 0,
  };

  const handleApprove = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("Expense approved");
      mutate();
    } catch {
      toast.error("Failed to approve expense");
    } finally {
      setActionLoading(null);
      setApproveExpense(null);
    }
  };

  const handleReject = async (expense: Expense, reason?: string) => {
    setActionLoading(expense.id);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectionReason: reason }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Expense rejected");
      mutate();
    } catch {
      toast.error("Failed to reject expense");
    } finally {
      setActionLoading(null);
      setRejectExpense(null);
    }
  };

  const handleMarkReimbursed = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reimbursed" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Marked as reimbursed");
      mutate();
    } catch {
      toast.error("Failed to update expense");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Expense deleted");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense");
    } finally {
      setActionLoading(null);
      setDeleteExpense(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(stats.totalAmount)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-500">Pending Approval</p>
          <p className="text-lg font-semibold text-amber-600">{stats.pendingCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-lg font-semibold text-green-600">{stats.approvedCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-500">Reimbursed</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrency(stats.reimbursedAmount)}
          </p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reimbursed">Reimbursed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-9 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setEditingExpense(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Failed to load expenses</p>
          <Button variant="outline" size="sm" onClick={() => mutate()} className="mt-2">
            Retry
          </Button>
        </Card>
      ) : expenses.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No expenses found</p>
          <Button
            size="sm"
            className="mt-3 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setEditingExpense(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Expense
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const statusConfig = STATUS_CONFIG[expense.status];
            const StatusIcon = statusConfig.icon;
            const isActionLoading = actionLoading === expense.id;

            return (
              <Card
                key={expense.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {expense.description}
                      </h4>
                      <Badge
                        className={cn(
                          "text-[10px] border",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {expense.isReimbursable && (
                        <Badge variant="outline" className="text-[10px]">
                          Reimbursable
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3.5 w-3.5" />
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </span>
                      <span>{formatDate(expense.expenseDate)}</span>
                      {expense.vendor && <span>• {expense.vendor}</span>}
                    </div>
                    {expense.submittedByUser && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={expense.submittedByUser.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {expense.submittedByUser.firstName?.[0]}
                            {expense.submittedByUser.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {expense.submittedByUser.firstName} {expense.submittedByUser.lastName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </p>
                      {expense.taxAmount ? (
                        <p className="text-xs text-gray-500">
                          + {formatCurrency(expense.taxAmount)} tax
                        </p>
                      ) : null}
                    </div>

                    {/* Quick Actions for Pending */}
                    {expense.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setApproveExpense(expense)}
                          disabled={isActionLoading}
                          aria-label="Approve expense"
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRejectExpense(expense)}
                          disabled={isActionLoading}
                          aria-label="Reject expense"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingExpense(expense);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {expense.receiptUrl && (
                          <DropdownMenuItem asChild>
                            <a
                              href={expense.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Receipt
                            </a>
                          </DropdownMenuItem>
                        )}
                        {expense.status === "approved" && expense.isReimbursable && (
                          <DropdownMenuItem
                            onClick={() => handleMarkReimbursed(expense)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Mark Reimbursed
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteExpense(expense)}
                          disabled={expense.status !== "pending"}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!approveExpense} onOpenChange={() => setApproveExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this expense for{" "}
              <strong>{approveExpense && formatCurrency(approveExpense.amount)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveExpense && handleApprove(approveExpense)}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectExpense} onOpenChange={() => setRejectExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => rejectExpense && handleReject(rejectExpense)}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteExpense} onOpenChange={() => setDeleteExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteExpense && handleDelete(deleteExpense)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
