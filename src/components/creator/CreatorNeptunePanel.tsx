"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  Paperclip,
  X,
  ImageIcon,
  FileText,
  Presentation,
  ExternalLink,
  Download,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNeptune, type Attachment } from "@/contexts/neptune-context";
import { useSimplePageContext } from "@/hooks/usePageContext";
import DynamicQuickActions from "@/components/neptune/DynamicQuickActions";
import type { CreatorTabType } from "./CreatorDashboard";

interface CreatorNeptunePanelProps {
  activeTab: CreatorTabType;
}

export default function CreatorNeptunePanel({ activeTab }: CreatorNeptunePanelProps) {
  // Use shared Neptune context for unified experience
  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    setPageContext,
  } = useNeptune();

  const [input, setInput] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report page context to Neptune - Creator-specific
  useSimplePageContext(
    'creator',
    activeTab === 'create' ? 'create' : 'dashboard',
    'Creator Studio'
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update page context when tab changes
  useEffect(() => {
    setPageContext({ activeTab });
  }, [activeTab, setPageContext]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/assistant/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        setPendingAttachments(prev => [...prev, data.attachment]);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload file");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/assistant/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        setPendingAttachments(prev => [...prev, data.attachment]);
        toast.success("Image pasted");
      } catch {
        toast.error("Failed to upload pasted image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle sending message using shared context
  const handleSend = async () => {
    if (!input.trim() && pendingAttachments.length === 0) return;
    if (isLoading) return;

    const messageToSend = input.trim();
    const attachmentsToSend = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);

    // Use shared Neptune context which includes page context automatically
    await sendMessage(messageToSend, attachmentsToSend, 'content-creation');
  };

  // Handle quick action - pass the prompt directly to shared context
  const handleQuickAction = async (prompt: string) => {
    await sendMessage(prompt, [], 'content-creation');
  };

  // Copy message content
  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-violet-50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Neptune</h3>
            <p className="text-xs text-purple-600">Creative AI helper</p>
          </div>
        </div>
      </div>

      {/* Dynamic Quick Actions - Context-aware */}
      <div className="px-4 py-3 border-b bg-gray-50/50">
        <DynamicQuickActions
          onAction={handleQuickAction}
          disabled={isLoading || isStreaming}
          variant="pills"
          maxActions={4}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 relative group",
                  message.role === "user"
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Gamma Document Display */}
                {message.metadata?.functionCalls?.some(fc => fc.name === 'create_professional_document') && (() => {
                  const gammaCall = message.metadata.functionCalls.find(fc => fc.name === 'create_professional_document');
                  const gammaData = gammaCall?.result?.data as { title?: string; contentType?: string; cards?: number; style?: string; editUrl?: string; pdfUrl?: string; pptxUrl?: string } | undefined;
                  
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
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                              Gamma.app
                            </Badge>
                          </div>
                          <p className="text-xs text-purple-600">
                            {gammaData.contentType && typeof gammaData.contentType === 'string' ? gammaData.contentType.charAt(0).toUpperCase() + gammaData.contentType.slice(1) : 'Document'} • {gammaData.cards} slides • {gammaData.style} style
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {gammaData.editUrl && (
                          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                            <a href={gammaData.editUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Edit in Gamma
                            </a>
                          </Button>
                        )}
                        
                        {gammaData.pdfUrl && (
                          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                            <a href={gammaData.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-1.5" />
                              Download PDF
                            </a>
                          </Button>
                        )}
                        
                        {gammaData.pptxUrl && (
                          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                            <a href={gammaData.pptxUrl} target="_blank" rel="noopener noreferrer">
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
                {message.metadata?.functionCalls?.some(fc => fc.name === 'generate_image') && (() => {
                  const imageCall = message.metadata.functionCalls.find(fc => fc.name === 'generate_image');
                  const imageData = imageCall?.result?.data as { imageUrl?: string; revisedPrompt?: string; size?: string; quality?: string; style?: string } | undefined;
                  
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
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                DALL-E 3
                              </Badge>
                              <span className="text-xs text-blue-600">
                                {imageData.size} • {imageData.quality || 'standard'} • {imageData.style || 'vivid'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {imageData.revisedPrompt}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                            <a href={imageData.imageUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1.5" />
                              View Full Size
                            </a>
                          </Button>
                          
                          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                            <a href={imageData.imageUrl} download={`dalle-${Date.now()}.png`}>
                              <Download className="h-3 w-3 mr-1.5" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Copy button for assistant messages */}
                {message.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    aria-label="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading/Streaming indicator */}
        {(isLoading || isStreaming) && !messages.some(m => m.isStreaming) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">
                  {isStreaming ? "Generating..." : "Thinking..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white">
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
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                {att.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="ml-1 hover:text-destructive"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
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
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Neptune anything..."
            className="flex-1 text-sm rounded-full border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            disabled={isLoading}
            aria-label="Message Neptune"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading || isStreaming}
            size="icon"
            className="rounded-full bg-purple-600 hover:bg-purple-700 h-9 w-9"
            aria-label="Send message"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}