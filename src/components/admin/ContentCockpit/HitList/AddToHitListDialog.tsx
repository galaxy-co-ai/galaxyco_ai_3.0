"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Search, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { toast } from "sonner";
import type { HitListDifficulty } from "@/db/schema";

// Derive TaskPriority type from the enum values
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface AddToHitListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TopicSuggestion {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  hitListAddedAt: Date | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-400" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "high", label: "High", color: "bg-amber-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

const difficultyOptions: { value: HitListDifficulty; label: string }[] = [
  { value: "easy", label: "Easy (< 2 hours)" },
  { value: "medium", label: "Medium (2-4 hours)" },
  { value: "hard", label: "Hard (4+ hours)" },
];

export function AddToHitListDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddToHitListDialogProps) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new topic
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    difficultyLevel: "medium" as HitListDifficulty,
    targetPublishDate: "",
    estimatedTimeMinutes: "",
  });

  // Selected existing topic
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Fetch existing topics that are NOT in hit list
  const { data: topicsData, isLoading: isLoadingTopics } = useSWR<{
    topics: TopicSuggestion[];
  }>(isOpen ? `/api/admin/topics?limit=100` : null, fetcher);

  // Filter topics that are not in hit list and match search
  const availableTopics =
    topicsData?.topics?.filter(
      (t) =>
        !t.hitListAddedAt &&
        (searchQuery === "" ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  const resetForm = useCallback(() => {
    setMode("search");
    setSearchQuery("");
    setSelectedTopicId(null);
    setError(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      difficultyLevel: "medium",
      targetPublishDate: "",
      estimatedTimeMinutes: "",
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleAddExistingTopic = async () => {
    if (!selectedTopicId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/hit-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopicId,
          priority: formData.priority,
          difficultyLevel: formData.difficultyLevel,
          targetPublishDate: formData.targetPublishDate || undefined,
          estimatedTimeMinutes: formData.estimatedTimeMinutes
            ? parseInt(formData.estimatedTimeMinutes)
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to hit list");
      }

      toast.success("Topic added to hit list");
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewTopic = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/hit-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          difficultyLevel: formData.difficultyLevel,
          targetPublishDate: formData.targetPublishDate || undefined,
          estimatedTimeMinutes: formData.estimatedTimeMinutes
            ? parseInt(formData.estimatedTimeMinutes)
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create topic");
      }

      toast.success("New topic created and added to hit list");
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="add-dialog-title" className="text-lg font-semibold text-gray-900">
            Add to Hit List
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setMode("search")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              mode === "search"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            )}
            aria-selected={mode === "search"}
            role="tab"
          >
            Add Existing Topic
          </button>
          <button
            onClick={() => setMode("create")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              mode === "create"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            )}
            aria-selected={mode === "create"}
            role="tab"
          >
            Create New Topic
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {mode === "search" ? (
            <>
              {/* Search Input */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing topics..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  aria-label="Search topics"
                />
              </div>

              {/* Topics List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {isLoadingTopics ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading topics...
                  </div>
                ) : availableTopics.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery
                      ? "No matching topics found"
                      : "No topics available to add"}
                  </div>
                ) : (
                  availableTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        selectedTopicId === topic.id
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      aria-pressed={selectedTopicId === topic.id}
                    >
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {topic.title}
                      </div>
                      {topic.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {topic.description}
                        </div>
                      )}
                      {topic.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {topic.category}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Show topic options when selected */}
              {selectedTopicId && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                      <label
                        htmlFor="priority"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label
                        htmlFor="difficulty"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Difficulty
                      </label>
                      <select
                        id="difficulty"
                        value={formData.difficultyLevel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            difficultyLevel: e.target.value as HitListDifficulty,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        {difficultyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Date and Time Estimate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="targetDate"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        <Calendar className="inline h-3.5 w-3.5 mr-1" />
                        Target Date
                      </label>
                      <input
                        type="date"
                        id="targetDate"
                        value={formData.targetPublishDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetPublishDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="estimatedTime"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        Est. Time (min)
                      </label>
                      <input
                        type="number"
                        id="estimatedTime"
                        value={formData.estimatedTimeMinutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimatedTimeMinutes: e.target.value,
                          })
                        }
                        placeholder="120"
                        min="0"
                        max="9999"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Create New Topic Form */
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter topic title..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the topic..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Priority and Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="create-priority"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="create-priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="create-difficulty"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Difficulty
                  </label>
                  <select
                    id="create-difficulty"
                    value={formData.difficultyLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficultyLevel: e.target.value as HitListDifficulty,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Date and Time Estimate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="create-targetDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                    Target Date
                  </label>
                  <input
                    type="date"
                    id="create-targetDate"
                    value={formData.targetPublishDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetPublishDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="create-estimatedTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                    Est. Time (min)
                  </label>
                  <input
                    type="number"
                    id="create-estimatedTime"
                    value={formData.estimatedTimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedTimeMinutes: e.target.value,
                      })
                    }
                    placeholder="120"
                    min="0"
                    max="9999"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <NeptuneButton variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </NeptuneButton>
          {mode === "search" ? (
            <NeptuneButton
              variant="primary"
              onClick={handleAddExistingTopic}
              disabled={!selectedTopicId || isSubmitting}
            >
              {isSubmitting ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add to Hit List
                </>
              )}
            </NeptuneButton>
          ) : (
            <NeptuneButton
              variant="primary"
              onClick={handleCreateNewTopic}
              disabled={!formData.title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create & Add
                </>
              )}
            </NeptuneButton>
          )}
        </div>
      </div>
    </div>
  );
}

