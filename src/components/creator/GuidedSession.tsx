"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Loader2,
  Sparkles,
  Check,
  Circle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  type DocumentTypeConfig,
  type RequirementItem,
  getCompletionPercentage,
  isComplete,
} from "./documentRequirements";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  requirementId?: string; // Links message to a requirement
}

interface GuidedSessionProps {
  docType: DocumentTypeConfig;
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
}

export default function GuidedSession({
  docType,
  onComplete,
  onBack,
}: GuidedSessionProps) {
  // State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const completionPercentage = getCompletionPercentage(docType, answers);
  const allComplete = isComplete(docType, answers);

  // Get current requirement being asked
  const currentRequirement = docType.requirements[currentRequirementIndex];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with Neptune's intro message
  useEffect(() => {
    const introMessage: ChatMessage = {
      id: "intro",
      role: "assistant",
      content: docType.neptuneIntro,
      timestamp: new Date(),
    };

    // Add the first question after a delay
    setTimeout(() => {
      const firstQuestion: ChatMessage = {
        id: "q-0",
        role: "assistant",
        content: docType.requirements[0].question,
        timestamp: new Date(),
        requirementId: docType.requirements[0].id,
      };
      setMessages([introMessage, firstQuestion]);
    }, 500);
  }, [docType]);

  // Handle user sending a message - accepts optional override to avoid stale closure issues
  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const messageToSend = messageOverride ?? input;
      if (!messageToSend.trim() || isLoading) return;

      const userInput = messageToSend.trim();
      setInput("");
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userInput,
        timestamp: new Date(),
        requirementId: currentRequirement?.id,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Save the answer locally for the requirements checklist and document generator
      if (currentRequirement) {
        setAnswers((prev) => ({
          ...prev,
          [currentRequirement.id]: userInput,
        }));
      }

      try {
        // Call Neptune assistant for a real acknowledgment
        setIsTyping(true);

        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userInput,
            context: {
              workspace: "Creator",
              feature: "content",
              page: "creator-guided-session",
              type: docType.id,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage =
            errorData?.error || `Neptune error: HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const assistantText =
          data.message?.content ||
          (typeof data.message === "string" ? data.message : null) ||
          data.content ||
          getAcknowledgment(currentRequirement?.label || "");

        const assistantMessage: ChatMessage = {
          id: `ack-${Date.now()}`,
          role: "assistant",
          content: assistantText,
          timestamp: new Date(),
        };

        // Move to next requirement or finish after the AI acknowledgment
        const nextIndex = currentRequirementIndex + 1;

        if (nextIndex < docType.requirements.length) {
          const nextRequirement = docType.requirements[nextIndex];

          const nextQuestion: ChatMessage = {
            id: `q-${nextIndex}`,
            role: "assistant",
            content: nextRequirement.question,
            timestamp: new Date(),
            requirementId: nextRequirement.id,
          };

          setMessages((prev) => [...prev, assistantMessage, nextQuestion]);
          setCurrentRequirementIndex(nextIndex);
        } else {
          const completeMessage: ChatMessage = {
            id: `complete-${Date.now()}`,
            role: "assistant",
            content: `Perfect. I have everything I need to create your ${docType.name.toLowerCase()}. Click "Continue" when you're ready, or update any answers from the checklist.`,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage, completeMessage]);
        }
      } catch (error) {
        logger.error("Creator GuidedSession Neptune error", error);
        const errorMsg =
          error instanceof Error ? error.message : "Connection issue. Please try again.";

        // Fallback: use local acknowledgment so flow never blocks
        const fallbackAck: ChatMessage = {
          id: `ack-${Date.now()}`,
          role: "assistant",
          content: `${getAcknowledgment(currentRequirement?.label || "")} (${errorMsg})`,
          timestamp: new Date(),
        };

        const nextIndex = currentRequirementIndex + 1;

        if (nextIndex < docType.requirements.length) {
          const nextRequirement = docType.requirements[nextIndex];
          const nextQuestion: ChatMessage = {
            id: `q-${nextIndex}`,
            role: "assistant",
            content: nextRequirement.question,
            timestamp: new Date(),
            requirementId: nextRequirement.id,
          };
          setMessages((prev) => [...prev, fallbackAck, nextQuestion]);
          setCurrentRequirementIndex(nextIndex);
        } else {
          const completeMessage: ChatMessage = {
            id: `complete-${Date.now()}`,
            role: "assistant",
            content: `I think we have what we need. Click "Continue" when you're ready. (${errorMsg})`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, fallbackAck, completeMessage]);
        }

        toast.error(errorMsg);
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    },
    [
      input,
      isLoading,
      currentRequirement,
      currentRequirementIndex,
      docType.id,
      docType.name,
    ]
  );

  // Handle clicking a requirement in the checklist to update it
  const handleRequirementClick = (req: RequirementItem, index: number) => {
    if (answers[req.id]) {
      // Allow editing - jump to that requirement
      const editMessage: ChatMessage = {
        id: `edit-${Date.now()}`,
        role: "assistant",
        content: `Let's update your answer for "${req.label}". ${req.question}`,
        timestamp: new Date(),
        requirementId: req.id,
      };
      setMessages((prev) => [...prev, editMessage]);
      setCurrentRequirementIndex(index);
    }
  };

  // Handle select-type requirements - pass option directly to avoid stale closure
  const handleOptionSelect = (option: string) => {
    if (isLoading) return;
    handleSend(option);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Neptune Chat */}
      <Card className="flex-1 flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Neptune</h3>
                <p className="text-xs text-violet-600">
                  Creating your {docType.name.toLowerCase()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Select options if current requirement has them */}
          {currentRequirement?.type === "select" &&
            currentRequirement.options &&
            !answers[currentRequirement.id] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 pl-2"
              >
                {currentRequirement.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium",
                      "bg-violet-50 text-violet-700 border border-violet-200",
                      "hover:bg-violet-100 hover:border-violet-300",
                      "transition-all active:scale-95",
                      "disabled:opacity-50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                currentRequirement?.placeholder ||
                "Type your response..."
              }
              className="flex-1 rounded-full"
              disabled={isLoading || allComplete}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Right Panel - Requirements Checklist */}
      <Card className="w-80 flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2 rounded-xl text-white shadow-lg bg-gradient-to-br", docType.gradientFrom, docType.gradientTo)}>
              <docType.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{docType.name}</h3>
              <p className="text-xs text-gray-500">Requirements</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-emerald-600">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Requirements List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {docType.requirements.map((req, index) => {
              const hasAnswer = !!answers[req.id]?.trim();
              const isCurrent = index === currentRequirementIndex && !allComplete;

              return (
                <motion.button
                  key={req.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRequirementClick(req, index)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all",
                    hasAnswer
                      ? "bg-emerald-50 border-emerald-200"
                      : isCurrent
                      ? "bg-violet-50 border-violet-200 ring-2 ring-violet-200"
                      : "bg-gray-50 border-gray-100 hover:border-gray-200",
                    hasAnswer && "cursor-pointer hover:bg-emerald-100"
                  )}
                  disabled={!hasAnswer && !isCurrent}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                        hasAnswer
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-violet-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      )}
                    >
                      {hasAnswer ? (
                        <Check className="h-3 w-3" />
                      ) : isCurrent ? (
                        <ChevronDown className="h-3 w-3 animate-bounce" />
                      ) : (
                        <Circle className="h-2 w-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            hasAnswer
                              ? "text-emerald-700"
                              : isCurrent
                              ? "text-violet-700"
                              : "text-gray-600"
                          )}
                        >
                          {req.label}
                        </p>
                        {req.required && (
                          <span className="text-[10px] text-red-400">*</span>
                        )}
                      </div>

                      {hasAnswer ? (
                        <p className="text-xs text-emerald-600 truncate mt-0.5">
                          {answers[req.id]}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t">
          <Button
            onClick={() => onComplete(answers)}
            disabled={!allComplete}
            className={cn(
              "w-full",
              allComplete
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500"
            )}
          >
            {allComplete ? (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                {docType.requirements.filter((r) => r.required).length -
                  Object.keys(answers).filter(
                    (k) =>
                      docType.requirements.find((r) => r.id === k)?.required
                  ).length}{" "}
                required left
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Helper function for acknowledgment messages
function getAcknowledgment(label: string): string {
  const acks = [
    `Got it! That helps a lot.`,
    `Perfect, I've noted that down.`,
    `Great choice!`,
    `Excellent, moving on.`,
    `Thanks! That's exactly what I needed.`,
    `Wonderful, let's continue.`,
  ];
  return acks[Math.floor(Math.random() * acks.length)];
}
