"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  RefreshCw,
  FileText,
  Paperclip,
  X,
  ImageIcon,
  Loader2,
  Presentation,
  ExternalLink,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import QuickActions from "./QuickActions";
import { useNeptune, type Attachment } from "@/contexts/neptune-context";
import type { Conversation } from "./ConversationsDashboard";

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
    sendMessage,
    clearConversation,
  } = useNeptune();

  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() && pendingAttachments.length === 0) return;

    const attachmentsToSend = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);

    await sendMessage(messageToSend, attachmentsToSend, feature);
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
              <div className="flex items-center gap-3">
                <Sparkles
                  className="w-6 h-6"
                  style={{
                    stroke: "url(#icon-gradient-neptune-card)",
                    strokeWidth: 2,
                    filter: "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))",
                  }}
                />
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient
                      id="icon-gradient-neptune-card"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <h2
                  className="branded-page-title-compact md:branded-page-title text-base md:text-xl uppercase"
                  style={{
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <span className="md:hidden">NEPTUNE</span>
                  <span className="hidden md:inline">N E P T U N E</span>
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Start new conversation"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                New Chat
              </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={clearConversation}
                  aria-label="Start new conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Only show in default variant with conversation context */}
        {!isFullscreen && legacyConversation && (
          <div className="border-b p-4">
            <QuickActions
              conversationId={legacyConversationId ?? null}
              onAction={handleQuickAction}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Chat Messages */}
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
                      ? "bg-primary text-primary-foreground"
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

                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(undefined);
                }
              }}
              placeholder="Ask Neptune..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-w-0"
              disabled={isLoading}
              aria-label="Message Neptune"
            />
            <Button
              onClick={() => handleSend(undefined)}
              disabled={
                (!input.trim() && pendingAttachments.length === 0) || isLoading
              }
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </NeptuneCardWrapper>
  );
}
