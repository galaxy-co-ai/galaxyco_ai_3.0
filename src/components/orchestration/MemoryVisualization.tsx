'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Clock, Database, Filter, History, Layers, Search, Sparkles, Tag, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MemoryEntry {
  id: string;
  memoryTier: 'short_term' | 'working' | 'long_term';
  category: string;
  key: string;
  value: unknown;
  importance: number;
  metadata: {
    source?: string;
    confidence?: number;
    lastAccessed?: string;
    accessCount?: number;
    tags?: string[];
  };
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemoryVisualizationProps {
  agentId?: string;
  teamId?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const tierConfig = {
  short_term: { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Short-term' },
  working: { icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Working' },
  long_term: { icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Long-term' },
};

export function MemoryVisualization({ agentId, teamId }: MemoryVisualizationProps) {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Build API URL
  const apiUrl = agentId
    ? `/api/orchestration/memory?agentId=${agentId}`
    : teamId
    ? `/api/orchestration/memory?teamId=${teamId}`
    : '/api/orchestration/memory';

  const { data, error, isLoading, mutate } = useSWR<{ memories: MemoryEntry[] }>(apiUrl, fetcher, {
    refreshInterval: 5000,
  });

  const memories = data?.memories || [];

  // Get unique categories
  const categories = [...new Set(memories.map(m => m.category))];

  // Filter memories
  const filteredMemories = memories.filter(memory => {
    if (selectedTier !== 'all' && memory.memoryTier !== selectedTier) return false;
    if (selectedCategory !== 'all' && memory.category !== selectedCategory) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        memory.key.toLowerCase().includes(searchLower) ||
        JSON.stringify(memory.value).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Group by tier for visualization
  const groupedByTier = {
    short_term: filteredMemories.filter(m => m.memoryTier === 'short_term'),
    working: filteredMemories.filter(m => m.memoryTier === 'working'),
    long_term: filteredMemories.filter(m => m.memoryTier === 'long_term'),
  };

  // Stats
  const stats = {
    total: memories.length,
    shortTerm: memories.filter(m => m.memoryTier === 'short_term').length,
    working: memories.filter(m => m.memoryTier === 'working').length,
    longTerm: memories.filter(m => m.memoryTier === 'long_term').length,
    avgImportance: memories.length > 0
      ? Math.round(memories.reduce((acc, m) => acc + m.importance, 0) / memories.length)
      : 0,
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>Loading memory...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="py-6 text-center text-red-400">
          Failed to load memory data
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(tierConfig).map(([tier, config]) => {
          const Icon = config.icon;
          const count = tier === 'short_term' ? stats.shortTerm
            : tier === 'working' ? stats.working
            : stats.longTerm;
          return (
            <Card key={tier} className="border-white/10 bg-white/5 backdrop-blur">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Sparkles className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgImportance}</p>
                <p className="text-xs text-muted-foreground">Avg Importance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>
            </div>

            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
                <SelectValue placeholder="Memory Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="short_term">Short-term</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="long_term">Long-term</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => mutate()}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Memory Visualization */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-white/5">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tiers">By Tier</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Memory Timeline
              </CardTitle>
              <CardDescription>Recent memory entries ordered by time</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {filteredMemories
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map(memory => {
                      const tierCfg = tierConfig[memory.memoryTier];
                      const TierIcon = tierCfg.icon;
                      return (
                        <div
                          key={memory.id}
                          className="flex gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className={cn('p-2 rounded-lg h-fit', tierCfg.bg)}>
                            <TierIcon className={cn('h-4 w-4', tierCfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium truncate">{memory.key}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {memory.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Importance: {memory.importance}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(memory.updatedAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground bg-black/20 p-2 rounded font-mono text-xs overflow-x-auto">
                              {typeof memory.value === 'string'
                                ? memory.value.substring(0, 200)
                                : JSON.stringify(memory.value, null, 2).substring(0, 200)}
                              {(typeof memory.value === 'string' ? memory.value.length : JSON.stringify(memory.value).length) > 200 && '...'}
                            </div>
                            {memory.metadata?.tags && memory.metadata.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {memory.metadata.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {filteredMemories.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No memories found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(groupedByTier).map(([tier, entries]) => {
              const tierCfg = tierConfig[tier as keyof typeof tierConfig];
              const TierIcon = tierCfg.icon;
              return (
                <Card key={tier} className="border-white/10 bg-white/5 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={cn('p-1.5 rounded', tierCfg.bg)}>
                        <TierIcon className={cn('h-4 w-4', tierCfg.color)} />
                      </div>
                      {tierCfg.label}
                      <Badge variant="secondary" className="ml-auto">{entries.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {entries.map(memory => (
                          <div
                            key={memory.id}
                            className="p-3 rounded-lg border border-white/10 bg-white/5"
                          >
                            <p className="font-medium text-sm truncate">{memory.key}</p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {typeof memory.value === 'string'
                                ? memory.value
                                : JSON.stringify(memory.value)}
                            </p>
                          </div>
                        ))}
                        {entries.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">
                            No entries
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
              const categoryEntries = filteredMemories.filter(m => m.category === category);
              return (
                <Card key={category} className="border-white/10 bg-white/5 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="h-4 w-4" />
                      {category}
                      <Badge variant="secondary" className="ml-auto">{categoryEntries.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {categoryEntries.map(memory => (
                          <div
                            key={memory.id}
                            className="p-2 rounded border border-white/10 bg-white/5 text-sm"
                          >
                            <p className="truncate">{memory.key}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
