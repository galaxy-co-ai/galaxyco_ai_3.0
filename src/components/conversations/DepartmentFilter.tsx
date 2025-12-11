"use client";

import { Badge } from "@/components/ui/badge";
import { Building2, ShoppingCart, HeadphonesIcon, Sparkles } from "lucide-react";

export type DepartmentType = 'all' | 'primary' | 'sales' | 'support' | 'custom';

interface DepartmentFilterProps {
  activeDepartment: DepartmentType;
  onDepartmentChange: (department: DepartmentType) => void;
  counts?: Partial<Record<DepartmentType, number>>;
}

const departments: Array<{
  value: DepartmentType;
  label: string;
  icon: typeof Building2;
  activeColor: string;
  badgeColor: string;
}> = [
  { value: 'all', label: 'All', icon: Sparkles, activeColor: 'bg-indigo-100 text-indigo-700', badgeColor: 'bg-indigo-500' },
  { value: 'primary', label: 'Main', icon: Building2, activeColor: 'bg-blue-100 text-blue-700', badgeColor: 'bg-blue-500' },
  { value: 'sales', label: 'Sales', icon: ShoppingCart, activeColor: 'bg-green-100 text-green-700', badgeColor: 'bg-green-500' },
  { value: 'support', label: 'Support', icon: HeadphonesIcon, activeColor: 'bg-orange-100 text-orange-700', badgeColor: 'bg-orange-500' },
];

export default function DepartmentFilter({ activeDepartment, onDepartmentChange, counts = {} }: DepartmentFilterProps) {
  return (
    <div className="flex justify-center">
      <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
        {departments.map((department) => {
          const Icon = department.icon;
          const isActive = activeDepartment === department.value;
          const count = counts[department.value];
          
          return (
            <button
              key={department.value}
              onClick={() => onDepartmentChange(department.value)}
              className={`relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? `${department.activeColor} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Filter by ${department.label} department`}
            >
              <Icon className="h-4 w-4" />
              <span>{department.label}</span>
              {count !== undefined && count > 0 && (
                <Badge 
                  className={`${isActive ? 'bg-white/90 text-gray-700' : department.badgeColor + ' text-white'} text-xs px-1.5 py-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
