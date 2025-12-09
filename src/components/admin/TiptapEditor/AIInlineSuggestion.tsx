"use client";

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIInlineSuggestionProps {
  isVisible: boolean;
  isLoading: boolean;
  suggestion: string;
  originalText?: string;
  mode?: 'continue' | 'rewrite';
  position: { x: number; y: number };
  onAccept: (text: string) => void;
  onReject: () => void;
  onRegenerate: () => void;
}

export function AIInlineSuggestion({
  isVisible,
  isLoading,
  suggestion,
  originalText,
  mode = 'continue',
  position,
  onAccept,
  onReject,
  onRegenerate,
}: AIInlineSuggestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y;
      
      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 16) {
        x = viewportWidth - rect.width - 16;
      }
      if (x < 16) {
        x = 16;
      }
      
      // Adjust vertical position
      if (y + rect.height > viewportHeight - 16) {
        y = viewportHeight - rect.height - 16;
      }
      
      setAdjustedPosition({ x, y });
    }
  }, [isVisible, position, suggestion]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isVisible || isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        onAccept(suggestion);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isLoading, suggestion, onAccept, onReject]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="AI suggestion"
      aria-live="polite"
      className={cn(
        "fixed z-50 w-96 max-w-[calc(100vw-32px)]",
        "bg-white rounded-lg shadow-xl border border-gray-200",
        "animate-in fade-in-0 slide-in-from-top-2 duration-150"
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-blue-50 rounded-t-lg">
        <div className="flex items-center gap-2 text-xs font-medium text-violet-700">
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>AI Suggestion</span>
            </>
          )}
        </div>
        {!isLoading && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <kbd className="px-1 py-0.5 bg-white rounded border text-gray-600">Tab</kbd>
            <span>accept</span>
            <span className="mx-1">•</span>
            <kbd className="px-1 py-0.5 bg-white rounded border text-gray-600">Esc</kbd>
            <span>dismiss</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/5" />
          </div>
        ) : (
          <>
            {/* Show original text if this is a rewrite */}
            {mode === 'rewrite' && originalText && (
              <div className="mb-3 p-2 bg-gray-50 rounded-md text-sm text-gray-500 line-through">
                {originalText.length > 100 ? originalText.substring(0, 100) + '...' : originalText}
              </div>
            )}
            
            {/* Suggestion preview */}
            <div 
              className={cn(
                "text-sm leading-relaxed",
                "max-h-48 overflow-y-auto",
                "text-gray-800"
              )}
            >
              {suggestion || (
                <span className="text-gray-400 italic">No suggestion generated</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!isLoading && suggestion && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            className="h-7 px-2 text-xs text-gray-600 hover:text-violet-600"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Regenerate
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              className="h-7 px-2 text-xs text-gray-600"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept(suggestion)}
              className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIInlineSuggestion;

