"use client";

import * as React from "react";
import { ExternalLink, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResultDisplay } from "@/types/neptune";

interface SearchResultsCardProps {
  results: SearchResultDisplay[];
  provider?: "perplexity" | "google";
  query?: string;
  className?: string;
}

export function SearchResultsCard({
  results,
  provider = "google",
  query,
  className,
}: SearchResultsCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const displayResults = expanded ? results : results.slice(0, 3);

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <Card className={cn("mt-3 border-2", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {query ? `Results for "${query}"` : "Search Results"}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {provider === "perplexity" ? "Perplexity" : "Google"}
          </Badge>
        </div>

        {/* Results List */}
        <div className="space-y-2">
          {displayResults.map((result, index) => (
            <a
              key={index}
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="shrink-0 mt-0.5">
                  {result.favicon ? (
                    <img
                      src={result.favicon}
                      alt=""
                      className="h-4 w-4"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {result.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {result.snippet}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">{result.displayLink || result.link}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {results.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-primary hover:underline"
          >
            {expanded
              ? `Show less (${results.length - 3} hidden)`
              : `Show ${results.length - 3} more results`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

