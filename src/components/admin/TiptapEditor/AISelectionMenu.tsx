"use client";

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Minimize2,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectionAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface AISelectionMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onHide: () => void;
  onImprove: (text: string) => void;
  onRephrase: (text: string) => void;
  onShorten: (text: string) => void;
  onFindSource: (text: string) => void;
}

export function AISelectionMenu({
  isVisible,
  position,
  selectedText,
  onHide,
  onImprove,
  onRephrase,
  onShorten,
  onFindSource,
}: AISelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const actions: SelectionAction[] = [
    {
      id: 'improve',
      label: 'Improve',
      icon: <Sparkles className="h-3.5 w-3.5" />,
      action: () => onImprove(selectedText),
    },
    {
      id: 'rephrase',
      label: 'Rephrase',
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      action: () => onRephrase(selectedText),
    },
    {
      id: 'shorten',
      label: 'Shorten',
      icon: <Minimize2 className="h-3.5 w-3.5" />,
      action: () => onShorten(selectedText),
    },
    {
      id: 'source',
      label: 'Source',
      icon: <Quote className="h-3.5 w-3.5" />,
      action: () => onFindSource(selectedText),
    },
  ];

  // Adjust position to stay within viewport
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let x = position.x - rect.width / 2; // Center on position
      let y = position.y - rect.height - 8; // Above selection
      
      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 16) {
        x = viewportWidth - rect.width - 16;
      }
      if (x < 16) {
        x = 16;
      }
      
      // Adjust vertical position (show below if not enough space above)
      if (y < 16) {
        y = position.y + 8;
      }
      
      setAdjustedPosition({ x, y });
    }
  }, [isVisible, position]);

  // Close on click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onHide();
      }
    };

    // Delay to avoid closing immediately after selection
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      role="toolbar"
      aria-label="AI text actions"
      className={cn(
        "fixed z-50",
        "flex items-center gap-0.5 p-1",
        "bg-white rounded-lg shadow-lg border border-gray-200",
        "animate-in fade-in-0 zoom-in-95 duration-100"
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            action.action();
            onHide();
          }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5",
            "text-xs font-medium text-gray-600",
            "hover:bg-violet-50 hover:text-violet-700",
            "rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
          )}
          title={action.label}
          aria-label={action.label}
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default AISelectionMenu;

