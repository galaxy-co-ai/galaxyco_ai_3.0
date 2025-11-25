"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquarePlus, History, X } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, Message } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Analyze my sales pipeline trends",
  "Draft a follow-up email for warm leads",
  "Create a new automation for onboarding",
  "Summarize recent customer feedback"
];

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  lastMessageAt: string | Date;
  isPinned: boolean;
}

function AssistantChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Check if history should be opened from query parameter
  React.useEffect(() => {
    if (searchParams.get('history') === 'true') {
      setShowHistory(true);
      // Remove query parameter from URL
      router.replace('/assistant', { scroll: false });
    }
  }, [searchParams, router]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations when history is opened
  React.useEffect(() => {
    if (showHistory) {
      fetchConversations();
    }
  }, [showHistory]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (id: string) => {
    if (id === conversationId) return; // Already loaded
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assistant/conversations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      setConversationId(data.id);
      
      // Convert messages to Message format
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));
      
      setMessages(loadedMessages);
      toast.success('Conversation loaded');
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation when clicking delete
    e.preventDefault();

    // Optimistically remove from UI immediately
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If this was the current conversation, clear it
    if (id === conversationId) {
      setMessages([]);
      setConversationId(null);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // If delete failed, restore the conversation in the list
        fetchConversations();
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete' }));
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      // Success - conversation already removed from UI
      // Refresh to ensure list is in sync
      fetchConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      // Restore conversations list on error
      fetchConversations();
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation';
      toast.error(errorMessage);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Add AI response
      const aiResponse: Message = {
        id: data.message.id || (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        createdAt: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      
      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className={`absolute inset-0 z-0 opacity-50 transition-all duration-300 ${showHistory ? 'mr-80' : ''}`}>
        <CosmicBackground />
      </div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b bg-background/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Galaxy AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)} 
            className="text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4 mr-2" />
            Past Convos
          </Button>
          
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-foreground">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
      </header>

      {/* Past Convos Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-background border-l shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Past Convos</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No past conversations</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            loadConversation(conv.id);
                            setShowHistory(false);
                          }}
                          className={`group relative w-full p-3 rounded-lg transition-colors cursor-pointer ${
                            conv.id === conversationId
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted border border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 pr-6">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm break-words">{conv.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                {conv.lastMessage || 'No messages'}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {conv.messageCount} {conv.messageCount === 1 ? 'message' : 'messages'}
                                </span>
                                {conv.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    • {new Date(conv.lastMessageAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Delete button - appears on hover */}
                          <button
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-opacity z-10"
                            title="Delete conversation"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="max-w-4xl mx-auto w-full pb-4 px-4">
             <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-center space-y-8"
                >
                  <div className="bg-gradient-to-b from-primary/20 to-transparent p-6 rounded-full">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h2 className="text-2xl font-bold">How can I help you today?</h2>
                    <p className="text-muted-foreground">
                      I can help you manage your CRM, analyze data, and automate your daily workflows.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start text-left bg-background/40 hover:bg-background/60 border-primary/20 hover:border-primary/50 transition-all"
                        onClick={() => handleSendMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6 py-4">
                  {messages.map((msg, i) => (
                    <ChatMessage key={msg.id} message={msg} isLast={i === messages.length - 1} />
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-4 md:max-w-3xl md:mx-auto"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                         <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1 h-8">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="relative z-20">
           <div className="absolute bottom-full w-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
           <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default function AssistantChat() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AssistantChatContent />
    </Suspense>
  );
}
