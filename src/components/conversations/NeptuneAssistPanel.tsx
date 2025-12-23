"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Send,
  FileText,
  Paperclip,
  X,
  ImageIcon,
  Loader2,
  Presentation,
  ExternalLink,
  Download,
  Eye,
  Plus,
  MessageSquare,
  Clock,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import QuickActions from "./QuickActions";
import { useNeptune, type Attachment } from "@/contexts/neptune-context";
import type { Conversation } from "./ConversationsDashboard";
import { NeptuneMessage } from "@/components/neptune/NeptuneMessage";
import { MarkdownContent } from "@/components/neptune/MarkdownContent";
import { SmartMessageFormatter } from "@/components/neptune/SmartMessageFormatter";

// Wrapper component for fullscreen variant to add card styling
function NeptuneCardWrapper({
  children,
  isFullscreen,
}: {
  children: React.ReactNode;
  isFullscreen: boolean;
}) {
  if (isFullscreen) {
    return (
      <Card className="h-full flex flex-col border shadow-sm overflow-hidden">
        {children}
      </Card>
    );
  }
  return <>{children}</>;
}

interface NeptuneAssistPanelProps {
  // Legacy props - kept for backwards compatibility with Conversations page
  conversationId?: string | null;
  conversation?: Conversation | null;
  variant?: "default" | "fullscreen";
  feature?: string;
}

