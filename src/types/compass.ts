/**
 * Compass Tab Types
 * 
 * Neptune-powered dynamic guidance system that provides contextual micro-lists
 * to keep users on the optimal path toward their goals.
 */

export type CompassCategory = 'quick-wins' | 'next-steps' | 'priorities' | 'bonus';

export interface CompassItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  estimatedTime?: string;
  priority?: number;
}

export interface CompassInsight {
  category: CompassCategory;
  title: string;
  items: CompassItem[];
}

export interface CompassResponse {
  insights: CompassInsight[];
  generatedAt: Date;
  workspaceId: string;
}
