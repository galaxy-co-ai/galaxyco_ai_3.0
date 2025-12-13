"use client";

/**
 * Global Search Component
 * 
 * Features:
 * - Multi-entity search (agents, contacts, tasks, conversations, etc.)
 * - Fuzzy matching for better results
 * - Recent searches with localStorage
 * - Smart suggestions and autocomplete
 * - Keyboard navigation
 * - Search filters by entity type
 * - Debounced input for performance
 * - Quick actions from results
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Bot,
  Users,
  ListTodo,
  MessagesSquare,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

// Entity types
export type SearchEntityType = 'agent' | 'contact' | 'task' | 'conversation' | 'document' | 'event' | 'all';

// Search result interface
export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  href: string;
  relevance?: number;
}

// Recent search interface
interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface GlobalSearchProps {
  onClose?: () => void;
  workspaceId: string;
}

export default function GlobalSearch({ onClose, workspaceId }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SearchEntityType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`recent-searches-${workspaceId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed.slice(0, 5)); // Keep last 5
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, [workspaceId]);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      // Remove duplicates and add new search
      const filtered = prev.filter(s => s.query !== searchQuery);
      const updated = [newSearch, ...filtered].slice(0, 5);
      
      // Save to localStorage
      localStorage.setItem(`recent-searches-${workspaceId}`, JSON.stringify(updated));
      
      return updated;
    });
  }, [workspaceId]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, type: SearchEntityType) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build search params
      const params = new URLSearchParams({
        q: searchQuery,
        type: type,
      });

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery, selectedType);
  }, [debouncedQuery, selectedType, performSearch]);

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    saveRecentSearch(query);
    router.push(result.href);
    onClose?.();
  }, [query, router, onClose, saveRecentSearch]);

  // Handle recent search selection
  const handleRecentSearch = useCallback((search: RecentSearch) => {
    setQuery(search.query);
    inputRef.current?.focus();
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(`recent-searches-${workspaceId}`);
  }, [workspaceId]);

  // Get entity icon
  const getEntityIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'agent':
        return <Bot className="h-4 w-4" />;
      case 'contact':
        return <Users className="h-4 w-4" />;
      case 'task':
        return <ListTodo className="h-4 w-4" />;
      case 'conversation':
        return <MessagesSquare className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  // Get entity color
  const getEntityColor = (type: SearchEntityType) => {
    switch (type) {
      case 'agent':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-950/20';
      case 'contact':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-950/20';
      case 'task':
        return 'text-green-600 bg-green-100 dark:bg-green-950/20';
      case 'conversation':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-950/20';
      case 'document':
        return 'text-slate-600 bg-slate-100 dark:bg-slate-950/20';
      case 'event':
        return 'text-teal-600 bg-teal-100 dark:bg-teal-950/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-950/20';
    }
  };

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<SearchEntityType, SearchResult[]> = {
      agent: [],
      contact: [],
      task: [],
      conversation: [],
      document: [],
      event: [],
      all: [],
    };

    results.forEach(result => {
      if (groups[result.type]) {
        groups[result.type].push(result);
      }
    });

    return groups;
  }, [results]);

  const hasResults = results.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  return (
    <Command className="rounded-lg border shadow-md">
      {/* Search Input */}
      <div className="flex items-center border-b px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder="Search agents, contacts, tasks..."
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {(query || isLoading) && (
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entity Type Filter */}
      <div className="flex items-center gap-1 border-b px-3 py-2 overflow-x-auto">
        {(['all', 'agent', 'contact', 'task', 'conversation', 'document'] as SearchEntityType[]).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
              selectedType === type
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {getEntityIcon(type)}
            <span className="capitalize">{type}</span>
            {type !== 'all' && groupedResults[type].length > 0 && (
              <span className="text-xs opacity-75">({groupedResults[type].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results List */}
      <Command.List className="max-h-[400px] overflow-y-auto p-2">
        {error && (
          <div className="px-3 py-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && !isLoading && !hasResults && !showRecent && query && (
          <div className="px-3 py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground mb-1">No results found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Recent Searches */}
        {showRecent && (
          <Command.Group heading="Recent Searches">
            {recentSearches.map(search => (
              <Command.Item
                key={search.id}
                value={search.query}
                onSelect={() => handleRecentSearch(search)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md aria-selected:bg-accent"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{search.query}</span>
              </Command.Item>
            ))}
            <div className="px-3 pt-2">
              <button
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear recent searches
              </button>
            </div>
          </Command.Group>
        )}

        {/* Search Results */}
        {hasResults && (
          <>
            {selectedType === 'all' ? (
              // Show all results grouped by type
              Object.entries(groupedResults).map(([type, items]) => {
                if (type === 'all' || items.length === 0) return null;
                return (
                  <Command.Group key={type} heading={`${type.charAt(0).toUpperCase() + type.slice(1)}s`}>
                    {items.slice(0, 3).map(result => (
                      <Command.Item
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result)}
                        className="flex items-start gap-3 px-3 py-2 cursor-pointer rounded-md aria-selected:bg-accent"
                      >
                        <div className={cn("p-1.5 rounded", getEntityColor(result.type))}>
                          {getEntityIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })
            ) : (
              // Show filtered results
              <Command.Group heading={`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}s`}>
                {results.map(result => (
                  <Command.Item
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="flex items-start gap-3 px-3 py-2 cursor-pointer rounded-md aria-selected:bg-accent"
                  >
                    <div className={cn("p-1.5 rounded", getEntityColor(result.type))}>
                      {getEntityIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      )}
                      {result.metadata && (
                        <div className="flex items-center gap-2 mt-1">
                          {Object.entries(result.metadata).slice(0, 2).map(([key, value]) => (
                            <Badge key={key} variant="soft" tone="neutral" size="sm" className="text-[10px]">
                              {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </>
        )}

        {/* Trending/Suggestions (when no query) */}
        {!query && !showRecent && (
          <Command.Group heading="Quick Actions">
            <Command.Item className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md aria-selected:bg-accent">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm">View trending items</span>
            </Command.Item>
          </Command.Group>
        )}
      </Command.List>

      {/* Footer */}
      {hasResults && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </div>
      )}
    </Command>
  );
}
