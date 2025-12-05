"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import MessageComposer from "./MessageComposer";
import { Loader2 } from "lucide-react";

interface ConversationThreadProps {
  conversationId: string;
  channel: 'email' | 'text' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat' | 'support';
}

interface Message {
  id: string;
  body: string;
  subject?: string;
  htmlBody?: string;
  direction: 'inbound' | 'outbound';
  senderName: string;
  senderEmail?: string;
  createdAt: Date;
  isRead: boolean;
  attachments?: Array<{ name: string; url: string; size: number; type: string }>;
  callDuration?: number;
  callRecordingUrl?: string;
  callTranscription?: string;
}

export default function ConversationThread({
  conversationId,
  channel,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch messages for this conversation
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        logger.error("Failed to fetch messages", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start the conversation by sending a message
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isInbound = message.direction === 'inbound';
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isInbound ? "justify-start" : "justify-end"
                  )}
                >
                  {isInbound && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {message.senderName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[70%] flex-col gap-1 rounded-lg p-3",
                      isInbound
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground ml-auto"
                    )}
                  >
                    {message.subject && (
                      <p className="font-semibold">{message.subject}</p>
                    )}
                    {message.htmlBody ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: message.htmlBody }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                          >
                            📎 {att.name} ({(att.size / 1024).toFixed(1)} KB)
                          </a>
                        ))}
                      </div>
                    )}
                    {message.callDuration && (
                      <div className="mt-2 text-xs opacity-75">
                        📞 Call duration: {Math.floor(message.callDuration / 60)}m {message.callDuration % 60}s
                        {message.callRecordingUrl && (
                          <a href={message.callRecordingUrl} className="ml-2 underline">
                            Listen
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <span>{message.senderName}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(message.createdAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                  {!isInbound && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Composer */}
      <div className="border-t p-4">
        <MessageComposer conversationId={conversationId} channel={channel} />
      </div>
    </div>
  );
}
