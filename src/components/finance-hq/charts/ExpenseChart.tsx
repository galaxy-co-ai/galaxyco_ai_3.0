"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Expense category data
 */
interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

/**
 * Chart configuration for expense categories
 */
const chartConfig = {
  operations: {
    label: "Operations",
    color: "hsl(var(--chart-1))",
  },
  marketing: {
    label: "Marketing",
    color: "hsl(var(--chart-2))",
  },
  payroll: {
    label: "Payroll",
    color: "hsl(var(--chart-3))",
  },
  software: {
    label: "Software",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

/**
 * Default colors for pie chart segments
 */
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface ExpenseChartProps {
  data?: ExpenseCategory[];
  total?: number;
  isLoading?: boolean;
}

/**
 * Donut chart showing expense breakdown by category.
 * Displays total in the center.
 */
export function ExpenseChart({ data, total, isLoading }: ExpenseChartProps) {
  if (isLoading) {
    return <ExpenseChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Expense Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No expense data available for this period.
        </div>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || COLORS[index % COLORS.length],
  }));

  return (
    <Card className="p-6 rounded-2xl shadow-sm border" role="img" aria-label="Expense breakdown chart">
      <h3 className="text-lg font-semibold text-foreground mb-4">Expense Breakdown</h3>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span className="font-mono">
                    {formatCurrency(value as number)}
                  </span>
                )}
              />
            }
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          />
          {/* Center label */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
          >
            <tspan x="50%" dy="-0.5em" className="text-lg font-bold">
              {total ? formatCurrency(total) : ""}
            </tspan>
            <tspan x="50%" dy="1.5em" className="text-xs fill-muted-foreground">
              Total
            </tspan>
          </text>
        </PieChart>
      </ChartContainer>
    </Card>
  );
}

/**
 * Loading skeleton for ExpenseChart
 */
export function ExpenseChartSkeleton() {
  return (
    <Card className="p-6 rounded-2xl shadow-sm border">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="h-64 flex items-center justify-center">
        <Skeleton className="h-44 w-44 rounded-full" />
      </div>
    </Card>
  );
}















































