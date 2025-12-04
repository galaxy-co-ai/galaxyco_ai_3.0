"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, RefreshCw, Lightbulb, FileText, Heart, Calendar, CheckSquare, Mail } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import QuickActions from "./QuickActions";
import type { Conversation } from "./ConversationsDashboard";

interface NeptuneAssistPanelProps {
  conversationId: string | null;
  conversation: Conversation | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function NeptuneAssistPanel({
  conversationId,
  conversation,
}: NeptuneAssistPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm Neptune, your conversation assistant. I can help you draft replies, analyze sentiment, summarize threads, and more. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: {
            type: 'conversation',
            conversationId,
            conversationData: conversation,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm here to help!",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      logger.error("Neptune chat error", error);
      toast.error("Failed to get response from Neptune");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations/neptune/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationId,
          conversationData: conversation,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform action');

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.result || `Action "${action}" completed!`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success(`Action completed: ${action}`);
    } catch (error) {
      logger.error("Neptune action error", error);
      toast.error(`Failed to perform action: ${action}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Neptune</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {conversation && (
        <div className="border-b p-4">
          <QuickActions
            conversationId={conversationId}
            onAction={handleQuickAction}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-75" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Neptune..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-w-0"
            disabled={isLoading || !conversation}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !conversation}
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
