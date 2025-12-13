"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Megaphone,
  BookOpen,
  FileText,
  Bot,
  Newspaper,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export interface SearchResult {
  id: string;
  type: "contact" | "campaign" | "knowledge" | "creator" | "agent" | "blog";
  title: string;
  description: string | null;
  url: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

interface SearchResultsProps {
  results: SearchResult[];
  categories?: {
    contacts: SearchResult[];
    campaigns: SearchResult[];
    knowledge: SearchResult[];
    creator: SearchResult[];
    agents: SearchResult[];
    blog: SearchResult[];
  };
  isLoading?: boolean;
  query: string;
  onSelect?: (result: SearchResult) => void;
  onClose?: () => void;
  className?: string;
  maxHeight?: string;
}

// Icon mapping
const typeIcons: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  contact: User,
  campaign: Megaphone,
  knowledge: BookOpen,
  creator: FileText,
  agent: Bot,
  blog: Newspaper,
};

// Category labels
const categoryLabels: Record<string, string> = {
  contacts: "Contacts",
  campaigns: "Campaigns",
  knowledge: "Knowledge Base",
  creator: "Documents",
  agents: "Agents",
  blog: "Blog Posts",
};

// Category colors for badges
const categoryColors: Record<string, string> = {
  contacts: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  campaigns: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  knowledge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  creator: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  agents: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  blog: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

/**
 * SearchResults Component
 * 
 * A dropdown component that displays categorized search results with:
 * - Keyboard navigation (arrow keys, Enter to select, Escape to close)
 * - Loading and empty states
 * - Grouped results by category
 * - Accessible with ARIA labels
 */
export function SearchResults({
  results,
  categories,
  isLoading,
  query,
  onSelect,
  onClose,
  className,
  maxHeight = "400px",
}: SearchResultsProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Flatten categories into ordered list for keyboard navigation
  const flatResults = React.useMemo(() => {
    if (categories) {
      return [
        ...categories.contacts,
        ...categories.campaigns,
        ...categories.knowledge,
        ...categories.creator,
        ...categories.agents,
        ...categories.blog,
      ];
    }
    return results;
  }, [categories, results]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults.length, query]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!flatResults.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
          break;
        case "Enter":
          e.preventDefault();
          const selected = flatResults[selectedIndex];
          if (selected) {
            handleSelect(selected);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flatResults, selectedIndex, onClose]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    router.push(result.url);
    onClose?.();
  };

  // Group results by category for display
  const groupedCategories = React.useMemo(() => {
    if (categories) {
      return Object.entries(categories)
        .filter(([_, items]) => items.length > 0)
        .map(([key, items]) => ({
          key,
          label: categoryLabels[key] || key,
          items,
        }));
    }
    
    // Group flat results by type
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      const key = result.type + "s";
      if (!groups[key]) groups[key] = [];
      groups[key].push(result);
    });
    
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([key, items]) => ({
        key,
        label: categoryLabels[key] || key,
        items,
      }));
  }, [categories, results]);

  // Track flat index for keyboard navigation
  let flatIndex = -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute top-full left-0 right-0 mt-2 z-50",
        "bg-popover border border-border rounded-lg shadow-lg overflow-hidden",
        className
      )}
      role="listbox"
      aria-label="Search results"
    >
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Searching...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && flatResults.length === 0 && query.length >= 2 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Search className="h-8 w-8 opacity-50" aria-hidden="true" />
            <span className="text-sm">No results found for &quot;{query}&quot;</span>
            <span className="text-xs opacity-70">Try different keywords</span>
          </div>
        )}

        {/* Min query length hint */}
        {!isLoading && query.length < 2 && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <span className="text-sm">Type at least 2 characters to search</span>
          </div>
        )}

        {/* Results by category */}
        {!isLoading && groupedCategories.length > 0 && (
          <div className="divide-y divide-border">
            {groupedCategories.map((category) => (
              <div key={category.key} className="py-2">
                {/* Category header */}
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      categoryColors[category.key] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {category.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.items.length} result{category.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Category items */}
                <div>
                  {category.items.map((result) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    const Icon = typeIcons[result.type];

                    return (
                      <button
                        key={result.id}
                        data-index={flatIndex}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-3 text-left transition-colors",
                          "focus:outline-none focus:ring-0",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center",
                            isSelected ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {highlightMatch(result.title, query)}
                          </div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {highlightMatch(result.description, query)}
                            </div>
                          )}
                        </div>

                        {/* Arrow on hover/select */}
                        {isSelected && (
                          <ArrowRight
                            className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with keyboard hints */}
      {flatResults.length > 0 && (
        <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
              close
            </span>
          </div>
          <span>{flatResults.length} result{flatResults.length !== 1 ? "s" : ""}</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Highlight matching text in search results
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

export default SearchResults;

