"use client";

import * as React from "react";
import { MarkdownContent } from "./MarkdownContent";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { SearchResultsCard } from "./SearchResultsCard";
import { cn } from "@/lib/utils";
import type { SearchResultDisplay } from "@/types/neptune";

interface NeptuneMessageProps {
  content: string;
  isStreaming?: boolean;
  metadata?: {
    functionCalls?: Array<{
      name: string;
      result?: {
        success?: boolean;
        data?: unknown;
      };
      autoExecuted?: boolean;
      confidence?: number;
    }>;
    autoExecuted?: boolean;
    confidenceScore?: number;
  };
  className?: string;
}

// Extract URLs from markdown content
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s\)]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

export function NeptuneMessage({
  content,
  isStreaming = false,
  metadata,
  className,
}: NeptuneMessageProps) {
  // Extract URLs from content
  const urls = React.useMemo(() => extractUrls(content), [content]);

  // Check if search_web was used
  const searchWebCall = React.useMemo(() => {
    if (!metadata?.functionCalls) return null;

    const call = metadata.functionCalls.find((fc) => fc.name === "search_web");
    if (!call?.result?.success || !call.result.data) return null;

    const data = call.result.data as {
      query?: string;
      results?: Array<{
        title: string;
        link: string;
        snippet: string;
        displayLink?: string;
      }>;
      provider?: "perplexity" | "google";
    };

    if (!data.results || data.results.length === 0) return null;

    return {
      query: data.query,
      results: data.results.map(
        (r): SearchResultDisplay => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          displayLink: r.displayLink || r.link,
        })
      ),
      provider: data.provider || "google",
    };
  }, [metadata]);

  // Check for auto-executed tools
  const autoExecutedTools = React.useMemo(() => {
    if (!metadata?.functionCalls) return [];
    return metadata.functionCalls
      .filter((fc) => fc.autoExecuted === true)
      .map((fc) => ({
        name: fc.name,
        confidence: fc.confidence || 0,
      }));
  }, [metadata]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Autonomy indicators */}
      {autoExecutedTools.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          {autoExecutedTools.map((tool, idx) => (
            <div
              key={`${tool.name}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
            >
              <span className="font-medium">🤖</span>
              <span className="font-medium">
                {tool.name.replace(/_/g, ' ')}
              </span>
              {tool.confidence > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  ({tool.confidence}% confident)
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main markdown content */}
      <MarkdownContent content={content} />

      {/* Streaming indicator */}
      {isStreaming && (
        <span className="inline-flex items-center gap-1 ml-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      )}

      {/* Search Results Card */}
      {searchWebCall && (
        <SearchResultsCard
          results={searchWebCall.results}
          provider={searchWebCall.provider}
          query={searchWebCall.query}
        />
      )}

      {/* Link Preview Cards */}
      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <LinkPreviewCard key={`${url}-${index}`} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}

