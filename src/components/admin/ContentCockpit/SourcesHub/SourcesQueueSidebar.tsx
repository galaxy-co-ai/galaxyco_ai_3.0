"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { SuggestionCard } from "./SourceCard";
import type { ContentSource } from "@/db/schema";

interface SourcesQueueSidebarProps {
  suggestions: ContentSource[];
  isLoading?: boolean;
  onApprove?: (source: ContentSource) => void;
  onReject?: (sourceId: string) => void;
  onDiscoverMore?: () => void;
  isDiscovering?: boolean;
  className?: string;
}

export function SourcesQueueSidebar({
  suggestions,
  isLoading = false,
  onApprove,
  onReject,
  onDiscoverMore,
  isDiscovering = false,
  className,
}: SourcesQueueSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-gradient-to-b from-indigo-50/50 to-purple-50/30 rounded-xl border border-indigo-100",
        "flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-indigo-100">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="suggestions-content"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-sm">AI Suggestions</h3>
              <p className="text-xs text-gray-500">
                {suggestions.length} source{suggestions.length !== 1 ? "s" : ""} to review
              </p>
            </div>
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Content */}
      <div
        id="suggestions-content"
        className={cn(
          "flex-1 overflow-hidden transition-all duration-200",
          isCollapsed ? "max-h-0" : "max-h-[calc(100vh-300px)]"
        )}
      >
        <div className="p-4 space-y-3 overflow-y-auto max-h-full">
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg bg-white/50 h-32"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <Sparkles
                className="h-8 w-8 text-indigo-300 mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-600 mb-3">No suggestions yet</p>
              {onDiscoverMore && (
                <NeptuneButton
                  variant="primary"
                  size="sm"
                  onClick={onDiscoverMore}
                  disabled={isDiscovering}
                  aria-label="Discover new sources with AI"
                >
                  {isDiscovering ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Discover Sources
                    </>
                  )}
                </NeptuneButton>
              )}
            </div>
          ) : (
            // Suggestions list
            <div className="space-y-3">
              {suggestions.map((source) => (
                <SuggestionCard
                  key={source.id}
                  source={source}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Discover Button */}
        {!isCollapsed && suggestions.length > 0 && onDiscoverMore && (
          <div className="p-4 border-t border-indigo-100 bg-white/50">
            <NeptuneButton
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onDiscoverMore}
              disabled={isDiscovering}
              aria-label="Discover more sources"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Discovering...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Discover More
                </>
              )}
            </NeptuneButton>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Mobile-friendly bottom sheet version for suggestions
 */
interface SuggestionsBottomSheetProps extends SourcesQueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuggestionsBottomSheet({
  suggestions,
  isLoading,
  onApprove,
  onReject,
  onDiscoverMore,
  isDiscovering,
  isOpen,
  onClose,
}: SuggestionsBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "bg-white rounded-t-2xl shadow-xl",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="AI Suggestions"
      >
        {/* Handle */}
        <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">AI Suggestions</h3>
              <p className="text-xs text-gray-500">
                {suggestions.length} source{suggestions.length !== 1 ? "s" : ""} to review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close suggestions"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg bg-gray-100 h-32"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles
                className="h-8 w-8 text-indigo-300 mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-600 mb-3">No suggestions yet</p>
              {onDiscoverMore && (
                <NeptuneButton
                  variant="primary"
                  size="sm"
                  onClick={onDiscoverMore}
                  disabled={isDiscovering}
                  aria-label="Discover new sources with AI"
                >
                  {isDiscovering ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Discover Sources
                    </>
                  )}
                </NeptuneButton>
              )}
            </div>
          ) : (
            suggestions.map((source) => (
              <SuggestionCard
                key={source.id}
                source={source}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && onDiscoverMore && (
          <div className="p-4 border-t border-gray-100">
            <NeptuneButton
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onDiscoverMore}
              disabled={isDiscovering}
              aria-label="Discover more sources"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Discovering...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Discover More
                </>
              )}
            </NeptuneButton>
          </div>
        )}
      </div>
    </>
  );
}

