"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface MessageComposerProps {
  conversationId: string;
  channel: 'email' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat';
}

export default function MessageComposer({
  conversationId,
  channel,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
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
          body: message,
          direction: "outbound",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessage("");
      toast.success("Message sent");
      // Trigger a refresh of the conversation thread
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

  return (
    <div className="space-y-2">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          size="icon"
          className="h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
