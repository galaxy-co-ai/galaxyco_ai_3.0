"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  FileText,
  Workflow,
  Brain,
  Zap,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
  isError?: boolean;
  feedback?: "positive" | "negative" | null;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey! 👋 I'm Neptune, your AI sidekick. I can take action for you — create leads, schedule meetings, analyze your pipeline, draft emails — just tell me what you need.",
    timestamp: "Just now",
    suggestions: [
      "What's on my calendar today?",
      "Show me my hot leads",
      "I need to follow up with someone",
      "Help me get organized"
    ]
  }
];

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Listen for openNeptune custom event from dashboard
  useEffect(() => {
    const handleOpenNeptune = (event: CustomEvent) => {
      const { query } = event.detail;
      setIsOpen(true);
      setIsMinimized(false);
      if (query) {
        setInputValue(query);
        // Optionally auto-send the query - using state update pattern
        setTimeout(() => {
          // Direct async call with query parameter avoids stale closure
          const sendMessage = async () => {
            setInputValue("");
            setIsTyping(true);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "user",
              content: query,
              timestamp: formatTimestamp(new Date()),
            }]);
            
            try {
              const response = await fetch("/api/assistant/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: query,
                  conversationId: null,
                  context: {
                    feature: "floating_chat",
                    page: typeof window !== "undefined" ? window.location.pathname : undefined,
                  },
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.conversationId) setConversationId(data.conversationId);
                setMessages(prev => [...prev, {
                  id: data.messageId || (Date.now() + 1).toString(),
                  role: "assistant",
                  content: data.message || data.response || "I processed your request.",
                  timestamp: formatTimestamp(new Date()),
                  suggestions: generateSuggestions(query, data.message),
                }]);
              }
            } catch (error) {
              logger.error("Failed to send message", error);
            } finally {
              setIsTyping(false);
            }
          };
          sendMessage();
        }, 300);
      }
    };

    window.addEventListener('openNeptune', handleOpenNeptune as EventListener);
    return () => {
      window.removeEventListener('openNeptune', handleOpenNeptune as EventListener);
    };
    // Empty deps array is intentional - we only set up the listener once
    // The event handler uses direct state updates to avoid stale closures
     
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: formatTimestamp(new Date()),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          conversationId: conversationId,
          context: {
            feature: "floating_chat",
            page: typeof window !== "undefined" ? window.location.pathname : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Store conversation ID for follow-up messages
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiResponse: Message = {
        id: data.messageId || (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.response || "I processed your request.",
        timestamp: formatTimestamp(new Date()),
        suggestions: generateSuggestions(textToSend, data.message),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      logger.error("Failed to send message", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error && error.message.includes("rate limit")
          ? "I'm getting a lot of requests right now. Please wait a moment and try again."
          : "Sorry, I encountered an issue processing your request. Please try again.",
        timestamp: formatTimestamp(new Date()),
        isError: true,
        suggestions: ["Try again", "Start over"],
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, conversationId]);

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Try again") {
      // Resend the last user message
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    } else if (suggestion === "Start over") {
      setConversationId(null);
      setMessages(initialMessages);
    } else {
      handleSendMessage(suggestion);
    }
  };

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    // Update UI immediately
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ));

    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          feedback,
          conversationId,
        }),
      });
      
      toast.success(feedback === "positive" ? "Thanks for the feedback!" : "Sorry about that. I'll try to do better.");
    } catch (error) {
      logger.error("Failed to submit feedback", error);
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages(initialMessages);
    toast.success("Started new conversation");
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] transition-all duration-300 group relative overflow-hidden"
              aria-label="Open Neptune AI Assistant"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 rounded-full"
              />
              <Sparkles className="h-6 w-6 text-white relative z-10" />
            </Button>
            
            {/* Notification Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white shadow-lg"
            >
              1
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[600px] bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white text-sm font-medium">Neptune</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isTyping ? (
                      <>
                        <Loader2 className="h-2.5 w-2.5 text-white/80 animate-spin" />
                        <span className="text-xs text-white/80">Thinking...</span>
                      </>
                    ) : (
                      <>
                        <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white/80">Ready to help</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="New conversation"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-hidden bg-gray-50/50" ref={scrollAreaRef}>
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className={`${message.isError ? "bg-red-500" : "bg-gradient-to-br from-purple-600 to-blue-600"} text-white`}>
                                {message.isError ? <AlertCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`flex-1 min-w-0 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                                message.role === "user"
                                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white ml-auto rounded-br-md"
                                  : message.isError
                                    ? "bg-red-50 text-red-800 rounded-bl-md border border-red-200"
                                    : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                            </div>
                            
                            {/* Action buttons for assistant messages */}
                            {message.role === "assistant" && !message.isError && message.id !== "1" && (
                              <div className="flex items-center gap-1 mt-1 ml-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 rounded-full ${message.feedback === "positive" ? "text-green-600 bg-green-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                                  onClick={() => handleFeedback(message.id, "positive")}
                                  title="Good response"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 rounded-full ${message.feedback === "negative" ? "text-red-600 bg-red-50" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                                  onClick={() => handleFeedback(message.id, "negative")}
                                  title="Poor response"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                  title="Copy message"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {message.suggestions.map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="h-6 text-xs px-2.5 rounded-full bg-white hover:bg-gray-50 border-gray-200"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            )}
                            
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {message.timestamp}
                            </span>
                          </div>

                          {message.role === "user" && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                                U
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                              <Sparkles className="h-3.5 w-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white shadow-sm">
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Input - Fixed to Bottom */}
                <div className="px-3 py-3 border-t bg-white shrink-0">
                  <div className="flex gap-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => handleSendMessage("Create a new lead")}>
                          <Plus className="h-4 w-4 mr-2 text-green-500" />
                          Create Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendMessage("Schedule a meeting")}>
                          <Workflow className="h-4 w-4 mr-2 text-blue-500" />
                          Schedule Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendMessage("Draft an email")}>
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          Draft Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendMessage("Show me my pipeline summary")}>
                          <Brain className="h-4 w-4 mr-2 text-orange-500" />
                          Pipeline Summary
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendMessage("Create a task")}>
                          <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                          Create Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      ref={inputRef}
                      placeholder="Ask me anything..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isTyping}
                      className="flex-1 h-9 rounded-full border-gray-300 bg-gray-50 focus:bg-white text-sm"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper functions
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateSuggestions(userMessage: string, aiResponse: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Context-aware suggestions based on the conversation
  if (lowerMessage.includes("lead") || lowerResponse.includes("lead")) {
    return ["Show me more details", "Update the stage", "Add a note"];
  }
  if (lowerMessage.includes("meeting") || lowerResponse.includes("meeting")) {
    return ["Add attendees", "Set a reminder", "What's next on my calendar?"];
  }
  if (lowerMessage.includes("email") || lowerResponse.includes("email")) {
    return ["Make it shorter", "More formal tone", "Send it"];
  }
  if (lowerMessage.includes("task") || lowerResponse.includes("task")) {
    return ["Set priority", "Add due date", "Show all my tasks"];
  }
  if (lowerMessage.includes("pipeline") || lowerResponse.includes("pipeline")) {
    return ["Show hot leads", "Conversion rates", "Deals closing soon"];
  }
  
  // Default suggestions
  return ["Tell me more", "What else can you do?", "Thanks!"];
}
