"use client";

import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import {
  Building2,
  HeadphonesIcon,
  ShoppingCart,
  Sparkles,
  Wand2,
} from "lucide-react";

export type DepartmentType = "all" | "primary" | "sales" | "support" | "custom";

interface DepartmentFilterProps {
  activeDepartment: DepartmentType;
  onDepartmentChange: (department: DepartmentType) => void;
  counts?: Partial<Record<DepartmentType, number>>;
}

const departments: Array<PillTab<DepartmentType>> = [
  {
    value: "all",
    label: "All",
    Icon: Sparkles,
    activeClassName: "bg-indigo-100 text-indigo-700",
    badgeClassName: "bg-indigo-500",
    ariaLabel: "Filter by All department",
  },
  {
    value: "primary",
    label: "Main",
    Icon: Building2,
    activeClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "bg-blue-500",
    ariaLabel: "Filter by Main department",
  },
  {
    value: "sales",
    label: "Sales",
    Icon: ShoppingCart,
    activeClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "bg-emerald-500",
    ariaLabel: "Filter by Sales department",
  },
  {
    value: "support",
    label: "Support",
    Icon: HeadphonesIcon,
    activeClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "bg-orange-500",
    ariaLabel: "Filter by Support department",
  },
  {
    value: "custom",
    label: "Custom",
    Icon: Wand2,
    activeClassName: "bg-violet-100 text-violet-700",
    badgeClassName: "bg-violet-500",
    ariaLabel: "Filter by Custom department",
  },
];

export default function DepartmentFilter({
  activeDepartment,
  onDepartmentChange,
  counts = {},
}: DepartmentFilterProps) {
  const tabs = departments.map((dept) => ({
    ...dept,
    badge: counts[dept.value],
  }));

  return (
    <PillTabs
      value={activeDepartment}
      onValueChange={onDepartmentChange}
      tabs={tabs}
    />
  );
}
