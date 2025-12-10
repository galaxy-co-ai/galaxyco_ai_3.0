"use client";

import { useFormContext } from "react-hook-form";
import { Check, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseCaseFormData } from "../types";

const CHANNEL_OPTIONS = [
  { id: "email", label: "Email Marketing" },
  { id: "social", label: "Social Media" },
  { id: "content", label: "Content/Blog" },
  { id: "paid", label: "Paid Ads" },
  { id: "events", label: "Events/Webinars" },
  { id: "referral", label: "Referral Program" },
  { id: "seo", label: "SEO/Organic" },
  { id: "partnerships", label: "Partnerships" },
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional", description: "Formal, authoritative" },
  { id: "friendly", label: "Friendly", description: "Warm, approachable" },
  { id: "technical", label: "Technical", description: "Detailed, precise" },
  { id: "casual", label: "Casual", description: "Relaxed, conversational" },
  { id: "inspiring", label: "Inspiring", description: "Motivational, ambitious" },
];

export function MarketingStep() {
  const { register, watch, setValue } = useFormContext<UseCaseFormData>();

  const messaging = watch("messaging") || {};
  const selectedChannels = messaging.targetChannels || [];

  const toggleChannel = (channelId: string) => {
    if (selectedChannels.includes(channelId)) {
      setValue(
        "messaging.targetChannels",
        selectedChannels.filter((c) => c !== channelId)
      );
    } else {
      setValue("messaging.targetChannels", [...selectedChannels, channelId]);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Define the marketing messaging and channels for reaching your target
        personas effectively.
      </p>

      {/* Tagline */}
      <div>
        <label
          htmlFor="tagline"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Tagline
        </label>
        <input
          {...register("messaging.tagline")}
          type="text"
          id="tagline"
          placeholder="e.g., Scale your startup without the chaos"
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          A catchy one-liner that captures the essence of this use case
        </p>
      </div>

      {/* Value Proposition */}
      <div>
        <label
          htmlFor="valueProposition"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Value Proposition
        </label>
        <textarea
          {...register("messaging.valueProposition")}
          id="valueProposition"
          rows={3}
          placeholder="Describe the key benefits and unique value this use case delivers..."
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
            "resize-none"
          )}
        />
      </div>

      {/* Target Channels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Target Channels
        </label>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          role="group"
          aria-label="Select marketing channels"
        >
          {CHANNEL_OPTIONS.map((channel) => {
            const isSelected = selectedChannels.includes(channel.id);

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => toggleChannel(channel.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium",
                  "transition-all duration-150",
                  "hover:-translate-y-px hover:shadow-md",
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-500/20"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                )}
                aria-pressed={isSelected}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                >
                  {isSelected && (
                    <Check className="h-3 w-3 text-white" aria-hidden="true" />
                  )}
                </div>
                {channel.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Communication Tone
        </label>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Select communication tone"
        >
          {TONE_OPTIONS.map((tone) => {
            // Store tone in targetChannels with a prefix for simplicity
            const toneKey = `tone:${tone.id}`;
            const isSelected = selectedChannels.some((c) =>
              c.startsWith("tone:")
            )
              ? selectedChannels.includes(toneKey)
              : false;

            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => {
                  // Remove any existing tone selection
                  const withoutTones = selectedChannels.filter(
                    (c) => !c.startsWith("tone:")
                  );
                  setValue("messaging.targetChannels", [...withoutTones, toneKey]);
                }}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border text-left",
                  "transition-all duration-150",
                  "hover:-translate-y-px hover:shadow-md",
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
                role="radio"
                aria-checked={isSelected}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-indigo-900" : "text-gray-900"
                  )}
                >
                  {tone.label}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {tone.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Box */}
      {(messaging.tagline || messaging.valueProposition) && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone
              className="h-5 w-5 text-indigo-600"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-indigo-900">
              Messaging Preview
            </span>
          </div>
          {messaging.tagline && (
            <p className="text-lg font-bold text-gray-900 mb-2">
              &ldquo;{messaging.tagline}&rdquo;
            </p>
          )}
          {messaging.valueProposition && (
            <p className="text-sm text-gray-700">{messaging.valueProposition}</p>
          )}
          {selectedChannels.filter((c) => !c.startsWith("tone:")).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedChannels
                .filter((c) => !c.startsWith("tone:"))
                .map((channelId) => {
                  const channel = CHANNEL_OPTIONS.find(
                    (c) => c.id === channelId
                  );
                  return (
                    <span
                      key={channelId}
                      className="px-2 py-0.5 rounded-full bg-white text-xs font-medium text-indigo-700 border border-indigo-200"
                    >
                      {channel?.label || channelId}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

