"use client";

/**
 * Roadmap Card Component
 * 
 * Displays roadmap items as badges. Users complete items by discussing with Neptune,
 * who executes the necessary actions.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, Bot, Users, FolderOpen, Plug, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { logger } from '@/lib/logger';

interface RoadmapCardProps {
  workspaceId: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: {
    type: 'navigate' | 'neptune';
    target: string;
    prompt?: string;
  };
  icon: string; // Icon name as string
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Users,
  FolderOpen,
  Plug,
  Sparkles,
};

interface RoadmapData {
  items: RoadmapItem[];
  completionPercentage: number;
}

export default function RoadmapCard({ workspaceId }: RoadmapCardProps) {
  // Initialize with empty data instead of null to prevent "Unable to load" state
  const [roadmapData, setRoadmapData] = useState<RoadmapData>({ items: [], completionPercentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    async function fetchRoadmapData() {
      if (!workspaceId || workspaceId.trim() === '') {
        logger.warn('RoadmapCard: No workspaceId provided', { workspaceId });
        if (isMounted) {
          setIsLoading(false);
          // Don't set roadmapData to null - set empty array so component renders
          setRoadmapData({ items: [], completionPercentage: 0 });
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (isMounted) {
          logger.warn('Roadmap fetch timeout', { workspaceId });
          setIsLoading(false);
          setRoadmapData({ items: [], completionPercentage: 0 });
        }
      }, 10000); // 10 second timeout

      try {
        logger.info('Fetching roadmap data', { workspaceId });
        console.log('[RoadmapCard] Fetching roadmap for workspace:', workspaceId);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second fetch timeout

        const url = `/api/dashboard/roadmap?workspaceId=${encodeURIComponent(workspaceId)}`;
        console.log('[RoadmapCard] Fetch URL:', url);
        const response = await fetch(url, { signal: controller.signal });
        console.log('[RoadmapCard] Response status:', response.status, response.statusText);
        
        clearTimeout(timeout);
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          
          logger.error('Roadmap API error', { 
            status: response.status, 
            statusText: response.statusText,
            error: errorData,
            workspaceId 
          });
          
          if (isMounted) {
            // Set empty data on error so component still renders
            setRoadmapData({ items: [], completionPercentage: 0 });
            setIsLoading(false);
          }
          return;
        }
        
        const data = await response.json();
        console.log('[RoadmapCard] API Response data:', data);
        logger.info('Roadmap data fetched successfully', { 
          itemCount: data.items?.length || 0,
          workspaceId,
          data 
        });
        
        if (!isMounted) return;

        if (!data.items || !Array.isArray(data.items)) {
          logger.warn('Roadmap data missing items array', { data, workspaceId });
          console.warn('[RoadmapCard] Invalid data structure:', data);
          if (isMounted) {
            setRoadmapData({ items: [], completionPercentage: 0 });
            setIsLoading(false);
          }
          return;
        }
        
        console.log('[RoadmapCard] Setting roadmap data with', data.items.length, 'items');
        if (isMounted) {
          setRoadmapData({
            items: data.items,
            completionPercentage: data.completionPercentage || 0
          });
          setIsLoading(false);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          logger.warn('Roadmap fetch aborted (timeout)', { workspaceId });
        } else {
          logger.error('Error fetching roadmap data', { error, workspaceId });
        }
        
        if (isMounted) {
          // Set empty data on error so component still renders
          setRoadmapData({ items: [], completionPercentage: 0 });
          setIsLoading(false);
        }
      }
    }

    fetchRoadmapData();

    // Refresh roadmap when workspace actions complete (listen for custom event)
    const handleRoadmapRefresh = () => {
      fetchRoadmapData();
    };

    window.addEventListener('roadmap-refresh', handleRoadmapRefresh);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('roadmap-refresh', handleRoadmapRefresh);
    };
  }, [workspaceId]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col overflow-hidden">
        {/* Branded Header */}
        <div className="border-b bg-background px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <Compass 
              className="w-6 h-6"
              style={{
                stroke: 'url(#icon-gradient-roadmap-loading)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-roadmap-loading" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h2 
              className="branded-page-title text-xl uppercase"
              style={{ 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              R O A D M A P
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // If no data after loading, show default items (fallback)
  // This handles cases where API fails or returns invalid data
  // Only show default items if we're done loading and have no items
  if (!isLoading && (!roadmapData || !roadmapData.items || roadmapData.items.length === 0)) {
    console.log('[RoadmapCard] Showing default items - no data after loading', {
      isLoading,
      hasData: !!roadmapData,
      itemCount: roadmapData?.items?.length || 0
    });
    logger.warn('RoadmapCard: No items in roadmapData, showing default items', { 
      workspaceId,
      hasData: !!roadmapData,
      itemCount: roadmapData?.items?.length || 0
    });
    // Show default roadmap items if API failed
    const defaultItems: RoadmapItem[] = [
      {
        id: 'create-agent',
        title: 'Create your first AI agent',
        description: 'Build an AI assistant to automate repetitive tasks',
        completed: false,
        priority: 'high',
        action: {
          type: 'neptune',
          target: '/activity?tab=laboratory',
          prompt: 'Help me create my first AI agent',
        },
        icon: 'Bot',
      },
      {
        id: 'add-contacts',
        title: 'Add contacts to your CRM',
        description: 'Start tracking leads and customers',
        completed: false,
        priority: 'high',
        action: {
          type: 'neptune',
          target: '/crm',
          prompt: 'Help me add my first contact to the CRM',
        },
        icon: 'Users',
      },
      {
        id: 'upload-documents',
        title: 'Upload documents to knowledge base',
        description: 'Add files so Neptune can reference them',
        completed: false,
        priority: 'medium',
        action: {
          type: 'neptune',
          target: '/library?tab=upload',
          prompt: 'Help me upload a document to my knowledge base',
        },
        icon: 'FolderOpen',
      },
    ];

    return (
      <Card className="h-full flex flex-col overflow-hidden">
        {/* Branded Header */}
        <div className="border-b bg-background px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass 
                className="w-6 h-6"
                style={{
                  stroke: 'url(#icon-gradient-roadmap)',
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
                }}
              />
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="icon-gradient-roadmap" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <h2 
                className="branded-page-title text-xl uppercase"
                style={{ 
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                }}
              >
                R O A D M A P
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              0/{defaultItems.length}
            </Badge>
          </div>
        </div>

        {/* Content with default items */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              0% complete
            </p>
          </div>

          <div className="space-y-2">
            {defaultItems.map((item) => {
              const IconComponent = iconMap[item.icon] || Sparkles;
              const isExpanded = expandedItemId === item.id;
              
              return (
                <div key={item.id} className="w-full">
                  <Badge
                    onClick={(e) => handleBadgeClick(item, e)}
                    className={`px-3 py-1.5 border transition-colors w-full justify-between cursor-pointer bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100`}
                    aria-label={`Click to view details for ${item.title}`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <IconComponent className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                      <span className="font-semibold truncate" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                    <div className="shrink-0 ml-1.5">
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </Badge>
                  
                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-lg border bg-background shadow-sm">
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>
                      <button
                        onClick={() => handleCompleteWithNeptune(item)}
                        className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                        aria-label={`Complete ${item.title} with Neptune`}
                      >
                        Complete with Neptune
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  // Ensure we have valid data structure
  const items = roadmapData.items || [];
  const completionPercentage = roadmapData.completionPercentage || 0;
  const incompleteItems = items.filter(item => !item.completed);
  const completedCount = items.length - incompleteItems.length;

  const handleBadgeClick = (item: RoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle expanded state
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(item.id);
    }
  };

  const handleCompleteWithNeptune = (item: RoadmapItem) => {
    if (item.completed) return;

    // Trigger Neptune conversation for roadmap items
    // Neptune will help the user complete the task
    const prompt = item.action?.prompt || `Help me ${item.title.toLowerCase()}`;
    const event = new CustomEvent('neptune-prompt', { 
      detail: { prompt } 
    });
    window.dispatchEvent(event);
    
    // Close dropdown after triggering Neptune
    setExpandedItemId(null);
  };

  const getBadgeColor = (item: RoadmapItem) => {
    if (item.completed) {
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    }
    
    switch (item.priority) {
      case 'high':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const getIconColor = (item: RoadmapItem) => {
    if (item.completed) {
      return 'text-green-600';
    }
    
    switch (item.priority) {
      case 'high':
        return 'text-purple-600';
      case 'medium':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Branded Header */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass 
              className="w-6 h-6"
              style={{
                stroke: 'url(#icon-gradient-roadmap)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-roadmap" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h2 
              className="branded-page-title text-xl uppercase"
              style={{ 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              R O A D M A P
            </h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{items.length}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {completionPercentage}% complete
          </p>
        </div>

        {/* Roadmap Items as Badges */}
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No roadmap items</p>
          </div>
        ) : incompleteItems.length === 0 ? (
          <div className="text-center py-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">
              All roadmap items complete! 🎉
            </p>
          </div>
        ) : null}
        
        <div className="space-y-2">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || Sparkles;
            const isExpanded = expandedItemId === item.id;
            
            return (
              <div key={item.id} className="w-full">
                <Badge
                  onClick={(e) => handleBadgeClick(item, e)}
                  className={`px-3 py-1.5 border transition-colors w-full justify-between ${
                    item.completed 
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-default' 
                      : `cursor-pointer ${getBadgeColor(item)}`
                  }`}
                  aria-label={item.completed ? `${item.title} (completed)` : `Click to view details for ${item.title}`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {item.completed ? (
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${getIconColor(item)}`} />
                    ) : (
                      <IconComponent className={`h-3.5 w-3.5 shrink-0 ${getIconColor(item)}`} />
                    )}
                    <span className="font-semibold truncate" title={item.title}>
                      {item.title}
                    </span>
                  </div>
                  {!item.completed && (
                    <div className="shrink-0 ml-1.5">
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  )}
                </Badge>
                
                {/* Expanded Dropdown */}
                {isExpanded && !item.completed && (
                  <div className="mt-2 p-3 rounded-lg border bg-background shadow-sm">
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    <button
                      onClick={() => handleCompleteWithNeptune(item)}
                      className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                      aria-label={`Complete ${item.title} with Neptune`}
                    >
                      Complete with Neptune
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
