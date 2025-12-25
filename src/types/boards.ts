/**
 * Boards Tab Types
 * 
 * Flexible collections system for organizing ideas, brainstorms, and side projects
 * that emerge from Neptune conversations.
 */

export type BoardItemType = 'note' | 'link' | 'image';

export interface BoardItem {
  id: string;
  type: BoardItemType;
  content: string;
  tags?: string[];
  metadata?: {
    title?: string;
    description?: string;
    url?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  items: BoardItem[];
  createdAt: number;
  updatedAt: number;
}

export interface BoardsStorage {
  boards: Board[];
  lastSync: number;
  version: number;
}
