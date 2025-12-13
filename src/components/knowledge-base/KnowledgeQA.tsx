"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Source {
  index: number;
  id: string;
  title: string;
  score: number;
}

interface QAMessage {
  id: string;
  type: "question" | "answer";
  content: string;
  sources?: Source[];
  contextSource?: string;
  timestamp: Date;
}

interface KnowledgeQAProps {
  collectionId?: string;
  documentIds?: string[];
  onSourceClick?: (sourceId: string) => void;
  className?: string;
  compact?: boolean;
}

export default function KnowledgeQA({
  collectionId,
  documentIds,
  onSourceClick,
  className,
  compact = false,
}: KnowledgeQAProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const askQuestion = useCallback(async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion("");

    // Add user message
    const questionId = `q-${Date.now()}`;
    const answerId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: questionId,
        type: "question",
        content: userQuestion,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch("/api/knowledge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          collectionId,
          documentIds,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let answerContent = "";
      let sources: Source[] = [];
      let contextSource = "";

      // Initialize answer message
      setMessages((prev) => [
        ...prev,
        {
          id: answerId,
          type: "answer",
          content: "",
          sources: [],
          timestamp: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Handle sources
              if (parsed.sources) {
                sources = parsed.sources;
                contextSource = parsed.contextSource || "";
              }

              // Handle content
              if (parsed.content) {
                answerContent += parsed.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === answerId
                      ? { ...msg, content: answerContent, sources, contextSource }
                      : msg
                  )
                );
              }

              // Handle completion
              if (parsed.done) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === answerId
                      ? { ...msg, content: answerContent, sources, contextSource }
                      : msg
                  )
                );
              }

              // Handle errors
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      console.error("Q&A error:", error);
      toast.error("Failed to get answer. Please try again.");
      
      // Remove loading message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== answerId));
    } finally {
      setIsLoading(false);
    }
  }, [question, isLoading, collectionId, documentIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const toggleSources = (messageId: string) => {
    setShowSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Card
      className={cn(
        "flex flex-col bg-gradient-to-br from-violet-50/50 to-purple-50/50 border-violet-200/50",
        compact ? "h-[400px]" : "h-full",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-900">Ask Knowledge Base</h3>
            <p className="text-xs text-gray-500">AI-powered answers from your docs</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-7 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-violet-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Ask a question</h4>
            <p className="text-sm text-gray-500 max-w-xs">
              Get AI-powered answers from your knowledge base documents
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["What is our refund policy?", "How do I integrate the API?", "Summary of Q1 results"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuestion(suggestion)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex",
                    message.type === "question" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === "question" ? (
                    <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[90%] space-y-2">
                      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
                        {message.content ? (
                          <div className="prose prose-sm prose-violet max-w-none">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching knowledge base...
                          </div>
                        )}
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="ml-1">
                          <button
                            onClick={() => toggleSources(message.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            {message.sources.length} source{message.sources.length !== 1 ? "s" : ""}
                            {showSources[message.id] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          <AnimatePresence>
                            {showSources[message.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2"
                              >
                                <div className="flex flex-wrap gap-2">
                                  {message.sources.map((source) => (
                                    <button
                                      key={source.id}
                                      onClick={() => onSourceClick?.(source.id)}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors",
                                        "bg-white hover:bg-violet-50 border-violet-200 text-gray-700"
                                      )}
                                    >
                                      <FileText className="h-3 w-3 text-violet-500" />
                                      <span className="truncate max-w-[150px]">{source.title}</span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 h-4 ml-1 bg-violet-50 border-violet-200 text-violet-600"
                                      >
                                        {Math.round(source.score * 100)}%
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              className="pr-10 bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-400"
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-violet-500" />
            )}
          </div>
          <Button
            onClick={askQuestion}
            disabled={!question.trim() || isLoading}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
