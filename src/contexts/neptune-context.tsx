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
}

export interface Attachment {
  type: "image" | "document" | "file";
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface NeptuneContextValue {
  // State
  conversationId: string | null;
  messages: NeptuneMessage[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  sendMessage: (
    message: string,
    attachments?: Attachment[],
    feature?: string
  ) => Promise<void>;
  clearConversation: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NeptuneContext = createContext<NeptuneContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

const STORAGE_KEY = "neptune_conversation_id";

export function NeptuneProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NeptuneMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Initialize Neptune - load or create conversation
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeNeptune = async () => {
      try {
        // Check localStorage for existing conversation ID
        const storedConvId =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null;

        // Fetch or create primary Neptune conversation
        const response = await fetch("/api/neptune/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            existingConversationId: storedConvId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initialize Neptune conversation");
        }

        const data = await response.json();

        // Save conversation ID
        setConversationId(data.conversationId);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        }

        // Load existing messages
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
        } else {
          // Add welcome message for new conversations
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content:
                "Hey! 👋 I'm Neptune, your AI assistant. I can help you with your CRM, create documents, analyze data, and much more. What would you like to do?",
              timestamp: new Date(),
            },
          ]);
        }

        setIsInitialized(true);
        logger.debug("[Neptune] Initialized", {
          conversationId: data.conversationId,
          messageCount: data.messages?.length || 0,
        });
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
              "Hey! 👋 I'm Neptune, your AI assistant. I can help you with your CRM, create documents, analyze data, and much more. What would you like to do?",
            timestamp: new Date(),
          },
        ]);
      }
    };

    initializeNeptune();
  }, []);

  // Send message to Neptune
  const sendMessage = useCallback(
    async (message: string, attachments?: Attachment[], feature?: string) => {
      if (!message.trim() && (!attachments || attachments.length === 0)) return;

      // Add user message immediately (optimistic)
      const userMessage: NeptuneMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

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
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Update conversation ID if this was a new conversation
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, data.conversationId);
          }
        }

        // Add assistant response
        const assistantMessage: NeptuneMessage = {
          id: data.message?.id || `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.message?.content || data.response || "I'm here to help!",
          timestamp: new Date(data.message?.createdAt || Date.now()),
          metadata: data.message?.metadata,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        logger.error("[Neptune] Send message failed", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to get response from Neptune";
        toast.error(errorMsg);

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "I encountered an issue. Please try again or rephrase your question.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  // Clear conversation and start fresh
  const clearConversation = useCallback(async () => {
    try {
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
            "Hey! 👋 I'm Neptune, your AI assistant. Starting a fresh conversation. How can I help you?",
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

  return (
    <NeptuneContext.Provider
      value={{
        conversationId,
        messages,
        isLoading,
        isInitialized,
        sendMessage,
        clearConversation,
        refreshMessages,
      }}
    >
      {children}
    </NeptuneContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useNeptune() {
  const context = useContext(NeptuneContext);

  if (!context) {
    throw new Error("useNeptune must be used within a NeptuneProvider");
  }

  return context;
}
