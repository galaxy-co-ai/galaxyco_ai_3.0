'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Link2,
  Copy,
  Check,
  Loader2,
  Lock,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Share {
  id: string;
  token: string;
  url: string;
  permission: string;
  hasPassword: boolean;
  expiresAt: string | null;
  accessCount: number;
  createdAt: string;
  isExpired: boolean;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: ShareDocumentDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Form state
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('never');

  // Fetch existing shares
  useEffect(() => {
    const fetchShares = async () => {
      if (!open || !documentId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/creator/share?documentId=${documentId}`);
        if (response.ok) {
          const data = await response.json();
          setShares(data.shares || []);
        }
      } catch {
        // Silently handle
      } finally {
        setIsLoading(false);
      }
    };

    fetchShares();
  }, [open, documentId]);

  // Create new share
  const handleCreateShare = async () => {
    if (usePassword && !password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/creator/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorItemId: documentId,
          permission: 'view',
          password: usePassword ? password : undefined,
          expiresIn,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create share');
      }

      const data = await response.json();
      setShares([data.share, ...shares]);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.share.url);
      setCopiedId(data.share.id);
      setTimeout(() => setCopiedId(null), 2000);
      
      toast.success('Share link created and copied to clipboard');
      
      // Reset form
      setUsePassword(false);
      setPassword('');
      setExpiresIn('never');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create share');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy share URL
  const handleCopyUrl = async (share: Share) => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Revoke share
  const handleRevoke = async (share: Share) => {
    setRevokingId(share.id);
    try {
      const response = await fetch(`/api/creator/share/${share.token}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke share');
      }

      setShares(shares.filter(s => s.id !== share.id));
      toast.success('Share link revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke share');
    } finally {
      setRevokingId(null);
    }
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for &quot;{documentTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Create New Share Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium">Create New Link</h4>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiration</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Protection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Label className="text-sm">
                  Password protect
                </Label>
              </div>
              <Switch
                checked={usePassword}
                onCheckedChange={setUsePassword}
                aria-label="Password protect"
              />
            </div>

            {usePassword && (
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Share password"
              />
            )}

            <Button
              onClick={handleCreateShare}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Generate Link
                </>
              )}
            </Button>
          </div>

          {/* Existing Shares */}
          {(isLoading || shares.length > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Active Links</h4>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          share.isExpired ? "bg-muted/50 opacity-60" : "bg-background"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              {share.hasPassword && (
                                <Lock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                              )}
                              {share.isExpired ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  Expired
                                </Badge>
                              ) : share.expiresAt ? (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                                  Expires {formatRelativeTime(share.expiresAt)}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Created {formatRelativeTime(share.createdAt)}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                {share.accessCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyUrl(share)}
                            disabled={share.isExpired}
                            aria-label="Copy link"
                          >
                            {copiedId === share.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(share.url, '_blank')}
                            disabled={share.isExpired}
                            aria-label="Open link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRevoke(share)}
                            disabled={revokingId === share.id}
                            aria-label="Revoke link"
                          >
                            {revokingId === share.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDocumentDialog;

