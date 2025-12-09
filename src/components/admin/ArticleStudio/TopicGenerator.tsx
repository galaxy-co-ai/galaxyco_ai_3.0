"use client";

import { useState, useCallback } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Lightbulb, 
  BookmarkPlus, 
  ArrowRight,
  RefreshCw,
  FileText,
  AlertTriangle,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Type for a generated topic
interface GeneratedTopic {
  title: string;
  description: string;
  whyItWorks: string;
  suggestedLayout: 'standard' | 'how-to' | 'listicle' | 'case-study' | 'tool-review' | 'news' | 'opinion';
  category: string;
  generatedBy?: 'ai' | 'user';
  aiPrompt?: string;
  similarExisting?: string[];
  isFillsGap?: boolean;
}

// Type for content gap
interface ContentGap {
  topic: string;
  reason: string;
  suggestedAngle: string;
}

// Type for similarity warning
interface SimilarityWarning {
  newTopic: string;
  existingPosts: string[];
  similarityReason: string;
}

// Type for a saved topic from the database
interface SavedTopic {
  id: string;
  title: string;
  description: string | null;
  whyItWorks: string | null;
  status: 'saved' | 'in_progress' | 'published' | 'archived';
  suggestedLayout: string | null;
  category: string | null;
  generatedBy: 'ai' | 'user';
  createdAt: string;
}

interface TopicGeneratorProps {
  onSelectTopic?: (topic: GeneratedTopic) => void;
  onStartWriting?: (topic: GeneratedTopic) => void;
}

