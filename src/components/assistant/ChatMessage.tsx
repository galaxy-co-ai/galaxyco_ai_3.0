"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === "user";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group w-full flex gap-4 p-4 md:max-w-3xl md:mx-auto",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex-shrink-0">
        <Avatar className={cn("h-8 w-8", isUser ? "bg-primary/10" : "bg-purple-500/10")}>
          {isUser ? (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-purple-600 text-white">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className={cn("flex-1 space-y-2 min-w-0", isUser ? "flex flex-col items-end" : "")}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? "You" : "Galaxy AI"}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className={cn(
          "text-sm leading-relaxed prose dark:prose-invert max-w-none break-words overflow-wrap-anywhere",
          isUser 
            ? "bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%]" 
            : "text-foreground/90"
        )}>
            {message.content.split('\n').map((line, i) => (
                <p key={i} className={i === 0 ? "mt-0" : ""}>{line || "\u00A0"}</p>
            ))}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

