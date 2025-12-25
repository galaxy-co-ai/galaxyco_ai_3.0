/**
 * Boards Storage Hook
 * 
 * Custom hook for managing board collections in localStorage.
 * Provides CRUD operations, validation, quota monitoring, and auto-cleanup.
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { Board, BoardItem, BoardsStorage, BoardItemType } from '@/types/boards';

const STORAGE_KEY_PREFIX = 'boards';
const STORAGE_VERSION = 1;
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB
const RETENTION_DAYS = 30;

interface UseBoardsStorageReturn {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  createBoard: (name: string, description?: string, emoji?: string) => Board;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  addItem: (boardId: string, type: BoardItemType, content: string, metadata?: BoardItem['metadata']) => void;
  updateItem: (boardId: string, itemId: string, updates: Partial<BoardItem>) => void;
  deleteItem: (boardId: string, itemId: string) => void;
  getBoard: (id: string) => Board | undefined;
  searchBoards: (query: string) => Board[];
  exportBoard: (id: string) => string;
  storageInfo: { used: number; percentage: number };
}

export function useBoardsStorage(workspaceId: string): UseBoardsStorageReturn {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);

  const storageKey = `${STORAGE_KEY_PREFIX}-${workspaceId}`;

  // Calculate storage size
  const calculateStorageSize = useCallback((data: BoardsStorage): number => {
    return new Blob([JSON.stringify(data)]).size;
  }, []);

  // Load boards from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: BoardsStorage = JSON.parse(stored);
        
        // Version check
        if (parsed.version !== STORAGE_VERSION) {
          logger.warn('[Boards] Storage version mismatch, clearing data', {
            expected: STORAGE_VERSION,
            found: parsed.version,
          });
          localStorage.removeItem(storageKey);
          setBoards([]);
          setIsLoading(false);
          return;
        }

        // Auto-cleanup old items
        const cutoffDate = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const cleanedBoards = parsed.boards.map(board => ({
          ...board,
          items: board.items.filter(item => item.createdAt > cutoffDate),
        }));

        setBoards(cleanedBoards);
        setStorageUsed(calculateStorageSize(parsed));
        
        logger.debug('[Boards] Loaded boards from storage', {
          count: cleanedBoards.length,
          size: calculateStorageSize(parsed),
        });
      }
    } catch (err) {
      logger.error('[Boards] Failed to load from storage', err);
      setError('Failed to load boards. Your data may be corrupted.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, storageKey, calculateStorageSize]);

  // Save boards to localStorage
  const saveToStorage = useCallback((updatedBoards: Board[]) => {
    try {
      const data: BoardsStorage = {
        boards: updatedBoards,
        lastSync: Date.now(),
        version: STORAGE_VERSION,
      };

      const size = calculateStorageSize(data);
      
      // Check storage quota
      if (size > MAX_STORAGE_SIZE) {
        setError(`Storage limit exceeded (${(size / 1024 / 1024).toFixed(2)}MB / ${MAX_STORAGE_SIZE / 1024 / 1024}MB). Please delete some boards or items.`);
        return false;
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
      setStorageUsed(size);
      setError(null);
      
      logger.debug('[Boards] Saved to storage', { count: updatedBoards.length, size });
      return true;
    } catch (err) {
      logger.error('[Boards] Failed to save to storage', err);
      setError('Failed to save boards. Storage may be full.');
      return false;
    }
  }, [storageKey, calculateStorageSize]);

  // Create new board
  const createBoard = useCallback((name: string, description?: string, emoji?: string): Board => {
    const newBoard: Board = {
      id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      description,
      emoji: emoji || '📋',
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBoards(prev => {
      const updated = [...prev, newBoard];
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Created board', { id: newBoard.id, name });
    return newBoard;
  }, [saveToStorage]);

  // Update board
  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    setBoards(prev => {
      const updated = prev.map(board =>
        board.id === id
          ? { ...board, ...updates, updatedAt: Date.now() }
          : board
      );
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Updated board', { id, updates: Object.keys(updates) });
  }, [saveToStorage]);

  // Delete board
  const deleteBoard = useCallback((id: string) => {
    setBoards(prev => {
      const updated = prev.filter(board => board.id !== id);
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Deleted board', { id });
  }, [saveToStorage]);

  // Add item to board
  const addItem = useCallback((
    boardId: string,
    type: BoardItemType,
    content: string,
    metadata?: BoardItem['metadata']
  ) => {
    const newItem: BoardItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      content,
      metadata,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBoards(prev => {
      const updated = prev.map(board =>
        board.id === boardId
          ? {
              ...board,
              items: [...board.items, newItem],
              updatedAt: Date.now(),
            }
          : board
      );
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Added item', { boardId, itemId: newItem.id, type });
  }, [saveToStorage]);

  // Update item
  const updateItem = useCallback((boardId: string, itemId: string, updates: Partial<BoardItem>) => {
    setBoards(prev => {
      const updated = prev.map(board =>
        board.id === boardId
          ? {
              ...board,
              items: board.items.map(item =>
                item.id === itemId
                  ? { ...item, ...updates, updatedAt: Date.now() }
                  : item
              ),
              updatedAt: Date.now(),
            }
          : board
      );
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Updated item', { boardId, itemId });
  }, [saveToStorage]);

  // Delete item
  const deleteItem = useCallback((boardId: string, itemId: string) => {
    setBoards(prev => {
      const updated = prev.map(board =>
        board.id === boardId
          ? {
              ...board,
              items: board.items.filter(item => item.id !== itemId),
              updatedAt: Date.now(),
            }
          : board
      );
      saveToStorage(updated);
      return updated;
    });

    logger.info('[Boards] Deleted item', { boardId, itemId });
  }, [saveToStorage]);

  // Get specific board
  const getBoard = useCallback((id: string): Board | undefined => {
    return boards.find(board => board.id === id);
  }, [boards]);

  // Search across all boards
  const searchBoards = useCallback((query: string): Board[] => {
    if (!query.trim()) return boards;

    const lowerQuery = query.toLowerCase();
    return boards.filter(board => {
      // Search board name and description
      if (board.name.toLowerCase().includes(lowerQuery)) return true;
      if (board.description?.toLowerCase().includes(lowerQuery)) return true;

      // Search items
      return board.items.some(item => {
        if (item.content.toLowerCase().includes(lowerQuery)) return true;
        if (item.metadata?.title?.toLowerCase().includes(lowerQuery)) return true;
        if (item.metadata?.description?.toLowerCase().includes(lowerQuery)) return true;
        if (item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
        return false;
      });
    });
  }, [boards]);

  // Export board as markdown
  const exportBoard = useCallback((id: string): string => {
    const board = boards.find(b => b.id === id);
    if (!board) return '';

    let markdown = `# ${board.emoji || ''} ${board.name}\n\n`;
    
    if (board.description) {
      markdown += `${board.description}\n\n`;
    }

    markdown += `*Created: ${new Date(board.createdAt).toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    board.items.forEach((item, index) => {
      markdown += `## ${index + 1}. `;
      
      if (item.type === 'link') {
        markdown += `[${item.metadata?.title || 'Link'}](${item.content})\n\n`;
        if (item.metadata?.description) {
          markdown += `${item.metadata.description}\n\n`;
        }
      } else if (item.type === 'image') {
        markdown += `${item.metadata?.title || 'Image'}\n\n`;
        markdown += `![${item.metadata?.description || ''}](${item.content})\n\n`;
      } else {
        markdown += `Note\n\n${item.content}\n\n`;
      }

      if (item.tags && item.tags.length > 0) {
        markdown += `*Tags: ${item.tags.join(', ')}*\n\n`;
      }
    });

    return markdown;
  }, [boards]);

  return {
    boards,
    isLoading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    addItem,
    updateItem,
    deleteItem,
    getBoard,
    searchBoards,
    exportBoard,
    storageInfo: {
      used: storageUsed,
      percentage: (storageUsed / MAX_STORAGE_SIZE) * 100,
    },
  };
}
