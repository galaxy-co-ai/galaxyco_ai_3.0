"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Lightbulb,
  Trash2,
  FileText,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BrainstormChatProps {
  onGenerateOutline?: (outline: OutlineData) => void;
  initialTopic?: string;
}

interface OutlineData {
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    type: 'intro' | 'body' | 'conclusion' | 'cta';
    bullets?: string[];
    wordCount?: number;
  }>;
  suggestedAngle: string;
  targetAudience: string;
  layout: string;
  topicId?: string;
}

export function BrainstormChat({ onGenerateOutline, initialTopic }: BrainstormChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(initialTopic || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial topic if provided
  useEffect(() => {
    if (initialTopic && messages.length === 0) {
      sendMessage(initialTopic);
    }
  }, [initialTopic]);

  // Send message to brainstorm API
  const sendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isStreaming) return;

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Create placeholder for assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/admin/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.content) {
                fullContent += parsed.content;
                // Update the last message with streaming content
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content: fullContent,
                  };
                  return newMessages;
                });
              }
              
              if (parsed.sessionId) {
                setSessionId(parsed.sessionId);
              }
              
              if (parsed.keyInsights) {
                setKeyInsights(parsed.keyInsights);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  // Generate outline from conversation
  const handleGenerateOutline = async () => {
    if (!sessionId || messages.length < 2) {
      toast.error('Have a conversation first before generating an outline');
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const response = await fetch('/api/admin/ai/outline/from-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          layout: 'standard', // Default layout, could be made selectable
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate outline');
      }

      const data = await response.json();
      toast.success('Outline generated successfully!');
      
      if (onGenerateOutline) {
        onGenerateOutline({
          ...data.outline,
          topicId: data.topicId,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate outline');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setSessionId(null);
    setKeyInsights([]);
    setInputValue('');
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Brainstorm Mode
              </CardTitle>
              <CardDescription>
                Chat with AI to develop your article idea
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  aria-label="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleGenerateOutline}
                disabled={messages.length < 2 || isGeneratingOutline || isStreaming}
                aria-label="Generate outline from conversation"
              >
                {isGeneratingOutline ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Outline
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-amber-500/50" />
                <h3 className="text-lg font-medium mb-2">Start Brainstorming</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Share your rough idea, question, or scattered thoughts. 
                  The AI will help you refine it into a clear article direction.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "I want to write about AI in business but I'm not sure what angle...",
                    "How do I make a boring topic interesting?",
                    "I have data about customer behavior but don't know how to frame it",
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left max-w-xs"
                      disabled={isStreaming}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && !message.content && isStreaming && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Key insights */}
          {keyInsights.length > 0 && (
            <div className="px-4 py-2 border-t bg-amber-50/50">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">Key Insights</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {keyInsights.map((insight, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-white border-amber-200 text-amber-700"
                  >
                    {insight.length > 50 ? insight.slice(0, 50) + '...' : insight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t bg-background">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts, ideas, or questions..."
                className={cn(
                  "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "placeholder:text-muted-foreground",
                  "min-h-[40px] max-h-[120px]"
                )}
                disabled={isStreaming}
                rows={1}
                aria-label="Message input"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
                aria-label="Send message"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

