"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Expand,
  Minimize2,
  Quote,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AICommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface AICommandPaletteProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onContinue: () => void;
  onRephrase: () => void;
  onExpand: () => void;
  onShorten: () => void;
  onFindSource: () => void;
  onSuggestImage: () => void;
  onOpenBrainstorm?: () => void;
}

export function AICommandPalette({
  isOpen,
  position,
  onClose,
  onContinue,
  onRephrase,
  onExpand,
  onShorten,
  onFindSource,
  onSuggestImage,
  onOpenBrainstorm,
}: AICommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const commands: AICommandItem[] = [
    {
      id: 'continue',
      label: 'Continue writing...',
      description: 'AI continues from cursor',
      icon: <Sparkles className="h-4 w-4" />,
      shortcut: '⌘↵',
      action: onContinue,
    },
    {
      id: 'rephrase',
      label: 'Rephrase',
      description: 'Reword selection',
      icon: <RefreshCw className="h-4 w-4" />,
      action: onRephrase,
    },
    {
      id: 'expand',
      label: 'Expand with detail',
      description: 'Add more depth',
      icon: <Expand className="h-4 w-4" />,
      action: onExpand,
    },
    {
      id: 'shorten',
      label: 'Make more concise',
      description: 'Shorten text',
      icon: <Minimize2 className="h-4 w-4" />,
      action: onShorten,
    },
    {
      id: 'source',
      label: 'Find source for this',
      description: 'Research citation',
      icon: <Quote className="h-4 w-4" />,
      action: onFindSource,
    },
    {
      id: 'image',
      label: 'Suggest image here',
      description: 'AI image suggestion',
      icon: <ImageIcon className="h-4 w-4" />,
      action: onSuggestImage,
    },
    ...(onOpenBrainstorm ? [{
      id: 'brainstorm',
      label: 'Open brainstorm chat',
      description: 'Discuss with AI',
      icon: <MessageSquare className="h-4 w-4" />,
      action: onOpenBrainstorm,
    }] : []),
  ];

  // Adjust position to stay within viewport
  useEffect(() => {
    if (isOpen && paletteRef.current) {
      const rect = paletteRef.current.getBoundingClientRect();
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
        y = position.y - rect.height - 16;
      }
      
      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  // Reset selection when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % commands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
        break;
      case 'Enter':
        e.preventDefault();
        commands[selectedIndex].action();
        onClose();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, commands, selectedIndex, onClose]);

  // Add keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={paletteRef}
      role="listbox"
      aria-label="AI commands"
      className={cn(
        "fixed z-50 w-72",
        "bg-white rounded-lg shadow-lg border border-gray-200",
        "animate-in fade-in-0 zoom-in-95 duration-100"
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span>AI COMMANDS</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close command palette"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      {/* Commands list */}
      <div className="py-1 max-h-80 overflow-y-auto">
        {commands.map((command, index) => (
          <button
            key={command.id}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => {
              command.action();
              onClose();
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
              index === selectedIndex 
                ? "bg-violet-50 text-violet-900" 
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-md",
              index === selectedIndex ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
            )}>
              {command.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{command.label}</div>
              <div className="text-xs text-gray-500 truncate">{command.description}</div>
            </div>
            {command.shortcut && (
              <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 rounded text-gray-500">
                {command.shortcut}
              </kbd>
            )}
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400">
        <span className="font-medium">↑↓</span> navigate • <span className="font-medium">↵</span> select • <span className="font-medium">esc</span> close
      </div>
    </div>
  );
}

export default AICommandPalette;