// Layout badge colors
const layoutColors: Record<string, string> = {
  'standard': 'bg-zinc-50 text-zinc-700 border-zinc-200',
  'how-to': 'bg-blue-50 text-blue-700 border-blue-200',
  'listicle': 'bg-purple-50 text-purple-700 border-purple-200',
  'case-study': 'bg-green-50 text-green-700 border-green-200',
  'tool-review': 'bg-amber-50 text-amber-700 border-amber-200',
  'news': 'bg-red-50 text-red-700 border-red-200',
  'opinion': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

// Status badge colors
const statusColors: Record<string, string> = {
  'saved': 'bg-zinc-50 text-zinc-700 border-zinc-200',
  'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'published': 'bg-green-50 text-green-700 border-green-200',
  'archived': 'bg-amber-50 text-amber-700 border-amber-200',
};

export function TopicGenerator({ onSelectTopic, onStartWriting }: TopicGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [isSavingId, setIsSavingId] = useState<number | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [warnings, setWarnings] = useState<SimilarityWarning[]>([]);
  const [postsAnalyzed, setPostsAnalyzed] = useState(0);

  // Load saved topics from database
  const loadSavedTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    try {
      const response = await fetch('/api/admin/topics?status=saved&limit=10');
      if (!response.ok) throw new Error('Failed to fetch topics');
      const data = await response.json();
      setSavedTopics(data.topics || []);
    } catch (error) {
      toast.error('Failed to load saved topics');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  // Generate topic ideas with AI
  const generateTopics = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a topic or question');
      return;
    }

    setIsGenerating(true);
    setGeneratedTopics([]);
    setContentGaps([]);
    setWarnings([]);

    try {
      const response = await fetch('/api/admin/ai/topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count: 5,
          analyzeGaps: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate topics');
      }

      const data = await response.json();
      setGeneratedTopics(data.topics || []);
      setContentGaps(data.contentGaps || []);
      setWarnings(data.warnings || []);
      setPostsAnalyzed(data.existingPostsAnalyzed || 0);
      
      const gapsCount = data.contentGaps?.length || 0;
      toast.success(`Generated ${data.topics?.length || 0} topic ideas${gapsCount > 0 ? ` (${gapsCount} content gaps identified)` : ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate topics');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save a topic to the bank
  const saveTopic = async (topic: GeneratedTopic, index: number) => {
    setIsSavingId(index);
    try {
      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic.title,
          description: topic.description,
          whyItWorks: topic.whyItWorks,
          suggestedLayout: topic.suggestedLayout,
          category: topic.category,
          generatedBy: 'ai',
          aiPrompt: prompt,
          status: 'saved',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save topic');
      }

      const savedTopic = await response.json();
      setSavedTopics(prev => [savedTopic, ...prev]);
      toast.success('Topic saved to bank');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save topic');
    } finally {
      setIsSavingId(null);
    }
  };

  // Handle start writing
  const handleStartWriting = (topic: GeneratedTopic) => {
    if (onStartWriting) {
      onStartWriting(topic);
    }
  };

  // Handle key press for Enter to generate
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating) {
      generateTopics();
    }
  };

  return (
    <div className="space-y-6">
      {/* Topic Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Topic Generator
          </CardTitle>
          <CardDescription>
            Describe what you want to write about and AI will suggest compelling topic ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., 'How AI is transforming small business operations' or 'Tips for first-time startup founders'"
              className="flex-1"
              disabled={isGenerating}
              aria-label="Topic prompt input"
            />
            <Button
              onClick={generateTopics}
              disabled={isGenerating || !prompt.trim()}
              aria-label={isGenerating ? 'Generating topics...' : 'Generate topic ideas'}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
          
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {[
              'Product launch strategies',
              'Remote work best practices',
              'AI tools for marketing',
              'Customer retention tactics',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                disabled={isGenerating}
                aria-label={`Use suggestion: ${suggestion}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Gaps Section */}
      {contentGaps.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <Target className="h-5 w-5" />
              Content Gaps Identified
            </CardTitle>
            <CardDescription className="text-green-700">
              Based on {postsAnalyzed} published posts, these topics would fill gaps in your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentGaps.map((gap, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white border border-green-200"
                >
                  <h4 className="font-medium text-green-900">{gap.topic}</h4>
                  <p className="text-sm text-green-700 mt-1">{gap.reason}</p>
                  {gap.suggestedAngle && (
                    <p className="text-xs text-green-600 mt-2 italic">
                      Suggested angle: {gap.suggestedAngle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Topics */}
      {generatedTopics.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Generated Ideas</CardTitle>
              <CardDescription>{generatedTopics.length} topic suggestions</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateTopics}
              disabled={isGenerating}
              aria-label="Regenerate topics"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedTopics.map((topic, index) => (
                <div
                  key={index}
                  className={cn(
                    "group p-4 rounded-lg border bg-card hover:shadow-sm transition-all",
                    topic.similarExisting && topic.similarExisting.length > 0 && "border-amber-200 bg-amber-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-medium text-base line-clamp-1">
                          {topic.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", layoutColors[topic.suggestedLayout])}
                        >
                          {topic.suggestedLayout.replace('-', ' ')}
                        </Badge>
                        {topic.isFillsGap && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Fills Gap
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {topic.description}
                      </p>
                      
                      {/* Similarity warning */}
                      {topic.similarExisting && topic.similarExisting.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-100 rounded p-2 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>
                            Similar to: {topic.similarExisting.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {topic.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveTopic(topic, index)}
                        disabled={isSavingId === index}
                        aria-label={`Save topic: ${topic.title}`}
                      >
                        {isSavingId === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartWriting(topic)}
                        aria-label={`Start writing: ${topic.title}`}
                      >
                        Start Writing
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Why it works - expandable */}
                  <details className="mt-3 group/details">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      Why this works
                    </summary>
                    <p className="text-sm text-muted-foreground mt-2 pl-2 border-l-2 border-muted">
                      {topic.whyItWorks}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similarity Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Content Overlap Warnings
            </CardTitle>
            <CardDescription className="text-amber-700">
              Some suggested topics may overlap with existing content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white border border-amber-200"
                >
                  <h4 className="font-medium text-amber-900">{warning.newTopic}</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {warning.similarityReason}
                  </p>
                  {warning.existingPosts.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Related posts: {warning.existingPosts.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Topics Bank */}
      {savedTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Saved Topics
            </CardTitle>
            <CardDescription>
              Your topic bank - ideas saved for later
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTopics ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y">
                {savedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="py-3 flex items-center gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{topic.title}</span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", statusColors[topic.status])}
                        >
                          {topic.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartWriting({
                        title: topic.title,
                        description: topic.description || '',
                        whyItWorks: topic.whyItWorks || '',
                        suggestedLayout: (topic.suggestedLayout as GeneratedTopic['suggestedLayout']) || 'standard',
                        category: topic.category || 'General',
                      })}
                      aria-label={`Use topic: ${topic.title}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state for first use */}
      {generatedTopics.length === 0 && savedTopics.length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-amber-500/50" />
          <h3 className="text-lg font-medium mb-2">Generate Your First Topic</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter what you want to write about above and let AI suggest compelling angles
            that will engage your readers.
          </p>
        </div>
      )}
    </div>
  );
}

