/**
 * Crew Chat API client for real-time support chat with crew members.
 * Uses REST API + WebSockets for bidirectional communication.
 */
import { api } from "./api";

export interface CrewChatThread {
  id: string;
  crew_name: string;
  crew_email: string;
  status: "open" | "closed";
  last_message_at: string;
  support_unread_count: number;
  crew_unread_count: number;
}

export interface CrewChatMessage {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    role?: string;
  };
  booking_reference?: string;
}

export interface CrewChatThreadDetail extends CrewChatThread {
  messages: CrewChatMessage[];
}

export interface GetThreadsResponse {
  data: {
    threads: CrewChatThread[];
  };
}

export interface GetThreadResponse {
  data: {
    thread: CrewChatThreadDetail;
  };
}

export interface SendMessageRequest {
  thread_id: string;
  body: string;
}

export interface SendMessageResponse {
  data: {
    message: CrewChatMessage;
  };
}

export interface CloseThreadRequest {
  thread_id: string;
}

export interface CloseThreadResponse {
  data: {
    thread: {
      id: string;
      status: string;
    };
  };
}

/**
 * Fetch all crew chat threads with optional status filter
 */
export async function getCrewChatThreads(
  status: "open" | "closed" | "all" = "open"
): Promise<CrewChatThread[]> {
  const response = await api.get<GetThreadsResponse>("/api/v1/crew-chat/list_threads/", {
    params: { status },
  });
  return response.data.data.threads;
}

/**
 * Fetch a specific crew chat thread with full message history
 */
export async function getCrewChatThread(threadId: string): Promise<CrewChatThreadDetail> {
  const response = await api.get<GetThreadResponse>("/api/v1/crew-chat/get_thread/", {
    params: { thread_id: threadId },
  });
  return response.data.data.thread;
}

/**
 * Send a message to a crew chat thread (REST fallback, WebSocket is primary)
 */
export async function sendCrewChatMessage(
  request: SendMessageRequest
): Promise<CrewChatMessage> {
  const response = await api.post<SendMessageResponse>(
    "/api/v1/crew-chat/send_message/",
    request
  );
  return response.data.data.message;
}

/**
 * Close a crew chat thread
 */
export async function closeCrewChatThread(threadId: string): Promise<void> {
  await api.patch<CloseThreadResponse>("/api/v1/crew-chat/close_thread/", {
    thread_id: threadId,
  });
}

/**
 * Reopen a closed crew chat thread
 */
export async function reopenCrewChatThread(threadId: string): Promise<void> {
  await api.patch<CloseThreadResponse>("/api/v1/crew-chat/reopen_thread/", {
    thread_id: threadId,
  });
}

/**
 * Create WebSocket connection to a crew chat thread
 * Returns the WebSocket instance for real-time messaging
 */
export function connectToCrewChatThread(
  threadId: string,
  accessToken: string,
  onMessage: (message: CrewChatMessage) => void,
  onConnectionChange: (connected: boolean) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const wsBaseUrl = (import.meta.env.VITE_WS_URL || "ws://localhost:8002").replace(
    /\/$/,
    ""
  );
  const wsUrl = `${wsBaseUrl}/ws/crew-chat/${threadId}/?token=${accessToken}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("Crew chat WebSocket connected");
    onConnectionChange(true);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onConnectionChange(false);
  };

  ws.onclose = (event) => {
    console.log("Crew chat WebSocket disconnected");
    onConnectionChange(false);
    onClose?.(event);
  };

  return ws;
}
