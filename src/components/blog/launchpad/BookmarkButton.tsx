"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface BookmarkButtonProps {
  postId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BookmarkButton({ 
  postId, 
  variant = 'ghost', 
  size = 'icon',
  className 
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();

  // Check initial bookmark state
  useEffect(() => {
    if (!isSignedIn) return;

    const checkBookmark = async () => {
      try {
        const response = await fetch(`/api/launchpad/engagement?type=bookmarks`);
        if (response.ok) {
          const data = await response.json();
          const isBookmarkedPost = data.bookmarks?.some(
            (b: { postId: string }) => b.postId === postId
          );
          setIsBookmarked(isBookmarkedPost);
        }
      } catch (err) {
        logger.debug('Failed to check bookmark status', { error: err });
      }
    };

    checkBookmark();
  }, [postId, isSignedIn]);

  const handleToggleBookmark = async () => {
    if (!isSignedIn) {
      toast.info('Sign in to save articles');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/launchpad/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bookmark',
          postId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.bookmarked);
        toast.success(data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
      } else {
        throw new Error('Failed to update bookmark');
      }
    } catch {
      toast.error('Could not update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        isBookmarked && "text-primary",
        className
      )}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
}
