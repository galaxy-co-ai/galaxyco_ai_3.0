"use client";

import * as React from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/types/finance";

/**
 * Preset date range options
 */
const presets = [
  {
    label: "Last 7 days",
    getValue: () => ({
      start: subDays(new Date(), 7),
      end: new Date(),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      start: subDays(new Date(), 30),
      end: new Date(),
    }),
  },
  {
    label: "Last 90 days",
    getValue: () => ({
      start: subDays(new Date(), 90),
      end: new Date(),
    }),
  },
  {
    label: "This month",
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "Year to date",
    getValue: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    }),
  },
];

interface FinanceDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * Date range picker with presets for common financial periods.
 * Uses react-day-picker Calendar component.
 */
export function FinanceDatePicker({ value, onChange }: FinanceDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ start: range.from, end: range.to });
    } else if (range?.from) {
      onChange({ start: range.from, end: range.from });
    }
  };

  const handlePresetClick = (preset: (typeof presets)[number]) => {
    onChange(preset.getValue());
    setOpen(false);
  };

  const formatDateRange = () => {
    if (value.start && value.end) {
      if (format(value.start, "yyyy-MM-dd") === format(value.end, "yyyy-MM-dd")) {
        return format(value.start, "MMM d, yyyy");
      }
      return `${format(value.start, "MMM d")} - ${format(value.end, "MMM d, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[240px]",
            !value && "text-muted-foreground"
          )}
          aria-label="Select date range"
          aria-expanded={open}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span className="flex-1">{formatDateRange()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Quick select
            </p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm font-normal"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={value.start}
              selected={{
                from: value.start,
                to: value.end,
              }}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

