"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DateRangePreset = "7d" | "30d" | "90d" | "all";

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  showCompare?: boolean;
  compareEnabled?: boolean;
  onCompareToggle?: (enabled: boolean) => void;
  className?: string;
}

const presetLabels: Record<DateRangePreset, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
};

export function DateRangeSelector({
  value,
  onChange,
  showCompare = false,
  compareEnabled = false,
  onCompareToggle,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <NeptuneButton
            variant="default"
            aria-label="Select date range"
            aria-expanded={isOpen}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {presetLabels[value]}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </NeptuneButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(Object.keys(presetLabels) as DateRangePreset[]).map((preset) => (
            <DropdownMenuItem
              key={preset}
              onClick={() => {
                onChange(preset);
                setIsOpen(false);
              }}
              className={cn(
                "cursor-pointer",
                value === preset && "bg-indigo-50 text-indigo-700"
              )}
            >
              {presetLabels[preset]}
            </DropdownMenuItem>
          ))}
          {showCompare && onCompareToggle && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onCompareToggle(!compareEnabled);
                }}
                className="cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-3 w-3 rounded border",
                      compareEnabled
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    )}
                  >
                    {compareEnabled && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3 text-white"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    )}
                  </span>
                  Compare to Previous
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

