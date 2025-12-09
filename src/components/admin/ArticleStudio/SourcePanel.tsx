"use client";

import { useState, useCallback } from 'react';
import {
  Search,
  Plus,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Loader2,
  BookOpen,
  Link as LinkIcon,
  Calendar,
  Quote,
  Trash2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldX,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Source types
export interface ArticleSource {
  id: string;
  postId: string;
  title: string;
  url: string | null;
  publication: string | null;
  publishedDate: Date | null;
  quoteUsed: string | null;
  claimSupported: string | null;
  verified: boolean;
  verificationStatus: 'verified' | 'unverified' | 'failed';
  verificationMethod: string | null;
  verificationNotes: string | null;
  verifiedAt: Date | null;
  inlinePosition: number | null;
  createdAt: Date;
}

export interface FoundSource {
  title: string;
  url: string;
  publication: string;
  snippet: string;
  publishedDate: string | null;
  confidenceScore: number;
  relevantQuote: string | null;
}

interface SourcePanelProps {
  postId: string;
  sources: ArticleSource[];
  selectedText?: string;
  onSourcesChange: (sources: ArticleSource[]) => void;
  onInsertCitation: (source: ArticleSource, format: 'inline' | 'footnote') => void;
}

export function SourcePanel({
  postId,
  sources,
  selectedText,
  onSourcesChange,
  onInsertCitation,
}: SourcePanelProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [searchResults, setSearchResults] = useState<FoundSource[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [verifyingSourceId, setVerifyingSourceId] = useState<string | null>(null);

  // Manual source form state
  const [manualSource, setManualSource] = useState({
    title: '',
    url: '',
    publication: '',
    quoteUsed: '',
    claimSupported: selectedText || '',
  });

  // Find sources for selected text
  const handleFindSources = useCallback(async () => {
    if (!selectedText?.trim()) {
      toast.error('Please select some text to find sources for');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/admin/ai/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: selectedText,
          postId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find sources');
      }

      const data = await response.json();
      
      if (data.sources && data.sources.length > 0) {
        setSearchResults(data.sources);
        toast.success(`Found ${data.sources.length} potential sources`);
      } else if (data.warning) {
        setSearchError(data.warning);
        toast.warning('Could not verify this claim');
      } else {
        setSearchError('No sources found for this claim');
        toast.info('No sources found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to find sources';
      setSearchError(message);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  }, [selectedText, postId]);

  // Add a found source to the article
  const handleAddFoundSource = useCallback(async (foundSource: FoundSource) => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          title: foundSource.title,
          url: foundSource.url,
          publication: foundSource.publication,
          publishedDate: foundSource.publishedDate,
          quoteUsed: foundSource.relevantQuote,
          claimSupported: selectedText,
          verified: foundSource.confidenceScore >= 0.8,
          verificationStatus: foundSource.confidenceScore >= 0.8 ? 'verified' : 'unverified',
          verificationMethod: 'web_search',
          verificationNotes: `Confidence score: ${(foundSource.confidenceScore * 100).toFixed(0)}%`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add source');
      }

      const newSource = await response.json();
      onSourcesChange([...sources, newSource]);
      setSearchResults([]);
      toast.success('Source added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add source');
    }
  }, [postId, sources, selectedText, onSourcesChange]);

  // Add manual source
  const handleAddManualSource = useCallback(async () => {
    if (!manualSource.title.trim()) {
      toast.error('Please enter a source title');
      return;
    }

    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          title: manualSource.title,
          url: manualSource.url || null,
          publication: manualSource.publication || null,
          quoteUsed: manualSource.quoteUsed || null,
          claimSupported: manualSource.claimSupported || selectedText || null,
          verified: false,
          verificationStatus: 'unverified',
          verificationMethod: 'manual',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add source');
      }

      const newSource = await response.json();
      onSourcesChange([...sources, newSource]);
      setIsAddingManual(false);
      setManualSource({
        title: '',
        url: '',
        publication: '',
        quoteUsed: '',
        claimSupported: '',
      });
      toast.success('Source added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add source');
    }
  }, [postId, sources, selectedText, manualSource, onSourcesChange]);

  // Delete source
  const handleDeleteSource = useCallback(async (sourceId: string) => {
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete source');
      }

      onSourcesChange(sources.filter(s => s.id !== sourceId));
      toast.success('Source removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete source');
    }
  }, [sources, onSourcesChange]);

  // Verify source
  const handleVerifySource = useCallback(async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source?.url) {
      toast.error('Source needs a URL to verify');
      return;
    }

    setVerifyingSourceId(sourceId);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}/verify`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify source');
      }

      const updatedSource = await response.json();
      onSourcesChange(sources.map(s => s.id === sourceId ? updatedSource : s));
      toast.success(updatedSource.verified ? 'Source verified!' : 'Verification failed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify source');
    } finally {
      setVerifyingSourceId(null);
    }
  }, [sources, onSourcesChange]);

  // Get verification status icon and color
  const getVerificationBadge = (status: ArticleSource['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            <ShieldX className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  const verifiedCount = sources.filter(s => s.verificationStatus === 'verified').length;
  const unverifiedCount = sources.filter(s => s.verificationStatus !== 'verified').length;

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold">Sources</h3>
        </div>
        
        {/* Stats */}
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-white">
            {sources.length} total
          </Badge>
          {verifiedCount > 0 && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {verifiedCount} verified
            </Badge>
          )}
          {unverifiedCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {unverifiedCount} unverified
            </Badge>
          )}
        </div>
      </div>

      {/* Find Source Section */}
      <div className="p-4 border-b bg-white">
        <div className="space-y-3">
          {selectedText ? (
            <div className="p-3 rounded-lg bg-violet-50/50 border border-violet-200">
              <p className="text-xs font-medium text-violet-700 mb-1">Selected text:</p>
              <p className="text-sm text-violet-900 line-clamp-3">&ldquo;{selectedText}&rdquo;</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select text in the editor to find supporting sources
            </p>
          )}
          
          <Button
            onClick={handleFindSources}
            disabled={!selectedText || isSearching}
            className="w-full"
            aria-label="Find sources for selected text"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Sources
              </>
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Found {searchResults.length} sources:
            </p>
            {searchResults.map((result, index) => (
              <Card key={index} className="border-violet-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground">{result.publication}</p>
                      {result.snippet && (
                        <p className="text-xs mt-1 line-clamp-2">{result.snippet}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px]",
                            result.confidenceScore >= 0.8 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : result.confidenceScore >= 0.5
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {(result.confidenceScore * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddFoundSource(result)}
                      aria-label={`Add ${result.title} as source`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchResults([])}
              className="w-full text-xs"
            >
              Dismiss results
            </Button>
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Verification Warning</p>
                <p className="text-xs text-amber-700 mt-1">{searchError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No sources added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Find sources for your claims or add them manually
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <Card key={source.id} className="group">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getVerificationBadge(source.verificationStatus)}
                      </div>
                      <p className="font-medium text-sm truncate">{source.title}</p>
                      {source.publication && (
                        <p className="text-xs text-muted-foreground">{source.publication}</p>
                      )}
                      {source.claimSupported && (
                        <p className="text-xs mt-1 text-muted-foreground line-clamp-1">
                          <span className="font-medium">Claim: </span>{source.claimSupported}
                        </p>
                      )}
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-1"
                          aria-label={`Open source: ${source.title}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View source
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {/* Insert Citation */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onInsertCitation(source, 'inline')}
                        aria-label="Insert inline citation"
                        title="Insert citation"
                      >
                        <Quote className="h-3.5 w-3.5" />
                      </Button>
                      
                      {/* Verify */}
                      {source.verificationStatus !== 'verified' && source.url && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleVerifySource(source.id)}
                          disabled={verifyingSourceId === source.id}
                          aria-label="Verify source"
                          title="Verify source"
                        >
                          {verifyingSourceId === source.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      
                      {/* Delete */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSource(source.id)}
                        aria-label="Delete source"
                        title="Delete source"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Manual Source Button */}
      <div className="p-4 border-t bg-white">
        <Button
          variant="outline"
          onClick={() => setIsAddingManual(true)}
          className="w-full"
          aria-label="Add source manually"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Source Manually
        </Button>
      </div>

      {/* Manual Source Dialog */}
      <Dialog open={isAddingManual} onOpenChange={setIsAddingManual}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Source Manually</DialogTitle>
            <DialogDescription>
              Add a source citation that you&apos;ve found yourself
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-title">Title *</Label>
              <Input
                id="source-title"
                value={manualSource.title}
                onChange={(e) => setManualSource({ ...manualSource, title: e.target.value })}
                placeholder="Article or document title"
                aria-required="true"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-url">URL</Label>
              <Input
                id="source-url"
                type="url"
                value={manualSource.url}
                onChange={(e) => setManualSource({ ...manualSource, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-publication">Publication</Label>
              <Input
                id="source-publication"
                value={manualSource.publication}
                onChange={(e) => setManualSource({ ...manualSource, publication: e.target.value })}
                placeholder="e.g., TechCrunch, Harvard Business Review"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-quote">Relevant Quote</Label>
              <Input
                id="source-quote"
                value={manualSource.quoteUsed}
                onChange={(e) => setManualSource({ ...manualSource, quoteUsed: e.target.value })}
                placeholder="The exact quote from the source"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-claim">Claim Supported</Label>
              <Input
                id="source-claim"
                value={manualSource.claimSupported}
                onChange={(e) => setManualSource({ ...manualSource, claimSupported: e.target.value })}
                placeholder="What claim does this source support?"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingManual(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddManualSource}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SourcePanel;

