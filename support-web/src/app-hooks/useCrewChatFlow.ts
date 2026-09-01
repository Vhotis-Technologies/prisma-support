/**
 * Hook for managing single crew chat thread detail page
 */
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  getCrewChatThread,
  closeCrewChatThread,
  reopenCrewChatThread,
  connectToCrewChatThread,
  type CrewChatMessage,
  type CrewChatThreadDetail,
} from "../lib/crewChatApi";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "../lib/authStorage";
import { SUPPORT_API } from "../lib/routes";

type ThreadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CrewChatThreadDetail };

export function useCrewChatFlow(threadId: string) {
  const [thread, setThread] = useState<ThreadState>({ status: "idle" });
  const [messages, setMessages] = useState<CrewChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Load thread and message history
  const load = useCallback(async () => {
    try {
      setThread({ status: "loading" });
      const data = await getCrewChatThread(threadId);
      setThread({ status: "success", data });
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load crew chat thread:", error);
      setThread({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load thread",
      });
    }
  }, [threadId]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }
    try {
      const apiBaseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8002"
      ).replace(/\/$/, "");
      const response = await axios.post<{ access: string; refresh?: string }>(
        `${apiBaseUrl}${SUPPORT_API.refresh}`,
        { refresh: refreshToken },
        { timeout: 30000 }
      );
      setSession(response.data.access, response.data.refresh || refreshToken);
      return response.data.access;
    } catch (error) {
      console.error("Failed to refresh access token for crew chat WS:", error);
      clearSession();
      return null;
    }
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const current = getAccessToken();
    if (!current) return null;
    const refreshed = await refreshAccessToken();
    return refreshed || current;
  }, [refreshAccessToken]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(async () => {
    if (!threadId || !mountedRef.current) return;
    clearReconnectTimer();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) return;

    const handleMessage = (payload: CrewChatMessage | { type: "thread_status"; status?: string }) => {
      if ("type" in payload && payload.type === "thread_status") {
        setThread((prev) => {
          if (prev.status !== "success") return prev;
          return {
            status: "success",
            data: {
              ...prev.data,
              status: payload.status === "closed" ? "closed" : "open",
            },
          };
        });
        return;
      }

      const message = payload as CrewChatMessage;
      if (!message._id) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      // Re-sync latest server state after reconnect.
      if (connected) {
        load();
      }
    };

    const ws = connectToCrewChatThread(
      threadId,
      accessToken,
      handleMessage,
      handleConnectionChange,
      async (event) => {
        if (!mountedRef.current) return;
        // 1000 is normal closure (intentional navigation away).
        if (event.code === 1000) return;
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          if (!mountedRef.current) return;
          void connectWebSocket();
        }, 2500);
      }
    );

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [clearReconnectTimer, getValidAccessToken, load, threadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const maybeCleanup = await connectWebSocket();
      if (cancelled) {
        maybeCleanup?.();
        return;
      }
      cleanup = maybeCleanup;
    };
    start();

    return () => {
      mountedRef.current = false;
      cancelled = true;
      cleanup?.();
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [clearReconnectTimer, connectWebSocket]);

  const threadData = thread.status === "success" ? thread.data : null;
  const threadStatus = threadData?.status || "open";

  // Send message via WebSocket
  const sendMessage = useCallback(() => {
    if (!wsRef.current || !isConnected || !messageInput.trim() || isSending) {
      return;
    }
    if (threadStatus === "closed") {
      return;
    }

    setIsSending(true);

    try {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          body: messageInput.trim(),
        })
      );

      // Optimistically add message to UI
      const optimisticMessage: CrewChatMessage = {
        _id: `temp-${Date.now()}`,
        text: messageInput.trim(),
        createdAt: new Date().toISOString(),
        user: {
          _id: "support",
          name: "Support",
          role: "support",
        },
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, isConnected, isSending, threadStatus]);

  // Close thread
  const closeThread = useCallback(async () => {
    setIsClosing(true);
    try {
      await closeCrewChatThread(threadId);
      // Update local state
      if (thread.status === "success") {
        setThread({
          status: "success",
          data: {
            ...thread.data,
            status: "closed",
          },
        });
      }
      // Add system message
      const systemMessage: CrewChatMessage = {
        _id: `system-${Date.now()}`,
        text: "Chat closed by support staff.",
        createdAt: new Date().toISOString(),
        user: {
          _id: "system",
          name: "System",
        },
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to close thread:", error);
    } finally {
      setIsClosing(false);
    }
  }, [threadId, thread]);

  // Reopen thread
  const reopenThread = useCallback(async () => {
    setIsClosing(true);
    try {
      await reopenCrewChatThread(threadId);
      // Update local state
      if (thread.status === "success") {
        setThread({
          status: "success",
          data: {
            ...thread.data,
            status: "open",
          },
        });
      }
      // Add system message
      const systemMessage: CrewChatMessage = {
        _id: `system-${Date.now()}`,
        text: "Chat reopened by support staff.",
        createdAt: new Date().toISOString(),
        user: {
          _id: "system",
          name: "System",
        },
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to reopen thread:", error);
    } finally {
      setIsClosing(false);
    }
  }, [threadId, thread]);

  return {
    thread,
    threadData,
    threadStatus,
    messages,
    messageInput,
    setMessageInput,
    isConnected,
    isSending,
    isClosing,
    sendMessage,
    closeThread,
    reopenThread,
  };
}
