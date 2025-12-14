"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface ReadingProgressBarProps {
  postId: string;
  className?: string;
}

export function ReadingProgressBar({ postId, className }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const { isSignedIn } = useAuth();

  // Debounced save function
  const saveProgress = useCallback(async (percent: number) => {
    if (!isSignedIn) return;
    
    try {
      await fetch('/api/launchpad/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'progress',
          postId,
          progressPercent: Math.round(percent),
        }),
      });
    } catch (error) {
      // Silently fail - progress tracking is non-critical
      logger.debug('Failed to save reading progress', { error });
    }
  }, [postId, isSignedIn]);

  useEffect(() => {
    let lastSavedProgress = 0;
    let saveTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      
      const percent = Math.min(100, (scrollTop / documentHeight) * 100);
      setProgress(percent);

      // Save progress every 10% increment
      const roundedPercent = Math.floor(percent / 10) * 10;
      if (roundedPercent > lastSavedProgress && isSignedIn) {
        lastSavedProgress = roundedPercent;
        
        // Debounce the save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveProgress(percent);
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(saveTimeout);
    };
  }, [isSignedIn, saveProgress]);

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-muted/50 z-50",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
