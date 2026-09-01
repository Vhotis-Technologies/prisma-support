/**
 * Crew list with client-side search (name, email, phone).
 * @module app-hooks/useCrewListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCrewList } from "../store/api/crewApi";
import type { CrewMemberListItem } from "../types/crew";
import { loadError, type LoadState } from "../lib/load";

function matchesCrewSearch(member: CrewMemberListItem, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const phoneNorm = member.phone.replace(/\s/g, "").toLowerCase();
  const qPhone = q.replace(/\s/g, "");
  return (
    member.name.toLowerCase().includes(q) ||
    member.email.toLowerCase().includes(q) ||
    phoneNorm.includes(qPhone)
  );
}

export function useCrewListFlow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<LoadState<CrewMemberListItem[]>>({
    status: "loading",
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getCrewList()
      .then((data) => {
        if (!cancelled) setRows({ status: "ok", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows({
            status: "error",
            message: loadError(err, "Could not load crew"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getCrewList()
      .then((data) => setRows({ status: "ok", data }))
      .catch((err: unknown) => {
        setRows({ status: "error", message: loadError(err, "Could not load crew") });
      })
      .finally(() => setRefreshing(false));
  }, []);

  const members = useMemo(
    () => (rows.status === "ok" ? rows.data : []),
    [rows],
  );

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return members;
    return members.filter((member) => matchesCrewSearch(member, searchQuery));
  }, [members, searchQuery]);

  const queueHint =
    rows.status === "loading"
      ? "Loading crew…"
      : searchQuery.trim() && members.length > 0
        ? `${members.length} members · showing ${filtered.length}`
        : `${members.length} member${members.length === 1 ? "" : "s"}`;

  return {
    searchQuery,
    setSearchQuery,
    rows,
    filtered,
    queueHint,
    refreshing,
    onRefresh,
  };
}
