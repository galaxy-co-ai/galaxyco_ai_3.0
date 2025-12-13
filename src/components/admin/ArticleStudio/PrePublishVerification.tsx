"use client";

import { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ArticleSource } from './SourcePanel';

interface VerificationIssue {
  type: 'unverified_claim' | 'failed_source' | 'missing_source';
  severity: 'warning' | 'error';
  message: string;
  source?: ArticleSource;
  suggestedAction?: string;
}

interface PrePublishVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  sources: ArticleSource[];
  isPublishing?: boolean;
}

export function PrePublishVerification({
  isOpen,
  onClose,
  onPublish,
  sources,
  isPublishing = false,
}: PrePublishVerificationProps) {
  const [acknowledgedIssues, setAcknowledgedIssues] = useState<Set<string>>(new Set());
  const [verifyingSourceId, setVerifyingSourceId] = useState<string | null>(null);

  // Calculate verification issues
  const issues = useMemo<VerificationIssue[]>(() => {
    const result: VerificationIssue[] = [];

    // Check for unverified sources
    sources.forEach((source) => {
      if (source.verificationStatus === 'unverified') {
        result.push({
          type: 'unverified_claim',
          severity: 'warning',
          message: `Source "${source.title}" has not been verified`,
          source,
          suggestedAction: source.url 
            ? 'Click to verify this source automatically' 
            : 'Add a URL to enable verification',
        });
      } else if (source.verificationStatus === 'failed') {
        result.push({
          type: 'failed_source',
          severity: 'error',
          message: `Source "${source.title}" failed verification`,
          source,
          suggestedAction: 'Review and update this source or remove it',
        });
      }
    });

    return result;
  }, [sources]);

  // Group issues by severity
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const allIssuesAcknowledged = issues.every((_, index) => 
    acknowledgedIssues.has(`issue-${index}`)
  );

  // Handle acknowledge toggle
  const handleAcknowledge = (issueId: string, checked: boolean) => {
    const newSet = new Set(acknowledgedIssues);
    if (checked) {
      newSet.add(issueId);
    } else {
      newSet.delete(issueId);
    }
    setAcknowledgedIssues(newSet);
  };

  // Handle verify source
  const handleVerifySource = async (source: ArticleSource) => {
    if (!source.url) {
      toast.error('Source needs a URL to verify');
      return;
    }

    setVerifyingSourceId(source.id);
    try {
      const response = await fetch(`/api/admin/sources/${source.id}/verify`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify source');
      }

      // Reload to refresh sources - parent should handle this
      toast.success('Verification complete. Please refresh to see updated status.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify source');
    } finally {
      setVerifyingSourceId(null);
    }
  };

  // Handle publish with verification
  const handlePublish = () => {
    if (errorCount > 0 && !allIssuesAcknowledged) {
      toast.error('Please acknowledge all issues before publishing');
      return;
    }
    onPublish();
  };

  // Get overall status
  const getOverallStatus = () => {
    if (errorCount > 0) {
      return {
        icon: ShieldX,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        message: 'Issues found that require attention',
      };
    }
    if (warningCount > 0) {
      return {
        icon: ShieldAlert,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        message: 'Some sources are unverified',
      };
    }
    return {
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      message: 'All sources verified',
    };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            Pre-Publish Verification
          </DialogTitle>
          <DialogDescription>
            Review source verification status before publishing
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Overall Status */}
          <Alert className={cn(status.bgColor, status.borderColor)}>
            <StatusIcon className={cn("h-4 w-4", status.color)} />
            <AlertTitle className={status.color}>
              {issues.length === 0 ? 'Ready to Publish' : `${issues.length} Issue${issues.length !== 1 ? 's' : ''} Found`}
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {status.message}
            </AlertDescription>
          </Alert>

          {/* Source Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Source Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {sources.filter(s => s.verificationStatus === 'verified').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {sources.filter(s => s.verificationStatus === 'unverified').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Unverified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {sources.filter(s => s.verificationStatus === 'failed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">ISSUES TO REVIEW</h4>
              
              {issues.map((issue, index) => {
                const issueId = `issue-${index}`;
                const isAcknowledged = acknowledgedIssues.has(issueId);
                
                return (
                  <Card 
                    key={issueId}
                    className={cn(
                      "transition-all",
                      issue.severity === 'error' 
                        ? "border-red-200 bg-red-50/50" 
                        : "border-amber-200 bg-amber-50/50",
                      isAcknowledged && "opacity-60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Acknowledge checkbox */}
                        <div className="pt-0.5">
                          <Checkbox
                            id={issueId}
                            checked={isAcknowledged}
                            onCheckedChange={(checked) => handleAcknowledge(issueId, checked as boolean)}
                            aria-label="Acknowledge this issue"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Issue header */}
                          <div className="flex items-center gap-2 mb-1">
                            {issue.severity === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            )}
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px]",
                                issue.severity === 'error' 
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              )}
                            >
                              {issue.severity === 'error' ? 'Error' : 'Warning'}
                            </Badge>
                          </div>
                          
                          {/* Issue message */}
                          <p className="text-sm font-medium">{issue.message}</p>
                          
                          {/* Suggested action */}
                          {issue.suggestedAction && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {issue.suggestedAction}
                            </p>
                          )}
                          
                          {/* Source actions */}
                          {issue.source && (
                            <div className="flex items-center gap-2 mt-2">
                              {issue.source.url && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleVerifySource(issue.source!)}
                                    disabled={verifyingSourceId === issue.source.id}
                                  >
                                    {verifyingSourceId === issue.source.id ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                    )}
                                    Verify Now
                                  </Button>
                                  <a
                                    href={issue.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Source
                                  </a>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No Issues */}
          {issues.length === 0 && sources.length > 0 && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <p className="font-medium">All sources verified!</p>
              <p className="text-sm text-muted-foreground">
                Your article is ready to publish
              </p>
            </div>
          )}

          {/* No Sources */}
          {sources.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Sources Added</AlertTitle>
              <AlertDescription>
                Consider adding sources to support the claims in your article.
                You can still publish without sources.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || (errorCount > 0 && !allIssuesAcknowledged)}
            aria-label={errorCount > 0 && !allIssuesAcknowledged 
              ? "Acknowledge all issues to enable publishing" 
              : "Publish article"}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : issues.length > 0 && !allIssuesAcknowledged ? (
              <>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Acknowledge Issues to Publish
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Publish Article
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrePublishVerification;

