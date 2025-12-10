"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import type { ContentSourceType } from "@/db/schema";

interface AddSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SourceFormData) => Promise<void>;
}

export interface SourceFormData {
  name: string;
  url: string;
  description?: string;
  type: ContentSourceType;
  tags?: string[];
  aiReviewScore?: number;
  aiReviewNotes?: string;
}

interface AIReviewResult {
  score: number;
  quality: { score: number; notes: string };
  relevance: { score: number; notes: string };
  authority: { score: number; notes: string };
  overallNotes: string;
  suggestedType: ContentSourceType;
  suggestedTags: string[];
  warnings: string[];
}

const typeOptions: { value: ContentSourceType; label: string }[] = [
  { value: "news", label: "News" },
  { value: "research", label: "Research" },
  { value: "competitor", label: "Competitor" },
  { value: "inspiration", label: "Inspiration" },
  { value: "industry", label: "Industry" },
  { value: "other", label: "Other" },
];

export function AddSourceDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddSourceDialogProps) {
  const [formData, setFormData] = useState<SourceFormData>({
    name: "",
    url: "",
    description: "",
    type: "other",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        url: "",
        description: "",
        type: "other",
        tags: [],
      });
      setTagInput("");
      setAiReview(null);
      setReviewError(null);
      setValidationErrors({});
    }
  }, [isOpen]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, url }));
    setAiReview(null);
    setReviewError(null);

    if (url && !validateUrl(url)) {
      setValidationErrors((prev) => ({ ...prev, url: "Please enter a valid URL" }));
    } else {
      setValidationErrors((prev) => {
        const { url: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAIReview = async () => {
    if (!formData.url || !validateUrl(formData.url)) {
      setValidationErrors((prev) => ({
        ...prev,
        url: "Please enter a valid URL to review",
      }));
      return;
    }

    setIsReviewing(true);
    setReviewError(null);

    try {
      const response = await fetch("/api/admin/ai/sources/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to review source");
      }

      const data = await response.json();
      setAiReview(data.review);

      // Auto-fill suggested values if form is empty
      if (!formData.name) {
        // Try to extract name from URL
        try {
          const urlObj = new URL(formData.url);
          const domain = urlObj.hostname.replace("www.", "");
          const name = domain
            .split(".")[0]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          setFormData((prev) => ({ ...prev, name }));
        } catch {
          // Ignore extraction errors
        }
      }

      if (data.review.suggestedType && formData.type === "other") {
        setFormData((prev) => ({ ...prev, type: data.review.suggestedType }));
      }

      if (data.review.suggestedTags?.length && (!formData.tags || formData.tags.length === 0)) {
        setFormData((prev) => ({ ...prev, tags: data.review.suggestedTags }));
      }

      if (data.review.overallNotes && !formData.description) {
        setFormData((prev) => ({ ...prev, description: data.review.overallNotes }));
      }
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Failed to review source"
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && formData.tags && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.url.trim()) errors.url = "URL is required";
    if (!validateUrl(formData.url)) errors.url = "Please enter a valid URL";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        aiReviewScore: aiReview?.score,
        aiReviewNotes: aiReview?.overallNotes,
      });
      onClose();
    } catch (error) {
      setValidationErrors({
        submit: error instanceof Error ? error.message : "Failed to add source",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isLowScore = aiReview && aiReview.score < 70;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-source-title"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 id="add-source-title" className="text-lg font-semibold text-gray-900">
              Add Content Source
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* URL with AI Review */}
            <div className="space-y-2">
              <label htmlFor="source-url" className="block text-sm font-medium text-gray-700">
                URL <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    id="source-url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com"
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
                      validationErrors.url
                        ? "border-red-300 focus:ring-red-500/40 focus:border-red-500"
                        : "border-gray-200"
                    )}
                    aria-invalid={!!validationErrors.url}
                    aria-describedby={validationErrors.url ? "url-error" : undefined}
                  />
                </div>
                <NeptuneButton
                  type="button"
                  variant="default"
                  onClick={handleAIReview}
                  disabled={isReviewing || !formData.url}
                  aria-label="Review source with AI"
                >
                  {isReviewing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  Review
                </NeptuneButton>
              </div>
              {validationErrors.url && (
                <p id="url-error" className="text-xs text-red-500">
                  {validationErrors.url}
                </p>
              )}
            </div>

            {/* AI Review Results */}
            {reviewError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {reviewError}
              </div>
            )}

            {aiReview && (
              <div
                className={cn(
                  "p-4 rounded-lg border",
                  isLowScore ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {isLowScore ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">AI Score: {aiReview.score}/100</span>
                      {isLowScore && (
                        <span className="text-xs text-amber-600 font-medium">Below recommended</span>
                      )}
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="text-center p-2 bg-white/50 rounded">
                        <div className="font-medium text-gray-700">{aiReview.quality.score}</div>
                        <div className="text-gray-500">Quality</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded">
                        <div className="font-medium text-gray-700">{aiReview.relevance.score}</div>
                        <div className="text-gray-500">Relevance</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded">
                        <div className="font-medium text-gray-700">{aiReview.authority.score}</div>
                        <div className="text-gray-500">Authority</div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {aiReview.warnings.length > 0 && (
                      <div className="text-xs text-amber-700 space-y-1">
                        {aiReview.warnings.map((warning, i) => (
                          <p key={i}>⚠️ {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isLowScore && (
                  <p className="mt-3 text-xs text-amber-600">
                    This source has a low AI score. You can still add it by clicking &quot;Add Source&quot;.
                  </p>
                )}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="source-name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="source-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Source name"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
                  validationErrors.name ? "border-red-300" : "border-gray-200"
                )}
                aria-invalid={!!validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="source-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="source-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What does this source cover?"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                )}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label htmlFor="source-type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="source-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as ContentSourceType }))
                }
                className={cn(
                  "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                )}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="source-tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  id="source-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  )}
                />
                <NeptuneButton
                  type="button"
                  variant="ghost"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </NeptuneButton>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {validationErrors.submit && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {validationErrors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <NeptuneButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </NeptuneButton>
              <NeptuneButton
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Adding...
                  </>
                ) : (
                  "Add Source"
                )}
              </NeptuneButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

