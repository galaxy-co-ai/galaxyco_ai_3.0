"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import VoiceRecorder from "./VoiceRecorder";

interface Attachment {
  type: 'file' | 'image' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType?: string;
}

interface MessageComposerProps {
  conversationId: string;
  channel: 'email' | 'text' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat' | 'support';
  replyToId?: string;
  onCancelReply?: () => void;
  replyToPreview?: string;
}

export default function MessageComposer({
  conversationId,
  channel,
  replyToId,
  onCancelReply,
  replyToPreview,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/team/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        const attachment: Attachment = {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: data.attachment?.url || data.url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        };
        setPendingAttachments(prev => [...prev, attachment]);
      } catch (error) {
        logger.error("Upload failed", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload file");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && pendingAttachments.length === 0) {
      toast.error("Please enter a message or attach a file");
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: message || (pendingAttachments.length > 0 ? " " : ""),
          direction: "outbound",
          replyToId,
          attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessage("");
      setPendingAttachments([]);
      onCancelReply?.();
      toast.success("Message sent");
      window.dispatchEvent(new Event("conversation-updated"));
    } catch (error) {
      logger.error("Failed to send message", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* Reply preview */}
      {replyToId && replyToPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <div className="flex-1 truncate text-muted-foreground">
            Replying to: {replyToPreview}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border text-sm"
            >
              {att.type === 'image' ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(att.size)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -mr-1"
                onClick={() => removeAttachment(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          placeholder={
            channel === 'email'
              ? "Type your email..."
              : channel === 'sms'
              ? "Type your message..."
              : "Type your message..."
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none"
          disabled={isSending}
        />
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Voice message"
            onClick={() => setShowVoiceRecorder(true)}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && pendingAttachments.length === 0) || isSending}
          size="icon"
          className="h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="mt-2">
          <VoiceRecorder
            onRecorded={(attachment) => {
              setPendingAttachments(prev => [...prev, attachment]);
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
    </div>
  );
}
