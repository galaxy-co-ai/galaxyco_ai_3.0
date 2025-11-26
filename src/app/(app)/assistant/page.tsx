"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  Send,
  MessageSquare,
  Clock,
  Plus,
  History,
  Trash2,
  ArrowRight,
  Loader2,
  Bot,
  Lightbulb,
  FileText,
  Workflow,
  Brain,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
}

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const showHistoryParam = searchParams.get("history") === "true";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(showHistoryParam);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch conversation history
  const { data: conversationsData, error: convError, mutate: mutateConversations } = useSWR<{ conversations: Conversation[] }>(
    "/api/assistant/conversations",
    fetcher,
    { refreshInterval: 30000 }
  );

  const conversations = conversationsData?.conversations || [];

  // Fetch messages for selected conversation
  const { data: messagesData, mutate: mutateMessages } = useSWR<{ messages: Message[] }>(
    conversationId ? `/api/assistant/conversations/${conversationId}` : null,
    fetcher
  );

  // Update messages when conversation changes
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages.map(m => ({
        ...m,
        createdAt: new Date(m.createdAt)
      })));
    }
  }, [messagesData]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Add greeting message for new conversations
  useEffect(() => {
    if (!conversationId && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: "👋 Hey! I'm Galaxy AI, your intelligent assistant.\n\nI can help you with:\n- **Workflow automation** - Build agents to automate tasks\n- **Document generation** - Create reports, summaries, and content\n- **Data analysis** - Analyze and extract insights from your data\n- **CRM management** - Manage leads, contacts, and deals\n\nWhat would you like to work on today?",
        createdAt: new Date(),
      }]);
    }
  }, [conversationId, messages.length]);

  const renderMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';
    
    lines.forEach((line, idx) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-2">
              <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>{codeBlockContent.trim()}</code>
            </pre>
          );
          codeBlockContent = '';
          codeBlockLang = '';
          inCodeBlock = false;
        } else {
          codeBlockLang = line.slice(3).trim();
          inCodeBlock = true;
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return;
      }
      
      // Handle lists
      if (line.trim().startsWith('- ')) {
        const content = line.replace(/^[-]\s+/, '');
        // Handle bold in list items
        const parts = content.split(/(\*\*[^*]+\*\*)/);
        const formattedContent = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          return <span key={partIdx}>{part}</span>;
        });
        elements.push(
          <li key={`list-${idx}`} className="list-disc list-inside ml-2 mb-1">
            {formattedContent}
          </li>
        );
        return;
      }
      
      // Handle headers
      if (line.trim().startsWith('## ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="font-semibold text-base mt-3 mb-2">
            {line.replace(/^##\s+/, '')}
          </h3>
        );
        return;
      }
      
      if (line.trim().startsWith('# ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="font-bold text-lg mt-4 mb-2">
            {line.replace(/^#\s+/, '')}
          </h2>
        );
        return;
      }
      
      // Handle regular text with inline code and bold
      if (line.trim()) {
        const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
        const formattedLine = parts.map((part, partIdx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            const code = part.slice(1, -1);
            return <code key={partIdx} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{code}</code>;
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          return <span key={partIdx}>{part}</span>;
        });
        elements.push(
          <p key={`p-${idx}`} className="mb-1 leading-relaxed">
            {formattedLine}
          </p>
        );
      } else if (idx < lines.length - 1) {
        elements.push(<br key={`br-${idx}`} />);
      }
    });
    
    // Close any open code block
    if (inCodeBlock) {
      elements.push(
        <pre key="code-end" className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-2">
          <code>{codeBlockContent.trim()}</code>
        </pre>
      );
    }
    
    return <>{elements}</>;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationId: conversationId || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.error) throw new Error(parsed.error);
            
            if (parsed.content) {
              fullResponse += parsed.content;
              setMessages(prev => {
                const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
                const assistantMsg: Message = {
                  id: assistantMessageId,
                  role: "assistant",
                  content: fullResponse,
                  createdAt: new Date(),
                };
                
                if (existingIndex >= 0) {
                  return prev.map(msg => msg.id === assistantMessageId ? assistantMsg : msg);
                } else {
                  return [...prev, assistantMsg];
                }
              });
            }
            
            if (parsed.conversationId && !conversationId) {
              setConversationId(parsed.conversationId);
              mutateConversations();
            }
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message !== '[object Object]') {
              throw parseError;
            }
          }
        }
      }

      // Final update
      setMessages(prev => {
        const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
        const finalMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: fullResponse,
          createdAt: new Date(),
        };
        
        if (existingIndex >= 0) {
          return prev.map(msg => msg.id === assistantMessageId ? finalMessage : msg);
        } else {
          return [...prev, finalMessage];
        }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      logger.error('AI chat error', { error });
      toast.error(errorMessage);
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setInputValue(messageToSend);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInputValue("");
    toast.success("New conversation started");
  };

  const handleSelectConversation = (convId: string) => {
    setConversationId(convId);
    setMessages([]);
  };

  const quickActions = [
    { icon: Workflow, label: "Build a workflow", prompt: "Help me build a workflow to " },
    { icon: FileText, label: "Generate document", prompt: "Generate documentation for " },
    { icon: Brain, label: "Analyze data", prompt: "Analyze the data for " },
    { icon: Zap, label: "Automate task", prompt: "Automate the task: " },
  ];

  // Stat badges
  const statBadges = [
    { label: `${conversations.length} Conversations`, icon: MessageSquare, color: "bg-blue-100 text-blue-700" },
    { label: "Always Learning", icon: Brain, color: "bg-purple-100 text-purple-700" },
    { label: "Context-Aware", icon: Sparkles, color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-base">
            Your intelligent partner for workflow automation and insights.
          </p>

          {/* Stat Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {statBadges.map((stat, index) => (
              <Badge
                key={index}
                className={`${stat.color} px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <stat.icon className="h-4 w-4" aria-hidden="true" />
                {stat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center gap-2">
          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-full"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-6 pb-6">
        <Card className="h-full shadow-lg border-0">
          <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-0">
            {/* Left: History Sidebar */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-r overflow-hidden md:col-span-1"
                >
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-purple-100/50">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Conversation History
                      </h3>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {conversations.length > 0 ? (
                          conversations.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => handleSelectConversation(conv.id)}
                              className={cn(
                                "w-full p-3 rounded-lg text-left transition-all hover:bg-gray-100",
                                conversationId === conv.id && "bg-purple-50 border border-purple-200"
                              )}
                            >
                              <p className="text-sm font-medium truncate">{conv.title || "Untitled"}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No conversations yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right: Chat Area */}
            <div className={cn(
              "flex flex-col h-full",
              showHistory ? "md:col-span-3" : "md:col-span-4"
            )}>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Galaxy AI</h3>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {isTyping ? "Thinking..." : "Online"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "flex-row-reverse" : ""
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn(
                        "flex-1 max-w-[80%]",
                        message.role === "user" ? "flex flex-col items-end" : ""
                      )}>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md"
                              : "bg-white text-gray-900 rounded-bl-md shadow-sm border"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none">
                              {renderMarkdown(message.content)}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                        </span>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white shadow-sm border">
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

                  {/* Quick Actions - Show when no messages except greeting */}
                  {messages.length <= 1 && !isTyping && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => setInputValue(action.prompt)}
                            className="rounded-full"
                          >
                            <action.icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="px-6 py-4 border-t bg-white">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isTyping) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isTyping}
                    className="flex-1 rounded-full border-gray-300"
                    aria-label="Message input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    aria-label="Send message"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
