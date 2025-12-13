"use client";

import * as React from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSubmit(input);
    setInput("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="relative max-w-4xl mx-auto w-full p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative flex items-end gap-2 p-2 rounded-3xl border bg-background/60 backdrop-blur-xl shadow-2xl transition-all duration-300",
          "focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50"
        )}
      >
        <div className="flex items-center gap-1 pb-2 pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Galaxy AI..."
          className="min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent px-2 py-3 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide placeholder:text-muted-foreground/50"
          rows={1}
        />

        <div className="flex items-center gap-1 pb-2 pr-2">
           <AnimatePresence mode="wait">
            {input.trim() ? (
              <motion.div
                key="send"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSubmit}
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                  aria-label="Send message"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                 key="mic"
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0, opacity: 0 }}
                 transition={{ duration: 0.2 }}
              >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <div className="text-center mt-2">
        <p className="text-[10px] text-muted-foreground/60">
          Galaxy AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}