export default function NeptuneAssistPanel({
  conversationId: legacyConversationId,
  conversation: legacyConversation,
  variant = "default",
  feature,
}: NeptuneAssistPanelProps) {
  // Use shared Neptune context
  const {
    messages,
    isLoading,
    isInitialized,
    isStreaming,
    conversationHistory,
    isLoadingHistory,
    currentToolStatus,
    sendMessage,
    clearConversation,
    loadConversation,
    fetchConversationHistory,
    deleteConversation,
  } = useNeptune();

  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [tabHeld, setTabHeld] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; attachments?: Attachment[] } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch history when switching to history view
  useEffect(() => {
    if (viewMode === "history") {
      fetchConversationHistory();
    }
  }, [viewMode, fetchConversationHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Global keyboard shortcut: Cmd/Ctrl+K to focus Neptune input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to blur input
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Listen for roadmap prompts (from RoadmapCard)
  useEffect(() => {
    const handleNeptunePrompt = async (
      event: CustomEvent<{ prompt: string }>
    ) => {
      if (event.detail.prompt) {
        await sendMessage(event.detail.prompt, [], feature);
      }
    };

    window.addEventListener(
      "neptune-prompt",
      handleNeptunePrompt as unknown as EventListener
    );
    return () => {
      window.removeEventListener(
        "neptune-prompt",
        handleNeptunePrompt as unknown as EventListener
      );
    };
  }, [sendMessage, feature]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/assistant/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setPendingAttachments((prev) => [...prev, data.attachment]);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file"
        );
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/assistant/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setPendingAttachments((prev) => [...prev, data.attachment]);
        toast.success("Image pasted");
      } catch {
        toast.error("Failed to upload pasted image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSend = async (messageOverride?: string, attachmentsOverride?: Attachment[]) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() && (attachmentsOverride || pendingAttachments).length === 0) return;

    const attachmentsToSend = attachmentsOverride || [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    // Track for retry functionality
    setLastFailedMessage({ message: messageToSend, attachments: attachmentsToSend });
    
    try {
      await sendMessage(messageToSend, attachmentsToSend, feature);
      // Clear failed message on success
      setLastFailedMessage(null);
    } catch (error) {
      // Error is already handled in neptune context
      logger.debug('Message send failed, retry available', { message: messageToSend });
    }
  };
  
  const handleRetry = async () => {
    if (lastFailedMessage) {
      await handleSend(lastFailedMessage.message, lastFailedMessage.attachments);
    }
  };

  // Voice input handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/assistant/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription failed');

          const data = await response.json();
          if (data.text) {
            await sendMessage(data.text, [], feature);
          }
        } catch (error) {
          logger.error('Voice transcription failed', error);
          toast.error('Failed to transcribe audio. Please try again.');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error) {
      logger.error('Failed to start recording', error);
      toast.error('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Text-to-speech handler
  const handleSpeak = async (text: string, messageId: string) => {
    if (isPlayingAudio === messageId) {
      // Stop if already playing
      setIsPlayingAudio(null);
      return;
    }

    try {
      setIsPlayingAudio(messageId);

      const response = await fetch('/api/assistant/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast.error('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      logger.error('TTS playback failed', error);
      toast.error('Failed to generate speech');
      setIsPlayingAudio(null);
    }
  };

  const handleQuickAction = async (action: string) => {
    // For quick actions on conversation context (Conversations page)
    if (legacyConversationId && legacyConversation) {
      try {
        const response = await fetch("/api/conversations/neptune/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            conversationId: legacyConversationId,
            conversationData: legacyConversation,
          }),
        });

        if (!response.ok) throw new Error("Failed to perform action");

        const data = await response.json();
        toast.success(`Action completed: ${action}`);

        // Send the result as a message so it appears in the unified conversation
        await sendMessage(
          `Performed action "${action}" on the conversation. Result: ${data.result || "Completed"}`,
          [],
          feature
        );
      } catch (error) {
        logger.error("Neptune action error", error);
        toast.error(`Failed to perform action: ${action}`);
      }
    } else {
      // Just send the action as a message
      await sendMessage(`Help me with: ${action}`, [], feature);
    }
  };

  const isFullscreen = variant === "fullscreen";

  // Show loading skeleton while initializing
  if (!isInitialized) {
    return (
      <NeptuneCardWrapper isFullscreen={isFullscreen}>
        <div
          className={`flex h-full w-full flex-col ${isFullscreen ? "bg-card" : "bg-background"}`}
        >
          {/* Header skeleton */}
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-muted animate-pulse" />
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          {/* Messages skeleton */}
          <div className="flex-1 p-4 space-y-4">
            <div className="flex gap-2">
              <div className="h-16 w-3/4 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
          {/* Input skeleton */}
          <div className="border-t p-4">
            <div className="h-10 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </NeptuneCardWrapper>
    );
  }

  return (
    <NeptuneCardWrapper isFullscreen={isFullscreen}>
      <div
        className={`flex h-full w-full flex-col ${isFullscreen ? "bg-card" : "bg-background"}`}
      >
        {/* Header */}
        {isFullscreen ? (
          <div className="border-b bg-background px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <PageTitle
                title="Neptune"
                icon={Sparkles}
                as="h2"
                titleClassName="text-base md:text-xl"
                iconClassName="w-6 h-6 md:w-6 md:h-6"
              />
              <div className="flex items-center gap-2">
                {/* Chat/History Toggle */}
                <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                  <Button
                    variant={viewMode === "chat" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("chat")}
                    className={`h-7 px-2 md:px-3 ${viewMode === "chat" ? "shadow-sm" : "hover:bg-transparent"}`}
                    aria-label="View chat"
                  >
                    <MessageSquare className="h-3.5 w-3.5 md:mr-1.5" />
                    <span className="hidden md:inline">Chat</span>
                  </Button>
                  <Button
                    variant={viewMode === "history" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("history")}
                    className={`h-7 px-2 md:px-3 ${viewMode === "history" ? "shadow-sm" : "hover:bg-transparent"}`}
                    aria-label="View history"
                  >
                    <Clock className="h-3.5 w-3.5 md:mr-1.5" />
                    <span className="hidden md:inline">History</span>
                  </Button>
                </div>
                {/* New Chat Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearConversation();
                    setViewMode("chat");
                  }}
                  className="text-muted-foreground hover:text-foreground px-2"
                  aria-label="Start new conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Neptune</h3>
              </div>
              <div className="flex items-center gap-1">
                {/* Chat/History Toggle (compact) */}
                <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
                  <Button
                    variant={viewMode === "chat" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("chat")}
                    className={`h-6 px-1.5 sm:px-2 text-xs ${viewMode === "chat" ? "shadow-sm" : "hover:bg-transparent"}`}
                    aria-label="View chat"
                  >
                    <MessageSquare className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Chat</span>
                  </Button>
                  <Button
                    variant={viewMode === "history" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("history")}
                    className={`h-6 px-1.5 sm:px-2 text-xs ${viewMode === "history" ? "shadow-sm" : "hover:bg-transparent"}`}
                    aria-label="View history"
                  >
                    <Clock className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    clearConversation();
                    setViewMode("chat");
                  }}
                  aria-label="Start new conversation"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Only show in default variant with conversation context */}
        {!isFullscreen && legacyConversation && viewMode === "chat" && (
          <div className="border-b p-4">
            <QuickActions
              conversationId={legacyConversationId ?? null}
              onAction={handleQuickAction}
              disabled={isLoading}
            />
          </div>
        )}

        {/* History View */}
        {viewMode === "history" ? (
          <div className={`flex-1 overflow-hidden flex flex-col ${isFullscreen ? "p-6" : "p-4"}`}>
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm pl-9"
                  aria-label="Search conversation history"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversationHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No conversation history yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your past conversations will appear here
                </p>
              </div>
            ) : (() => {
              const filteredHistory = conversationHistory.filter((conv) => {
                if (!historySearchQuery.trim()) return true;
                const query = historySearchQuery.toLowerCase();
                return (
                  conv.title.toLowerCase().includes(query) ||
                  (conv.preview && conv.preview.toLowerCase().includes(query))
                );
              });
              
              if (filteredHistory.length === 0 && historySearchQuery.trim()) {
                return (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-muted-foreground">No conversations found</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Try a different search term
                    </p>
                  </div>
                );
              }
              
              return (
              <div className="space-y-2">
                {filteredHistory.map((conv) => (
                  <div
                    key={conv.id}
                    className="group relative w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      loadConversation(conv.id);
                      setViewMode("chat");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        loadConversation(conv.id);
                        setViewMode("chat");
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Load conversation: ${conv.title}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate flex-1">
                        {conv.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {conv.messageCount} msgs
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {conv.preview || "No preview available"}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {/* Delete button - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute bottom-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      aria-label={`Delete conversation: ${conv.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              );
            })()}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div
            className={`flex-1 overflow-y-auto ${isFullscreen ? "p-6" : "p-4"}`}
            ref={scrollRef}
          >
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-[#007AFF]/90 backdrop-blur-sm text-white shadow-lg shadow-blue-500/20"
                      : "bg-muted"
                  }`}
                >
                  {/* User-uploaded Attachments Display */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx}>
                          {att.type === "image" ? (
                            // Image thumbnail
                            <div className="rounded-lg overflow-hidden border border-white/20">
                              <img
                                src={att.url}
                                alt={att.name}
                                className="max-w-full max-h-48 object-contain bg-black/5"
                              />
                            </div>
                          ) : (
                            // Document/file pill
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                msg.role === "user"
                                  ? "bg-white/20 hover:bg-white/30"
                                  : "bg-background hover:bg-background/80"
                              } transition-colors`}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {att.name}
                              </span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.content ? (
                    msg.role === "user" ? (
                      // User messages: smart formatting with professional typography
                      // Check if message contains markdown list syntax
                      msg.content.includes('- ') || msg.content.includes('* ') || /^\d+\./m.test(msg.content) ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_*]:text-white [&_p]:leading-[1.6] [&_p]:mb-3 [&_ul]:space-y-2 [&_li]:leading-[1.6] [&_ul_li_span]:bg-white">
                          <MarkdownContent content={msg.content} />
                        </div>
                      ) : (
                        // Plain text or structured data - use smart formatter
                        <SmartMessageFormatter content={msg.content} />
                      )
                    ) : (
                      // Assistant messages: rich markdown rendering
                      <>
                        <NeptuneMessage
                          content={msg.content}
                          isStreaming={msg.isStreaming}
                          metadata={msg.metadata}
                        />
                        {/* Show retry button if message contains error indicators */}
                        {(msg.content.includes('Connection Lost') || 
                          msg.content.includes('Server Error') || 
                          msg.content.includes('Something Went Wrong') ||
                          msg.content.includes('Session Expired') ||
                          msg.content.includes('Too Many Requests') ||
                          msg.content.includes('Invalid Message')) && 
                          lastFailedMessage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRetry}
                            disabled={isLoading}
                            className="mt-3 h-8 text-xs"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Retrying...' : 'Try Again'}
                          </Button>
                        )}
                      </>
                    )
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      {currentToolStatus && (
                        <span className="text-xs text-muted-foreground animate-pulse">
                          {currentToolStatus}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Gamma Document Display */}
                  {msg.metadata?.functionCalls?.some(
                    (fc) => fc.name === "create_professional_document"
                  ) &&
                    (() => {
                      const gammaCall = msg.metadata.functionCalls.find(
                        (fc) => fc.name === "create_professional_document"
                      );
                      const gammaData = gammaCall?.result?.data as
                        | {
                            title?: string;
                            contentType?: string;
                            cards?: number;
                            style?: string;
                            editUrl?: string;
                            pdfUrl?: string;
                            pptxUrl?: string;
                          }
                        | undefined;

                      if (!gammaData) return null;

                      return (
                        <div className="mt-3 p-4 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                              <Presentation className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-purple-900 truncate">
                                  {gammaData.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                >
                                  Gamma.app
                                </Badge>
                              </div>
                              <p className="text-xs text-purple-600">
                                {gammaData.contentType &&
                                typeof gammaData.contentType === "string"
                                  ? gammaData.contentType.charAt(0).toUpperCase() +
                                    gammaData.contentType.slice(1)
                                  : "Document"}{" "}
                                • {gammaData.cards} slides • {gammaData.style}{" "}
                                style
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {gammaData.editUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                asChild
                              >
                                <a
                                  href={gammaData.editUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1.5" />
                                  Edit in Gamma
                                </a>
                              </Button>
                            )}

                            {gammaData.pdfUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                asChild
                              >
                                <a
                                  href={gammaData.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  Download PDF
                                </a>
                              </Button>
                            )}

                            {gammaData.pptxUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                asChild
                              >
                                <a
                                  href={gammaData.pptxUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  Download PPTX
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* DALL-E Generated Image Display */}
                  {msg.metadata?.functionCalls?.some(
                    (fc) => fc.name === "generate_image"
                  ) &&
                    (() => {
                      const imageCall = msg.metadata.functionCalls.find(
                        (fc) => fc.name === "generate_image"
                      );
                      const imageData = imageCall?.result?.data as
                        | {
                            imageUrl?: string;
                            revisedPrompt?: string;
                            size?: string;
                            quality?: string;
                            style?: string;
                          }
                        | undefined;

                      if (!imageData?.imageUrl) return null;

                      return (
                        <div className="mt-3 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                          {/* Image Preview */}
                          <div className="relative group">
                            <img
                              src={imageData.imageUrl}
                              alt={imageData.revisedPrompt || "Generated image"}
                              className="w-full h-auto max-h-96 object-contain bg-white"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </div>

                          {/* Image Info & Actions */}
                          <div className="p-4 bg-white/80 backdrop-blur-sm">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-blue-100">
                                <ImageIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                  >
                                    DALL-E 3
                                  </Badge>
                                  <span className="text-xs text-blue-600">
                                    {imageData.size} •{" "}
                                    {imageData.quality || "standard"} •{" "}
                                    {imageData.style || "vivid"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {imageData.revisedPrompt}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                asChild
                              >
                                <a
                                  href={imageData.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-3 w-3 mr-1.5" />
                                  View Full Size
                                </a>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                asChild
                              >
                                <a
                                  href={imageData.imageUrl}
                                  download={`dalle-${Date.now()}.png`}
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Action buttons for assistant messages */}
                  {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                      {/* Text-to-speech button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${
                          isPlayingAudio === msg.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        aria-label="Read message aloud"
                      >
                        <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio === msg.id ? "animate-pulse" : ""}`} />
                      </Button>
                      {/* Feedback buttons */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/assistant/feedback", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                messageId: msg.id,
                                feedback: "positive",
                              }),
                            });

                            if (response.ok) {
                              toast.success("Thanks for your feedback!");
                            }
                          } catch (error) {
                            logger.error("Failed to submit feedback", error);
                          }
                        }}
                        aria-label="Thumbs up - helpful response"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/assistant/feedback", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                messageId: msg.id,
                                feedback: "negative",
                              }),
                            });

                            if (response.ok) {
                              toast.success("Thanks for your feedback!");
                            }
                          } catch (error) {
                            logger.error("Failed to submit feedback", error);
                          }
                        }}
                        aria-label="Thumbs down - not helpful"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && !isStreaming && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span 
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span 
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Input - Only show in chat mode */}
        {viewMode === "chat" && (
        <div className={`border-t ${isFullscreen ? "p-6" : "p-4"} shrink-0`}>
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
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
                >
                  {att.type === "image" ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    className="ml-1 hover:text-destructive"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
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
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = '44px';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                // Ctrl+Enter or Cmd+Enter: Send message
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend(undefined);
                  return;
                }
                // Track Tab hold state for Tab+Enter quick-send
                if (e.key === 'Tab') {
                  e.preventDefault();
                  setTabHeld(true);
                  const ta = e.currentTarget;
                  const start = ta.selectionStart ?? 0;
                  const end = ta.selectionEnd ?? 0;
                  const value = ta.value;
                  // Indent/outdent lists
                  if (e.shiftKey) {
                    // Outdent current line
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const line = value.slice(lineStart, end);
                    if (line.startsWith('  ')) {
                      const newValue = value.slice(0, lineStart) + line.slice(2) + value.slice(end);
                      setInput(newValue);
                      // Restore caret
                      requestAnimationFrame(() => {
                        ta.selectionStart = ta.selectionEnd = start - 2;
                      });
                    }
                  } else {
                    // Insert two spaces
                    const newVal = value.slice(0, start) + '  ' + value.slice(end);
                    setInput(newVal);
                    requestAnimationFrame(() => {
                      ta.selectionStart = ta.selectionEnd = start + 2;
                    });
                  }
                  return;
                }
                if (e.key === 'Enter') {
                  const ta = e.currentTarget;
                  // Tab+Enter: Send message
                  if (tabHeld) {
                    e.preventDefault();
                    handleSend(undefined);
                    return;
                  }
                  // Shift+Enter: Start list formatting (insert "- " if not in list)
                  if (e.shiftKey) {
                    e.preventDefault();
                    const start = ta.selectionStart ?? 0;
                    const end = ta.selectionEnd ?? 0;
                    const value = ta.value;
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const currentLine = value.slice(lineStart, start);
                    // Check if already in a list
                    const bulletMatch = currentLine.match(/^(\s*)([-*]|(\d+)\.)\s+/);
                    let insert = '\n';
                    if (bulletMatch) {
                      // Continue list
                      const indent = bulletMatch[1] || '';
                      const number = bulletMatch[3] ? parseInt(bulletMatch[3], 10) : null;
                      if (currentLine.trim().length === bulletMatch[0].trim().length) {
                        // Empty bullet -> exit list
                        insert = '\n';
                      } else if (number !== null) {
                        insert = `\n${indent}${number + 1}. `;
                      } else {
                        insert = `\n${indent}- `;
                      }
                    } else {
                      // Start new list
                      insert = '\n- ';
                    }
                    const newVal = value.slice(0, start) + insert + value.slice(end);
                    setInput(newVal);
                    requestAnimationFrame(() => {
                      const newPos = start + insert.length;
                      ta.selectionStart = ta.selectionEnd = newPos;
                      // Auto-resize
                      ta.style.height = '44px';
                      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
                    });
                    return;
                  }
                  // Plain Enter: Just newline with smart list continuation
                  e.preventDefault();
                  const start = ta.selectionStart ?? 0;
                  const end = ta.selectionEnd ?? 0;
                  const value = ta.value;
                  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                  const currentLine = value.slice(lineStart, start);
                  const bulletMatch = currentLine.match(/^(\s*)([-*]|(\d+)\.)\s+/);
                  let insert = '\n';
                  if (bulletMatch) {
                    const indent = bulletMatch[1] || '';
                    const number = bulletMatch[3] ? parseInt(bulletMatch[3], 10) : null;
                    if (currentLine.trim().length === bulletMatch[0].trim().length) {
                      // Empty bullet -> exit list
                      insert = '\n';
                    } else if (number !== null) {
                      insert = `\n${indent}${number + 1}. `;
                    } else {
                      insert = `\n${indent}- `;
                    }
                  }
                  const newVal = value.slice(0, start) + insert + value.slice(end);
                  setInput(newVal);
                  requestAnimationFrame(() => {
                    const newPos = start + insert.length;
                    ta.selectionStart = ta.selectionEnd = newPos;
                    // Auto-resize
                    ta.style.height = '44px';
                    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
                  });
                  return;
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Tab') setTabHeld(false);
              }}
              placeholder="Ask Neptune... (⌘K to focus)"
              className="flex-1 min-h-[44px] max-h-[200px] resize-none rounded-md border bg-background px-3 py-2 text-sm min-w-0"
              disabled={isLoading || isRecording}
              aria-label="Message Neptune, press Command+K to focus"
              rows={1}
            />
            
            
            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className={`h-9 w-9 shrink-0 ${isRecording ? "animate-pulse" : ""}`}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSend(undefined)}
              disabled={
                (!input.trim() && pendingAttachments.length === 0) || isLoading || isRecording
              }
              size="icon"
              className="h-9 w-9 shrink-0 bg-nebula-violet hover:bg-nebula-violet/90 text-white"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )}
      </div>
    </NeptuneCardWrapper>
  );
}
