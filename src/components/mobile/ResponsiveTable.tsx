"use client";

import * as React from "react";
import { ChevronDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ResponsiveColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  priority?: number; // Lower number = higher priority (shown first on mobile)
  showInCard?: boolean; // Whether to show in card view
  className?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  getRowId: (row: T) => string;
  rowActions?: RowAction<T>[];
  viewMode?: "table" | "card" | "auto";
  enableCollapse?: boolean;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  getRowId,
  rowActions = [],
  viewMode = "auto",
  enableCollapse = true,
  className,
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = React.useState<"table" | "card">(
    viewMode === "auto" ? "card" : viewMode
  );

  // Sort columns by priority for mobile
  const sortedColumns = React.useMemo(() => {
    return [...columns].sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });
  }, [columns]);

  // Priority columns for mobile table view (top 3)
  const priorityColumns = sortedColumns.slice(0, 3);

  // Card view columns
  const cardViewColumns = columns.filter(col => col.showInCard !== false);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getCellValue = (row: T, column: ResponsiveColumn<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    if (column.accessorKey) {
      return String(row[column.accessorKey] ?? "");
    }
    return "";
  };

  // Auto-detect view based on screen size
  React.useEffect(() => {
    if (viewMode !== "auto") return;

    const handleResize = () => {
      setCurrentView(window.innerWidth < 768 ? "card" : "table");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  return (
    <div className={cn("w-full", className)}>
      {currentView === "table" ? (
        // Table View with Horizontal Scroll
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  {/* Show priority columns on mobile, all columns on desktop */}
                  {(window.innerWidth < 768 ? priorityColumns : sortedColumns).map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                        column.className
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                  {rowActions.length > 0 && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {data.map((row) => {
                  const rowId = getRowId(row);
                  const isExpanded = expandedRows.has(rowId);

                  return (
                    <React.Fragment key={rowId}>
                      <tr className="hover:bg-muted/50 transition-colors">
                        {(window.innerWidth < 768 ? priorityColumns : sortedColumns).map((column) => (
                          <td
                            key={column.id}
                            className={cn(
                              "px-4 py-3 text-sm",
                              column.className
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {column.id === priorityColumns[0]?.id && enableCollapse && (
                                <button
                                  onClick={() => toggleRow(rowId)}
                                  className="lg:hidden"
                                  aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </button>
                              )}
                              {getCellValue(row, column)}
                            </div>
                          </td>
                        ))}
                        {rowActions.length > 0 && (
                          <td className="px-4 py-3 text-right text-sm">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  aria-label="Row actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {rowActions.map((action, index) => {
                                  const Icon = action.icon;
                                  return (
                                    <DropdownMenuItem
                                      key={index}
                                      onClick={() => action.onClick(row)}
                                      className={cn(
                                        action.variant === "destructive" && "text-destructive"
                                      )}
                                    >
                                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                                      {action.label}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                      {/* Expandable row details on mobile */}
                      {isExpanded && enableCollapse && (
                        <tr className="lg:hidden">
                          <td colSpan={priorityColumns.length + (rowActions.length > 0 ? 1 : 0)}>
                            <div className="px-4 py-3 bg-muted/30 space-y-2">
                              {sortedColumns.slice(3).map((column) => (
                                <div key={column.id} className="flex justify-between text-sm">
                                  <span className="font-medium text-muted-foreground">
                                    {column.header}:
                                  </span>
                                  <span>{getCellValue(row, column)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card View for Mobile
        <div className="space-y-4">
          {data.map((row) => {
            const rowId = getRowId(row);
            return (
              <div
                key={rowId}
                className={cn(
                  "bg-card rounded-lg border p-4",
                  "shadow-sm hover:shadow-md transition-shadow"
                )}
              >
                <div className="space-y-3">
                  {cardViewColumns.map((column) => (
                    <div key={column.id} className="flex justify-between items-start gap-4">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {column.header}
                      </span>
                      <div className="text-sm text-right">
                        {getCellValue(row, column)}
                      </div>
                    </div>
                  ))}
                </div>
                {rowActions.length > 0 && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {rowActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant={action.variant === "destructive" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => action.onClick(row)}
                          className="flex-1"
                        >
                          {Icon && <Icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
