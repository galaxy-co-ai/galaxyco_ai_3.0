"use client";

/**
 * Campaign Create Tab Component
 * 
 * Neptune-guided campaign creation experience with dynamic roadmap.
 * Uses 2/3 + 1/3 layout matching Dashboard v2.
 */

import { useState, useEffect, useCallback } from 'react';
import NeptuneAssistPanel from '@/components/conversations/NeptuneAssistPanel';
import CampaignRoadmapCard, { CampaignRoadmapItem } from './CampaignRoadmapCard';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useNeptune } from '@/contexts/neptune-context';

interface CampaignCreateTabProps {
  onCampaignCreated: () => void;
}

export default function CampaignCreateTab({ onCampaignCreated }: CampaignCreateTabProps) {
  const [roadmapItems, setRoadmapItems] = useState<CampaignRoadmapItem[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const { messages } = useNeptune();

  // Calculate completion percentage
  useEffect(() => {
    if (roadmapItems.length === 0) {
      setCompletionPercentage(0);
      setIsReady(false);
      return;
    }

    const completed = roadmapItems.filter(item => item.completed).length;
    const percentage = Math.round((completed / roadmapItems.length) * 100);
    setCompletionPercentage(percentage);
    setIsReady(completed === roadmapItems.length && roadmapItems.length > 0);
  }, [roadmapItems]);

  // Watch Neptune messages for tool results and dispatch events
  useEffect(() => {
    // Get the last assistant message
    const lastMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastMessage || !lastMessage.metadata?.functionCalls) return;

    // Check for tool results in function calls
    for (const funcCall of lastMessage.metadata.functionCalls) {
      const result = funcCall.result?.data as Record<string, unknown> | undefined;
      if (!result) continue;

      // Handle update_campaign_roadmap tool
      if (funcCall.name === 'update_campaign_roadmap' && result.dispatchEvent === 'campaign-roadmap-update') {
        const event = new CustomEvent('campaign-roadmap-update', {
          detail: {
            action: result.action,
            items: result.items,
          },
        });
        window.dispatchEvent(event);
      }

      // Handle launch_campaign tool
      if (funcCall.name === 'launch_campaign' && result.dispatchEvent === 'campaign-launch') {
        const event = new CustomEvent('campaign-launch', {
          detail: {
            campaignData: result.campaignData,
          },
        });
        window.dispatchEvent(event);
      }
    }
  }, [messages]);

  // Listen for roadmap updates from Neptune (via custom events)
  useEffect(() => {
    const handleRoadmapUpdate = (event: CustomEvent) => {
      const { action, items } = event.detail;
      
      if (action === 'add') {
        // Add new items to roadmap
        setRoadmapItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = items.filter((item: CampaignRoadmapItem) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else if (action === 'complete') {
        // Mark items as completed
        setRoadmapItems(prev => 
          prev.map(item => {
            const updated = items.find((i: CampaignRoadmapItem) => i.id === item.id);
            if (updated) {
              return { ...item, completed: true, value: updated.value };
            }
            return item;
          })
        );
      } else if (action === 'replace') {
        // Replace entire roadmap (when Neptune builds it initially)
        setRoadmapItems(items);
      }
    };

    window.addEventListener('campaign-roadmap-update', handleRoadmapUpdate as EventListener);
    return () => {
      window.removeEventListener('campaign-roadmap-update', handleRoadmapUpdate as EventListener);
    };
  }, []);

  // Listen for campaign launch request from Neptune
  useEffect(() => {
    const handleCampaignLaunch = async (event: CustomEvent) => {
      const { campaignData } = event.detail;
      
      try {
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create campaign');
        }

        const data = await response.json();
        toast.success('Campaign created successfully!');
        logger.info('Campaign created via Create tab', { campaignId: data.id });
        
        // Reset roadmap and switch to campaigns tab
        setRoadmapItems([]);
        setCompletionPercentage(0);
        setIsReady(false);
        onCampaignCreated();
      } catch (error) {
        logger.error('Campaign launch error', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
      }
    };

    window.addEventListener('campaign-launch', handleCampaignLaunch as unknown as EventListener);
    return () => {
      window.removeEventListener('campaign-launch', handleCampaignLaunch as unknown as EventListener);
    };
  }, [onCampaignCreated]);

  const handleLaunch = useCallback(async () => {
    if (!isReady) {
      toast.error('Please complete all roadmap items before launching');
      return;
    }

    // Trigger Neptune to create the campaign
    // Neptune will collect all the data and dispatch campaign-launch event
    const event = new CustomEvent('neptune-prompt', {
      detail: { prompt: 'Launch the campaign now with all the information we\'ve collected.' }
    });
    window.dispatchEvent(event);
  }, [isReady]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Content Split: 2/3 Neptune, 1/3 Roadmap */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 px-6 pt-4 pb-6">
        {/* Neptune Chat Interface - 2/3 width */}
        <div className="min-w-0 min-h-0 flex flex-col">
          <NeptuneAssistPanel
            conversationId={null}
            conversation={null}
            variant="fullscreen"
            feature="marketing-create"
          />
        </div>

        {/* Campaign Roadmap Card - 1/3 width */}
        <div className="min-w-0 min-h-0 overflow-hidden flex flex-col">
          <CampaignRoadmapCard
            items={roadmapItems}
            completionPercentage={completionPercentage}
            isReady={isReady}
            onLaunch={handleLaunch}
          />
        </div>
      </div>
    </div>
  );
}
