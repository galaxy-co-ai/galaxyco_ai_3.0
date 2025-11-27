"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Rocket,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey there! 👋 I'm Galaxy, your AI guide to GalaxyCo.ai. I know everything about our platform — from Neptune AI (our intelligent assistant that actually takes action) to our CRM, Marketing tools, and Workflow Studio. Ask me anything!",
    timestamp: new Date(),
    suggestions: [
      "What is Neptune AI?",
      "Show me pricing",
      "What makes you different?",
      "Start free trial"
    ],
  },
];

export function FloatingSalesChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show chat prompt after 5 seconds if user hasn't interacted
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        // Pulse effect handled by CSS
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setHasInteracted(true);

    try {
      const response = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Feel free to email us at hello@galaxyco.ai or try again in a moment!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const resetChat = () => {
    setMessages(initialMessages);
    setInput("");
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => {
                setIsOpen(true);
                setHasInteracted(true);
              }}
              className="group relative"
              aria-label="Open chat"
            >
              {/* Pulse ring animation */}
              {!hasInteracted && (
                <>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-30" />
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse opacity-20" />
                </>
              )}
              
              {/* Main button */}
              <div className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>

              {/* "Chat with us" badge */}
              {!hasInteracted && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -left-28 top-1/2 -translate-y-1/2 bg-white rounded-full px-3 py-1.5 shadow-lg border border-gray-100 whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-gray-700">Chat with us!</span>
                </motion.div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Galaxy AI</h3>
                  <p className="text-white/80 text-xs">Your AI guide • Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetChat}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                  aria-label="Reset conversation"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex-1 min-w-0 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto rounded-br-md"
                          : "bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-800 text-white text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white shadow-sm border border-gray-100">
                    <div className="flex gap-1.5">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="h-2 w-2 bg-blue-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="h-2 w-2 bg-purple-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="h-2 w-2 bg-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Features Banner - shown only on initial state */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 pb-2 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between py-2 text-[10px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> Instant answers</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> 24/7 available</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-green-500" /> Secure</span>
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2 flex-shrink-0">
              <Input
                placeholder="Ask anything about GalaxyCo.ai..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 rounded-full border-gray-200 focus-visible:ring-blue-500"
                disabled={isLoading}
                aria-label="Type your message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-md"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Powered by GalaxyCo AI</span>
              <a
                href="/sign-up"
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
              >
                Start free trial <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

