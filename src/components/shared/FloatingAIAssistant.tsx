"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Copy,
  Check,
  Move,
  History,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// Start with empty - let the assistant learn and personalize
const initialMessages: Message[] = [];

export function FloatingAIAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 420, height: 720 });
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Show minimal, personalized greeting when first opened
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      // Minimal greeting - let the AI learn from the user's first message
      const greetingMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Hey! What are you working on?",
        timestamp: "Just now",
      };
      setMessages([greetingMessage]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, messages.length]);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (scrollRef.current && (messages.length > 0 || isTyping)) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Handle window resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current || !chatWindowRef.current) return;

      // Calculate delta from start position
      const deltaX = resizeStartRef.current.x - e.clientX; // Positive when dragging left
      const deltaY = resizeStartRef.current.y - e.clientY; // Positive when dragging up

      // When dragging from top-left corner with bottom-right fixed:
      // - Dragging left (deltaX positive) increases width
      // - Dragging up (deltaY positive) increases height
      const newWidth = Math.max(320, Math.min(900, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(400, Math.min(900, resizeStartRef.current.height + deltaY));

      setWindowSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!chatWindowRef.current) return;

    const rect = chatWindowRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: windowSize.width,
      height: windowSize.height,
    };
    setIsResizing(true);
  };

  // Simple markdown renderer - handles code blocks, inline code, lists, and bold
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
          // End code block
          elements.push(
            <pre key={`code-${idx}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto my-2">
              <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>{codeBlockContent.trim()}</code>
            </pre>
          );
          codeBlockContent = '';
          codeBlockLang = '';
          inCodeBlock = false;
        } else {
          // Start code block
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
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={`list-${idx}`} className="list-disc list-inside ml-2 mb-1">
            {line.replace(/^[-\*]\s+/, '')}
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
            return <code key={partIdx} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{code}</code>;
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
        <pre key="code-end" className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto my-2">
          <code>{codeBlockContent.trim()}</code>
        </pre>
      );
    }
    
    return <>{elements}</>;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: "Just now"
    };

    setMessages(prev => [...prev, newMessage]);
    const messageToSend = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    // Create assistant message placeholder for streaming (but don't show it until we have content)
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);
    // Don't add empty message - we'll add it when first content arrives

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Track full response for error handling
    let fullResponse = '';

    // Add timeout (60 seconds)
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsTyping(false);
        setStreamingMessageId(null);
        toast.error('Request timed out. Please try again.');
      }
    }, 60000);

    try {
      logger.info('Sending message to AI assistant', { message: messageToSend.substring(0, 50) });
      
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationId: conversationId || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      logger.info('Received response', { status: response.status, ok: response.ok });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          logger.error('API error response', { status: response.status, error: errorData });
        } catch (e) {
          // If response isn't JSON, try text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body - the server did not return any data');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      fullResponse = '';
      let hasReceivedContent = false;
      let streamTimeout: NodeJS.Timeout | null = setTimeout(() => {
        if (!hasReceivedContent) {
          reader.cancel();
          throw new Error('Stream timeout - no response received');
        }
      }, 10000); // 10 second timeout for first chunk

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (streamTimeout) {
              clearTimeout(streamTimeout);
              streamTimeout = null;
            }
            break;
          }
          
          if (value && value.length > 0) {
            hasReceivedContent = true;
            if (streamTimeout) {
              clearTimeout(streamTimeout);
              streamTimeout = null;
            }
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue; // Skip empty lines
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                // Stream complete
                break;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Handle errors first
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                
                // Handle content chunks
                if (parsed.content) {
                  fullResponse += parsed.content;
                  // Update or create streaming message in real-time
                  setMessages(prev => {
                    const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
                    if (existingIndex >= 0) {
                      // Update existing message
                      return prev.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: fullResponse }
                          : msg
                      );
                    } else {
                      // Create new message with content
                      return [...prev, {
                        id: assistantMessageId,
                        role: "assistant",
                        content: fullResponse,
                        timestamp: "Just now"
                      }];
                    }
                  });
                }
                
                // Handle conversation ID
                if (parsed.conversationId && !conversationId) {
                  setConversationId(parsed.conversationId);
                }
                
                // Handle completion signal
                if (parsed.done) {
                  break;
                }
              } catch (parseError) {
                // If it's an Error object that was thrown (not a parse error), re-throw it
                if (parseError instanceof Error && parseError.message !== '[object Object]') {
                  throw parseError;
                }
                // Otherwise, skip invalid JSON (might be partial data)
                logger.debug('Skipping invalid JSON in stream', { data, error: parseError });
              }
            }
          }
        }
      } catch (streamError) {
        // Handle errors during stream reading
        if (streamError instanceof Error) {
          throw streamError;
        }
        if (streamTimeout) {
          clearTimeout(streamTimeout);
          streamTimeout = null;
        }
        throw new Error('An error occurred while reading the stream');
      } finally {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
          streamTimeout = null;
        }
      }

      // Check if we received any content
      if (!fullResponse && !hasReceivedContent) {
        throw new Error('No response received from AI assistant');
      }

      // Final update with full response (or create if it doesn't exist)
      setMessages(prev => {
        const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
        const finalMessage = {
          id: assistantMessageId,
          role: "assistant" as const,
          content: fullResponse,
          timestamp: "Just now",
          suggestions: [
            "Build a workflow for this",
            "Generate documentation",
            "Show me an example"
          ]
        };
        
        if (existingIndex >= 0) {
          return prev.map(msg => 
            msg.id === assistantMessageId ? finalMessage : msg
          );
        } else {
          return [...prev, finalMessage];
        }
      });

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
      
      logger.error('AI chat streaming error', errorDetails);
      
      // Show user-friendly error message (but keep specific details for debugging)
      let userMessage = errorMessage;
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401') || errorMessage.includes('Authentication error')) {
        userMessage = 'Please sign in to use the AI assistant.';
      } else if (errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) {
        userMessage = 'AI service is not configured. Please contact support.';
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (errorMessage.includes('Database error:')) {
        // Keep the specific database error message for debugging
        userMessage = errorMessage;
      } else if (errorMessage.includes('database') || errorMessage.includes('query')) {
        // Generic database error
        userMessage = `Database error: ${errorMessage}. Please check the console for details.`;
      }
      
      // Update assistant message with error state (if we have partial content)
      if (fullResponse) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: fullResponse,
              }
            : msg
        ));
        toast.error(userMessage);
      } else {
        // Remove both user and assistant messages on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id && msg.id !== assistantMessageId));
        toast.error(userMessage);
      }
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleNewConversation = () => {
    // Clear current conversation
    setMessages(initialMessages);
    setConversationId(null);
    setHasGreeted(false);
    setInputValue("");
    setIsTyping(false);
    setStreamingMessageId(null);
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    toast.success("New conversation started");
  };

  const handleShowHistory = () => {
    // Navigate to assistant page with history sidebar open
    router.push('/assistant?history=true');
    // Close floating chat if open
    setIsOpen(false);
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
            ref={chatWindowRef}
            style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3.5 flex items-center justify-between shrink-0 relative">
              {/* Resize Handle - Top Left Corner */}
              <div
                onMouseDown={handleResizeStart}
                className="absolute top-0 left-0 w-10 h-10 cursor-nwse-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group z-10 rounded-br-lg hover:bg-white/10"
                title="Drag to resize window"
              >
                <Move className="h-5 w-5 text-white rotate-45" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white text-sm">AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShowHistory}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="Conversation history"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="Start new conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="Minimize"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-hidden bg-gray-50/50">
                  <ScrollArea className="h-full" ref={scrollRef}>
                    <div className="p-4 space-y-3">
                      {messages.map((message) => {
                        // Don't show empty assistant messages (they're handled by typing indicator)
                        if (message.role === "assistant" && !message.content) {
                          return null;
                        }
                        
                        return (
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
                                {message.role === "assistant" && message.content ? (
                                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                                    {renderMarkdown(message.content)}
                                  </div>
                                ) : message.role === "user" ? (
                                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                                ) : null}
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
                        );
                      })}

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
                      onKeyPress={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
                      disabled={isTyping}
                      className="flex-1 h-9 rounded-full border-gray-300 bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                      aria-label="Message input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                      aria-label="Send message"
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

