"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  PenLine,
  Palette,
  TrendingUp,
  RefreshCw,
  Wand2,
  Copy,
  CheckCircle2,
  Paperclip,
  X,
  ImageIcon,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { CreatorTabType } from "./CreatorDashboard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Attachment {
  type: 'image' | 'document' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

// Quick actions based on context
const quickActions: Record<CreatorTabType, { icon: typeof Lightbulb; label: string; prompt: string }[]> = {
  create: [
    { icon: Lightbulb, label: "Suggest content ideas", prompt: "Suggest some content ideas for my business" },
    { icon: PenLine, label: "Help me write", prompt: "Help me write compelling copy" },
    { icon: Palette, label: "Design tips", prompt: "What design tips do you have for marketing materials?" },
    { icon: TrendingUp, label: "What's trending", prompt: "What content types are trending right now?" },
  ],
  collections: [
    { icon: RefreshCw, label: "Organize my content", prompt: "Help me organize my existing content better" },
    { icon: Wand2, label: "Suggest collections", prompt: "What collections should I create to organize my work?" },
    { icon: Lightbulb, label: "Content audit", prompt: "Review my content and suggest improvements" },
    { icon: TrendingUp, label: "Best performers", prompt: "Which types of content typically perform best?" },
  ],
  templates: [
    { icon: Lightbulb, label: "Recommend templates", prompt: "What templates would be most useful for my business?" },
    { icon: PenLine, label: "Custom template", prompt: "Help me design a custom template for my needs" },
    { icon: TrendingUp, label: "Industry standards", prompt: "What templates are standard in my industry?" },
    { icon: Wand2, label: "Template ideas", prompt: "Give me ideas for templates I should create" },
  ],
};

interface CreatorNeptunePanelProps {
  activeTab: CreatorTabType;
}

export default function CreatorNeptunePanel({ activeTab }: CreatorNeptunePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! 👋 I'm Neptune, your creative assistant. I can help you brainstorm content ideas, write compelling copy, suggest designs, and more. What would you like to create today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/assistant/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        setPendingAttachments(prev => [...prev, data.attachment]);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload file");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/assistant/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        setPendingAttachments(prev => [...prev, data.attachment]);
        toast.success("Image pasted");
      } catch (error) {
        toast.error("Failed to upload pasted image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() && pendingAttachments.length === 0) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingAttachments([]);
    setIsLoading(true);

    try {
      // Call the AI assistant API
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          attachments: pendingAttachments,
          context: {
            workspace: "Creator",
            feature: "content-creation",
            activeTab,
          },
        }),
      });

      let assistantContent = "";

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      assistantContent =
        data.message?.content ||
        (typeof data.message === "string" ? data.message : null) ||
        data.content ||
        "I'm here to help you create amazing content. What would you like to work on?";

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      logger.error("Neptune chat error", error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. In the meantime, try selecting a content category from the Create tab, or let me know what type of content you'd like to create!",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, fallbackMessage]);
      toast.error("Connection issue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action
  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-send after setting input
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSend();
    }, 100);
  };

  // Copy message content
  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const currentQuickActions = quickActions[activeTab];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-violet-50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Neptune</h3>
            <p className="text-xs text-purple-600">Creative AI helper</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b bg-gray-50/50">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {currentQuickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                "bg-white border border-gray-200 text-gray-600",
                "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </button>
          ))}
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
              exit={{ opacity: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 relative group",
                  message.role === "user"
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Copy button for assistant messages */}
                {message.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    aria-label="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,.gz"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload file"
        />
        
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                {att.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="ml-1 hover:text-destructive"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-9 w-9 shrink-0"
            aria-label="Attach file"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Neptune anything..."
            className="flex-1 text-sm rounded-full border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            disabled={isLoading}
            aria-label="Message Neptune"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading}
            size="icon"
            className="rounded-full bg-purple-600 hover:bg-purple-700 h-9 w-9"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}