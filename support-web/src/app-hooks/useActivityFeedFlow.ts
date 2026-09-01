/**
 * Support activity feed (bookings, customers, fleets, partners).
 * Polls every 30s while the tab is visible, matching the support app.
 * Relative timestamps use `nowMs` captured in the fetch callback (purity).
 *
 * @module app-hooks/useActivityFeedFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getActivityFeed } from "../store/api/activityApi";
import type { ActivityFeedMeta, ActivityItem } from "../types/activity";
import { loadError, type LoadState } from "../lib/load";

const POLL_MS = 30_000;

export function useActivityFeedFlow() {
  const [rows, setRows] = useState<LoadState<ActivityItem[]>>({
    status: "loading",
  });
  const [meta, setMeta] = useState<ActivityFeedMeta | undefined>(undefined);
  const [nowMs, setNowMs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const applyFeed = useCallback((activities: ActivityItem[], nextMeta?: ActivityFeedMeta) => {
    setRows({ status: "ok", data: activities });
    setMeta(nextMeta);
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = (silent: boolean) => {
      void getActivityFeed()
        .then((result) => {
          if (!cancelled) applyFeed(result.activities, result.meta);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (silent) return;
          setRows((prev) =>
            prev.status === "ok"
              ? prev
              : {
                  status: "error",
                  message: loadError(
                    err,
                    "Could not load activities. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
                  ),
                },
          );
        });
    };

    load(false);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getActivityFeed()
      .then((result) => applyFeed(result.activities, result.meta))
      .catch((err: unknown) => {
        setRows({
          status: "error",
          message: loadError(err, "Could not load activities"),
        });
      })
      .finally(() => setRefreshing(false));
  }, [applyFeed]);

  const activities = rows.status === "ok" ? rows.data : [];

  return {
    rows,
    activities,
    meta,
    nowMs,
    refreshing,
    onRefresh,
  };
}
