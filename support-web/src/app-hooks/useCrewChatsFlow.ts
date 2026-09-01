/**
 * Hook for managing crew chat threads list page
 */
import { useEffect, useState, useCallback } from "react";
import { getCrewChatThreads, type CrewChatThread } from "../lib/crewChatApi";

type RowState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CrewChatThread[] };

export function useCrewChatsFlow() {
  const [rows, setRows] = useState<RowState>({ status: "idle" });
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const threads = await getCrewChatThreads(statusFilter);
      setRows({ status: "success", data: threads });
    } catch (error) {
      console.error("Failed to load crew chat threads:", error);
      setRows({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load threads",
      });
    }
  }, [statusFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    setRows({ status: "loading" });
    load();
  }, [load]);

  const threads = rows.status === "success" ? rows.data : [];

  // Filter threads by search query
  const filtered = searchQuery.trim()
    ? threads.filter((thread) => {
        const query = searchQuery.toLowerCase();
        return (
          thread.crew_name.toLowerCase().includes(query) ||
          thread.crew_email.toLowerCase().includes(query) ||
          thread.id.toLowerCase().includes(query)
        );
      })
    : threads;

  const queueHint = `${filtered.length} ${filtered.length === 1 ? "chat" : "chats"}`;

  return {
    rows,
    threads: filtered,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    queueHint,
    refreshing,
    onRefresh,
  };
}
