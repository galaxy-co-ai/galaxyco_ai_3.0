"use client";

import * as React from "react";
import { Send, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DocumentType, DocumentChatMessage } from "./types";

interface NeptuneDocumentSidebarProps {
  documentType: DocumentType;
  messages: DocumentChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onClose: () => void;
}

const quickActions: Record<DocumentType, string[]> = {
  estimate: [
    "Help me describe the project scope",
    "Suggest line items for a kitchen remodel",
    "What payment terms should I use?",
    "Add standard materials and labor",
  ],
  change_order: [
    "Calculate the price adjustment",
    "Draft the change justification",
    "What should I include in the scope change?",
  ],
  invoice: [
    "Pull line items from estimate",
    "What payment terms are standard?",
    "Add a late payment clause",
  ],
  receipt: [
    "Find the related invoice",
    "What payment method was used?",
    "Calculate remaining balance",
  ],
  expense: [
    "Categorize this expense",
    "Is this reimbursable?",
    "Allocate to a project",
  ],
  payment: [
    "Find matching invoices",
    "Record a partial payment",
    "What's the remaining balance?",
  ],
};

export function NeptuneDocumentSidebar({
  documentType,
  messages,
  onSendMessage,
  onClose,
}: NeptuneDocumentSidebarProps) {
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    setIsLoading(true);
    
    try {
      await onSendMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Neptune Assistant</h3>
            <p className="text-[10px] text-muted-foreground">AI-powered document help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary">Neptune</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[10px] font-medium text-primary">Neptune</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-medium text-muted-foreground">Quick actions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickActions[documentType].slice(0, 3).map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="text-[11px] px-2 py-1 rounded-md bg-background border border-border hover:bg-accent transition-colors text-foreground"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Neptune for help..."
            className="min-h-[60px] max-h-[120px] text-sm resize-none"
            disabled={isLoading}
          />
          <Button
            size="sm"
            className="h-auto px-3 self-end"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}











