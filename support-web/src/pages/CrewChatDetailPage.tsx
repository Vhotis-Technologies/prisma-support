import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import AppShell from "../components/AppShell";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useCrewChatFlow } from "../app-hooks/useCrewChatFlow";

export default function CrewChatDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useCrewChatFlow(threadId || "");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!threadId) {
    return (
      <AppShell>
        <StatusBanner notice={{ type: "error", message: "Invalid thread ID" }} />
      </AppShell>
    );
  }

  if (thread.status === "loading") {
    return (
      <AppShell>
        <LoadingLine>Loading chat…</LoadingLine>
      </AppShell>
    );
  }

  if (thread.status === "error") {
    return (
      <AppShell>
        <StatusBanner notice={{ type: "error", message: thread.message }} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/crew-chats")}
        >
          Back to Crew Chats
        </button>
      </AppShell>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/crew-chats")}
            style={{ marginBottom: "0.5rem" }}
          >
            ← Back to Crew Chats
          </button>
          <h1 className="page-title">{threadData?.crew_name || "Crew Chat"}</h1>
          <p className="lede">{threadData?.crew_email}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: isConnected ? "#4CAF50" : "#999",
            }}
            title={isConnected ? "Connected" : "Disconnected"}
          />
          {threadStatus === "open" ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closeThread}
              disabled={isClosing}
            >
              {isClosing ? "Closing…" : "Close Chat"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={reopenThread}
              disabled={isClosing}
            >
              {isClosing ? "Reopening…" : "Reopen Chat"}
            </button>
          )}
        </div>
      </section>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 250px)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Messages container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--muted)",
              }}
            >
              No messages yet
            </div>
          ) : (
            messages.map((message) => {
              const isSupport = message.user.role === "support";
              const isSystem = message.user._id === "system";

              if (isSystem) {
                return (
                  <div
                    key={message._id}
                    style={{
                      textAlign: "center",
                      padding: "0.5rem",
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {message.text}
                  </div>
                );
              }

              return (
                <div
                  key={message._id}
                  style={{
                    display: "flex",
                    justifyContent: isSupport ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      backgroundColor: isSupport ? "var(--button)" : "var(--bg-elevated)",
                      color: isSupport ? "#fff" : "var(--ink)",
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      {message.user.name}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                        opacity: 0.7,
                      }}
                    >
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--line)",
            backgroundColor: "var(--bg-elevated)",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected || threadStatus === "closed"}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                resize: "none",
                minHeight: "60px",
                maxHeight: "150px",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isConnected || !messageInput.trim() || isSending || threadStatus === "closed"}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
          {!isConnected && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--muted)" }}>
              Connecting to chat…
            </p>
          )}
          {threadStatus === "closed" && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--muted)" }}>
              This chat is closed. Reopen it to send messages.
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
