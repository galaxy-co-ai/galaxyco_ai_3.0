"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface NeptuneMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: "image" | "document" | "file";
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  metadata?: {
    functionCalls?: Array<{
      name: string;
      args: unknown;
      result: { data?: unknown };
    }>;
  };
  isStreaming?: boolean;
}

export interface Attachment {
  type: "image" | "document" | "file";
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface NeptuneContextValue {
  // State
  conversationId: string | null;
  messages: NeptuneMessage[];
  isLoading: boolean;
  isInitialized: boolean;
  isStreaming: boolean;
  conversationHistory: ConversationHistoryItem[];
  isLoadingHistory: boolean;
  currentPage: string;
  currentToolStatus: string | null;

  // Actions
  sendMessage: (
    message: string,
    attachments?: Attachment[],
    feature?: string
  ) => Promise<void>;
  clearConversation: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  fetchConversationHistory: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setCurrentPage: (page: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NeptuneContext = createContext<NeptuneContextValue | null>(null);

// ============================================================================
// STREAMING HELPERS
// ============================================================================

interface StreamEvent {
  content?: string;
  conversationId?: string;
  messageId?: string;
  error?: string;
  done?: boolean;
  toolExecution?: boolean;
  tools?: string[];
  toolResults?: Array<{ name: string; success: boolean }>;
  metadata?: NeptuneMessage["metadata"];
}

async function* parseSSEStream(
  response: Response
): AsyncGenerator<StreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            return;
          }

          try {
            const event = JSON.parse(data) as StreamEvent;
            yield event;
          } catch {
            // Skip malformed JSON
            logger.warn("[Neptune Stream] Failed to parse event", { data });
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

const STORAGE_KEY = "neptune_conversation_id";

export function NeptuneProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NeptuneMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);
  const initRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Neptune - restore conversation if available
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeNeptune = async () => {
      try {
        // Try to restore previous conversation
        let storedConversationId: string | null = null;
        if (typeof window !== "undefined") {
          storedConversationId = localStorage.getItem(STORAGE_KEY);
        }

        if (storedConversationId) {
          // Try to load the stored conversation
          try {
            const response = await fetch(
              `/api/neptune/conversation?conversationId=${storedConversationId}`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.messages && data.messages.length > 0) {
                setConversationId(storedConversationId);
                setMessages(
                  data.messages.map(
                    (msg: {
                      id: string;
                      role: string;
                      content: string;
                      createdAt: string;
                      attachments?: NeptuneMessage["attachments"];
                      metadata?: NeptuneMessage["metadata"];
                    }) => ({
                      id: msg.id,
                      role: msg.role as "user" | "assistant",
                      content: msg.content,
                      timestamp: new Date(msg.createdAt),
                      attachments: msg.attachments,
                      metadata: msg.metadata,
                    })
                  )
                );
                setIsInitialized(true);
                logger.debug("[Neptune] Restored conversation", { conversationId: storedConversationId });
                return;
              }
            }
          } catch (error) {
            logger.warn("[Neptune] Failed to restore conversation, starting fresh", { error });
            // Clear invalid conversation ID
            if (typeof window !== "undefined") {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }

        // No valid conversation to restore - show welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hey! I'm Neptune. I see you're just getting started - perfect timing. Tell me about your business in a sentence or two. What do you do and who do you serve? I'll build you a personalized setup roadmap from there.",
            timestamp: new Date(),
          },
        ]);

        setIsInitialized(true);
        logger.debug("[Neptune] Initialized with fresh conversation");
      } catch (error) {
        logger.error("[Neptune] Initialization failed", error);
        // Still mark as initialized to prevent infinite retries
        setIsInitialized(true);
        // Show welcome message even on error
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hey! I'm Neptune. I see you're just getting started - perfect timing. Tell me about your business in a sentence or two. What do you do and who do you serve? I'll build you a personalized setup roadmap from there.",
            timestamp: new Date(),
          },
        ]);
      }
    };

    initializeNeptune();
  }, []);

  // Send message to Neptune with streaming
  const sendMessage = useCallback(
    async (message: string, attachments?: Attachment[], feature?: string) => {
      if (!message.trim() && (!attachments || attachments.length === 0)) return;

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message immediately (optimistic)
      const userMessage: NeptuneMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
        attachments,
      };

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: NeptuneMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId,
            attachments,
            context: {
              type: "neptune",
              feature,
            },
            feature,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          // Try to get error from response
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            // Not JSON, use status text
          }
          throw new Error(errorMessage);
        }

        // Process streaming response
        let streamedContent = "";
        let newConversationId: string | null = null;
        let finalMetadata: NeptuneMessage["metadata"] | undefined;
        let finalMessageId: string | undefined;

        for await (const event of parseSSEStream(response)) {
          // Handle errors
          if (event.error) {
            throw new Error(event.error);
          }

          // Update conversation ID if provided
          if (event.conversationId && event.conversationId !== conversationId) {
            newConversationId = event.conversationId;
          }

          // Stream content
          if (event.content) {
            streamedContent += event.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          }

          // Handle tool execution notification
          if (event.toolExecution && event.tools) {
            logger.debug("[Neptune] Tool execution", { tools: event.tools });
            // Set contextual tool status for UI feedback
            const toolStatusMap: Record<string, string> = {
              search_web: "Searching the web...",
              generate_image: "Generating image...",
              create_professional_document: "Creating document...",
              analyze_company_website: "Analyzing website...",
              create_lead: "Creating lead...",
              create_contact: "Adding contact...",
              schedule_meeting: "Scheduling meeting...",
              draft_email: "Drafting email...",
              update_dashboard_roadmap: "Updating roadmap...",
              create_agent: "Creating agent...",
              navigate_to_page: "Navigating...",
              generate_pdf: "Generating PDF...",
            };
            const firstTool = event.tools[0];
            setCurrentToolStatus(toolStatusMap[firstTool] || `Running ${firstTool}...`);
          }

          // Handle tool results
          if (event.toolResults) {
            logger.debug("[Neptune] Tool results", {
              results: event.toolResults,
            });
          }

          // Handle completion
          if (event.done) {
            finalMetadata = event.metadata;
            finalMessageId = event.messageId;
          }
        }

        // Update conversation ID if changed
        if (newConversationId) {
          setConversationId(newConversationId);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, newConversationId);
          }
        }

        // Finalize assistant message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  id: finalMessageId || assistantMessageId,
                  content: streamedContent || "I'm here to help!",
                  isStreaming: false,
                  metadata: finalMetadata,
                }
              : msg
          )
        );

        // Check for navigation tool results and dispatch event
        if (finalMetadata?.functionCalls) {
          for (const funcCall of finalMetadata.functionCalls) {
            const result = funcCall.result?.data as Record<string, unknown> | undefined;
            if (result?.dispatchEvent === 'neptune-navigate' && result.url) {
              window.dispatchEvent(new CustomEvent('neptune-navigate', {
                detail: { url: result.url as string },
              }));
            }
          }
        }
      } catch (error) {
        // Handle abort (user initiated)
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("[Neptune] Stream aborted by user");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: msg.content || "Message cancelled.",
                    isStreaming: false,
                  }
                : msg
            )
          );
          return;
        }

        logger.error("[Neptune] Send message failed", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to get response from Neptune";
        toast.error(errorMsg);

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "I encountered an issue. Please try again or rephrase your question.",
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setCurrentToolStatus(null);
        abortControllerRef.current = null;
      }
    },
    [conversationId]
  );

  // Clear conversation and start fresh
  const clearConversation = useCallback(async () => {
    try {
      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Reset state
      setConversationId(null);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Fresh start! What would you like to tackle?",
          timestamp: new Date(),
        },
      ]);

      // Create new conversation on next message
      toast.success("Started a new conversation");
    } catch (error) {
      logger.error("[Neptune] Clear conversation failed", error);
      toast.error("Failed to clear conversation");
    }
  }, []);

  // Refresh messages from server
  const refreshMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/neptune/conversation?conversationId=${conversationId}`
      );

      if (!response.ok) {
        throw new Error("Failed to refresh messages");
      }

      const data = await response.json();

      if (data.messages) {
        setMessages(
          data.messages.map(
            (msg: {
              id: string;
              role: string;
              content: string;
              createdAt: string;
              attachments?: NeptuneMessage["attachments"];
              metadata?: NeptuneMessage["metadata"];
            }) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              attachments: msg.attachments,
              metadata: msg.metadata,
            })
          )
        );
      }
    } catch (error) {
      logger.error("[Neptune] Refresh messages failed", error);
    }
  }, [conversationId]);

  // Load a specific conversation from history
  const loadConversation = useCallback(async (targetConversationId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/neptune/conversation?conversationId=${targetConversationId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await response.json();

      // Update conversation ID and save to localStorage
      setConversationId(data.conversationId);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, data.conversationId);
      }

      // Load messages
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map(
            (msg: {
              id: string;
              role: string;
              content: string;
              createdAt: string;
              attachments?: NeptuneMessage["attachments"];
              metadata?: NeptuneMessage["metadata"];
            }) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              attachments: msg.attachments,
              metadata: msg.metadata,
            })
          )
        );
      }

      logger.debug("[Neptune] Loaded conversation", {
        conversationId: targetConversationId,
        messageCount: data.messages?.length || 0,
      });
    } catch (error) {
      logger.error("[Neptune] Load conversation failed", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch conversation history
  const fetchConversationHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);

      const response = await fetch("/api/assistant/conversations");

      if (!response.ok) {
        throw new Error("Failed to fetch conversation history");
      }

      const data = await response.json();

      setConversationHistory(
        data.map((conv: {
          id: string;
          title: string;
          preview: string;
          createdAt: string;
          updatedAt: string;
          messageCount: number;
        }) => ({
          id: conv.id,
          title: conv.title || "Conversation",
          preview: conv.preview || "",
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: conv.messageCount || 0,
        }))
      );

      logger.debug("[Neptune] Fetched conversation history", {
        count: data.length,
      });
    } catch (error) {
      logger.error("[Neptune] Fetch history failed", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Delete a conversation from history
  const deleteConversation = useCallback(async (targetConversationId: string) => {
    try {
      const response = await fetch(`/api/assistant/conversations/${targetConversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Optimistically remove from local state
      setConversationHistory((prev) =>
        prev.filter((conv) => conv.id !== targetConversationId)
      );

      // If we deleted the current conversation, clear it
      if (conversationId === targetConversationId) {
        setConversationId(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Fresh start! What would you like to tackle?",
            timestamp: new Date(),
          },
        ]);
      }

      toast.success("Conversation deleted");
      logger.debug("[Neptune] Deleted conversation", { conversationId: targetConversationId });
    } catch (error) {
      logger.error("[Neptune] Delete conversation failed", error);
      toast.error("Failed to delete conversation");
    }
  }, [conversationId]);

  return (
    <NeptuneContext.Provider
      value={{
        conversationId,
        messages,
        isLoading,
        isInitialized,
        isStreaming,
        conversationHistory,
        isLoadingHistory,
        currentPage,
        currentToolStatus,
        sendMessage,
        clearConversation,
        refreshMessages,
        loadConversation,
        fetchConversationHistory,
        deleteConversation,
        setCurrentPage,
      }}
    >
      {children}
    </NeptuneContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

// Default values for when hook is used outside provider (SSR/static generation)
const defaultNeptuneContext: NeptuneContextValue = {
  conversationId: null,
  messages: [],
  isLoading: false,
  isInitialized: false,
  isStreaming: false,
  conversationHistory: [],
  isLoadingHistory: false,
  currentPage: 'dashboard',
  currentToolStatus: null,
  sendMessage: async () => {},
  clearConversation: async () => {},
  refreshMessages: async () => {},
  loadConversation: async () => {},
  fetchConversationHistory: async () => {},
  deleteConversation: async () => {},
  setCurrentPage: () => {},
};

export function useNeptune() {
  const context = useContext(NeptuneContext);

  // Return default values if outside provider (prevents SSR errors)
  if (!context) {
    return defaultNeptuneContext;
  }

  return context;
}
