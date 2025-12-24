"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@clerk/nextjs';
import { 
  Search, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  Circle, 
  ExternalLink,
  FileText,
  Video,
  Folder,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  type: 'document' | 'video' | 'guide';
  lastUpdated: string;
  views: number;
  starred?: boolean;
}

interface QuickTip {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface TutorialProgress {
  id: string;
  title: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTime: string;
}

export function TrainingResources() {
  const { orgId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch training data
  const { data, isLoading } = useSWR<{
    knowledgeBase: KnowledgeItem[];
    quickTips: QuickTip[];
    tutorials: TutorialProgress[];
    categories: string[];
  }>(
    orgId ? `/api/neptune-hq/training?workspaceId=${orgId}` : null,
    fetcher
  );

  const filteredKnowledge = data?.knowledgeBase.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'guide': return BookOpen;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-9 text-xs"
              >
                All
              </Button>
              {data?.categories.slice(0, 4).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-9 text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Base */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Knowledge Base
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {filteredKnowledge.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredKnowledge.length > 0 ? (
                <div className="divide-y">
                  {filteredKnowledge.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div className={cn(
                          "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                          item.type === 'document' && "bg-blue-100 text-blue-600",
                          item.type === 'video' && "bg-purple-100 text-purple-600",
                          item.type === 'guide' && "bg-green-100 text-green-600"
                        )}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            {item.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {item.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {item.views} views
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No resources found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Tips + Tutorial Progress */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : data?.quickTips && data.quickTips.length > 0 ? (
                <div className="divide-y">
                  {data.quickTips.slice(0, 4).map((tip) => (
                    <div key={tip.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <p className="text-xs font-medium">{tip.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">No tips available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tutorial Progress */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : data?.tutorials && data.tutorials.length > 0 ? (
                <div className="space-y-4">
                  {data.tutorials.map((tutorial) => (
                    <div key={tutorial.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{tutorial.title}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {tutorial.estimatedTime}
                        </div>
                      </div>
                      <Progress value={tutorial.progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{tutorial.completedSteps}/{tutorial.totalSteps} steps</span>
                        <span>{tutorial.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No tutorials started yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
