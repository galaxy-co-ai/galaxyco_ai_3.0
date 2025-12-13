"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import MessageComposer from "./MessageComposer";
import {
  Loader2,
  Reply,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Download,
  Play,
  Pause,
  ExternalLink,
  Mic,
} from "lucide-react";

interface ConversationThreadProps {
  conversationId: string;
  channel: 'email' | 'text' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat' | 'support';
}

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
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
  attachments?: Attachment[];
  callDuration?: number;
  callRecordingUrl?: string;
  callTranscription?: string;
  replyToId?: string;
  replies?: Message[];
}

// Group messages by date
function groupMessagesByDate(messages: Message[]): { date: Date; messages: Message[] }[] {
  const groups: { date: Date; messages: Message[] }[] = [];
  let currentGroup: { date: Date; messages: Message[] } | null = null;

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt);
    if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
      currentGroup = { date: msgDate, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }

  return groups;
}

// Format date label
function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export default function ConversationThread({
  conversationId,
  channel,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Sort by createdAt ascending (oldest first)
        const sorted = (data.messages || []).sort(
          (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sorted);
      }
    } catch (error) {
      logger.error("Failed to fetch messages", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Listen for conversation updates
  useEffect(() => {
    const handleUpdate = () => fetchMessages();
    window.addEventListener("conversation-updated", handleUpdate);
    return () => window.removeEventListener("conversation-updated", handleUpdate);
  }, [fetchMessages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Group messages: top-level + replies nested
  const groupedMessages = messages.filter(m => !m.replyToId);
  const repliesByParent = messages.reduce((acc, m) => {
    if (m.replyToId) {
      if (!acc[m.replyToId]) acc[m.replyToId] = [];
      acc[m.replyToId].push(m);
    }
    return acc;
  }, {} as Record<string, Message[]>);

  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const toggleAudio = (audioId: string, url: string) => {
    if (playingAudio === audioId) {
      audioRefs.current[audioId]?.pause();
      setPlayingAudio(null);
    } else {
      // Pause any playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      // Create or play audio
      if (!audioRefs.current[audioId]) {
        audioRefs.current[audioId] = new Audio(url);
        audioRefs.current[audioId].onended = () => setPlayingAudio(null);
      }
      audioRefs.current[audioId].play();
      setPlayingAudio(audioId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAttachments = (attachments: Attachment[], isInbound: boolean) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((att, idx) => {
          const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
          const isAudio = att.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm)$/i.test(att.name);
          const audioId = `${att.url}-${idx}`;

          if (isImage) {
            return (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={att.url}
                  alt={att.name}
                  className="max-w-[200px] max-h-[150px] rounded-lg object-cover border"
                />
              </a>
            );
          }

          if (isAudio) {
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  isInbound ? "bg-background/50" : "bg-white/10"
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleAudio(audioId, att.url)}
                >
                  {playingAudio === audioId ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Mic className="h-4 w-4 opacity-60" />
                <span className="text-xs">{att.name}</span>
              </div>
            );
          }

          return (
            <a
              key={idx}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                isInbound ? "bg-background/50 hover:bg-background" : "bg-white/10 hover:bg-white/20"
              )}
            >
              <FileText className="h-4 w-4" />
              <span className="flex-1 truncate">{att.name}</span>
              <span className="opacity-60">{formatFileSize(att.size)}</span>
              <Download className="h-3 w-3 opacity-60" />
            </a>
          );
        })}
      </div>
    );
  };

  const renderMessage = (message: Message, isReply = false) => {
    const isInbound = message.direction === 'inbound';
    const replies = repliesByParent[message.id] || [];
    const hasReplies = replies.length > 0;
    const isExpanded = expandedThreads.has(message.id);

    return (
      <div key={message.id} className={cn(isReply && "ml-8 border-l-2 border-muted pl-4")}>
        <div
          className={cn(
            "group flex gap-3",
            isInbound ? "justify-start" : "justify-end"
          )}
        >
          {isInbound && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback>
                {message.senderName?.slice(0, 2).toUpperCase() || "?"}
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
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: message.htmlBody }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{message.body}</p>
            )}
            {renderAttachments(message.attachments || [], isInbound)}
            {message.callDuration !== undefined && message.callDuration > 0 && (
              <div className="mt-2 text-xs opacity-75 flex items-center gap-2">
                <span>
                  Call: {Math.floor(message.callDuration / 60)}m {message.callDuration % 60}s
                </span>
                {message.callRecordingUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => toggleAudio(`call-${message.id}`, message.callRecordingUrl!)}
                  >
                    {playingAudio === `call-${message.id}` ? (
                      <><Pause className="h-3 w-3 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-3 w-3 mr-1" /> Listen</>
                    )}
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs opacity-75">
              <span>{message.senderName}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          {!isInbound && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          )}
          {/* Reply button (hover) */}
          {!isReply && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity self-center"
              onClick={() => setReplyToMessage(message)}
              title="Reply"
            >
              <Reply className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Thread replies */}
        {hasReplies && !isReply && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-6 px-2"
              onClick={() => toggleThread(message.id)}
            >
              {isExpanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" /> Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" /> Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</>
              )}
            </Button>
            {isExpanded && (
              <div className="mt-2 space-y-2">
                {replies.map(reply => renderMessage(reply, true))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(groupedMessages);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="space-y-6">
          {groupedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start the conversation by sending a message
                </p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date separator */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2">
                    {formatDateLabel(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {/* Messages in this date group */}
                <div className="space-y-4">
                  {group.messages.map(message => renderMessage(message))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Composer */}
      <div className="border-t p-4">
        <MessageComposer
          conversationId={conversationId}
          channel={channel}
          replyToId={replyToMessage?.id}
          replyToPreview={replyToMessage?.body?.substring(0, 50)}
          onCancelReply={() => setReplyToMessage(null)}
        />
      </div>
    </div>
  );
}
