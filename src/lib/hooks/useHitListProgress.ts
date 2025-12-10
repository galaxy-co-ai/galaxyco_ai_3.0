"use client";

import { useCallback, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * Progress stages for the Article Studio wizard flow
 * Maps stage names to their completion percentages
 */
export const WIZARD_STAGES = {
  topic_selected: 0,
  brainstorm_started: 15,
  outline_created: 30,
  writing_started: 50,
  first_draft_complete: 70,
  editing: 85,
  ready_to_publish: 95,
  published: 100,
} as const;

export type WizardStage = keyof typeof WIZARD_STAGES;

interface UseHitListProgressOptions {
  /** Topic ID from Hit List (null if not writing from hit list) */
  topicId: string | null;
  /** Debounce delay in milliseconds (default: 5000ms) */
  debounceMs?: number;
  /** Callback when progress update fails */
  onError?: (error: Error) => void;
}

interface UseHitListProgressReturn {
  /** Update the current wizard stage */
  updateProgress: (stage: WizardStage, completedSteps?: string[]) => void;
  /** Reset all progress */
  resetProgress: () => void;
  /** Check if we're tracking progress for a hit list item */
  isTracking: boolean;
}

/**
 * Hook for tracking Article Studio wizard progress against Hit List items.
 * 
 * - Debounces API calls to prevent spam (max 1 per 5 seconds by default)
 * - Only tracks progress when topicId is provided
 * - Automatically updates status to 'in_progress' when wizard starts
 * 
 * @example
 * ```tsx
 * const { updateProgress, isTracking } = useHitListProgress({ topicId });
 * 
 * // When user completes brainstorming
 * updateProgress('brainstorm_started');
 * 
 * // When outline is generated
 * updateProgress('outline_created', ['brainstorm', 'outline']);
 * ```
 */
export function useHitListProgress({
  topicId,
  debounceMs = 5000,
  onError,
}: UseHitListProgressOptions): UseHitListProgressReturn {
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{
    stage: WizardStage;
    completedSteps?: string[];
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendProgressUpdate = useCallback(
    async (stage: WizardStage, completedSteps?: string[]) => {
      if (!topicId) return;

      try {
        const response = await fetch(`/api/admin/hit-list/${topicId}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            percentage: WIZARD_STAGES[stage],
            currentStep: stage,
            completedSteps,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update progress");
        }

        lastUpdateRef.current = Date.now();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        logger.error("Failed to update hit list progress", { error: err, topicId, stage });
        onError?.(err);
      }
    },
    [topicId, onError]
  );

  const updateProgress = useCallback(
    (stage: WizardStage, completedSteps?: string[]) => {
      if (!topicId) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // If we've waited long enough, send immediately
      if (timeSinceLastUpdate >= debounceMs) {
        sendProgressUpdate(stage, completedSteps);
        pendingUpdateRef.current = null;
        return;
      }

      // Otherwise, store the pending update and schedule it
      pendingUpdateRef.current = { stage, completedSteps };

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule the update for when debounce period ends
      const delay = debounceMs - timeSinceLastUpdate;
      timeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current) {
          sendProgressUpdate(
            pendingUpdateRef.current.stage,
            pendingUpdateRef.current.completedSteps
          );
          pendingUpdateRef.current = null;
        }
      }, delay);
    },
    [topicId, debounceMs, sendProgressUpdate]
  );

  const resetProgress = useCallback(async () => {
    if (!topicId) return;

    try {
      const response = await fetch(`/api/admin/hit-list/${topicId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset progress");
      }

      lastUpdateRef.current = Date.now();
      pendingUpdateRef.current = null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      logger.error("Failed to reset hit list progress", { error: err, topicId });
      onError?.(err);
    }
  }, [topicId, onError]);

  return {
    updateProgress,
    resetProgress,
    isTracking: !!topicId,
  };
}

