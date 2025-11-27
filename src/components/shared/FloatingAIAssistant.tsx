"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  FileText,
  Workflow,
  Brain,
  Zap,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey! 👋 I'm Neptune, your AI sidekick. I can take action for you — create leads, schedule meetings, analyze your pipeline, draft emails — just tell me what you need.",
    timestamp: "Just now",
    suggestions: [
      "What's on my calendar today?",
      "Show me my hot leads",
      "I need to follow up with someone",
      "Help me get organized"
    ]
  }
];

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: "Just now"
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "On it! Let me look into that for you. What else would you like me to help with?",
        timestamp: "Just now",
        suggestions: [
          "Tell me more",
          "What else can you do?",
          "Thanks, that's all for now"
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] transition-all duration-300 group relative overflow-hidden"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 rounded-full"
              />
              <Sparkles className="h-6 w-6 text-white relative z-10" />
            </Button>
            
            {/* Notification Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white shadow-lg"
            >
              1
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[600px] bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white text-sm font-medium">Neptune</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-hidden bg-gray-50/50">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                                <Sparkles className="h-3.5 w-3.5" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`flex-1 min-w-0 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                                message.role === "user"
                                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white ml-auto rounded-br-md"
                                  : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                            </div>
                            
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {message.suggestions.map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="h-6 text-xs px-2.5 rounded-full bg-white hover:bg-gray-50 border-gray-200"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            )}
                            
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {message.timestamp}
                            </span>
                          </div>

                          {message.role === "user" && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                                U
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                              <Sparkles className="h-3.5 w-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white shadow-sm">
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                className="h-2 w-2 bg-gray-400 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Input - Fixed to Bottom */}
                <div className="px-3 py-3 border-t bg-white shrink-0">
                  <div className="flex gap-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => setInputValue("Build a workflow for ")}>
                          <Workflow className="h-4 w-4 mr-2 text-blue-500" />
                          Build Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setInputValue("Generate documentation for ")}>
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          Generate Doc
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setInputValue("Analyze data for ")}>
                          <Brain className="h-4 w-4 mr-2 text-green-500" />
                          Analyze Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setInputValue("Automate task: ")}>
                          <Zap className="h-4 w-4 mr-2 text-orange-500" />
                          Automate Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      placeholder="Ask me anything..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 h-9 rounded-full border-gray-300 bg-gray-50 focus:bg-white text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

