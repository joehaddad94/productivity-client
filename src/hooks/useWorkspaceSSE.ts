"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TASKS_QUERY_KEY, THREAD_QUERY_KEY } from "@/app/hooks/useTasksApi";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "";

export function useWorkspaceSSE(workspaceId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    let failures = 0;
    const MAX_FAILURES = 5;

    const es = new EventSource(`${API_BASE}/sse/workspace/${workspaceId}`, {
      withCredentials: true,
    });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data ?? "{}");
        // Keepalive from the server; carries no state change.
        if (data.type === "ping") return;
        // A notification landed for someone in this workspace. The bell used
        // to discover this by polling every 30 seconds over a connection that
        // was already open.
        if (data.type === "notifications_changed") {
          // Two separate key prefixes: the list and the unread badge.
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          void queryClient.invalidateQueries({
            queryKey: ["notifications-unread"],
          });
          return;
        }
        if (data.type === "thread_changed" && data.taskId) {
          void queryClient.invalidateQueries({
            queryKey: THREAD_QUERY_KEY(workspaceId, data.taskId),
          });
          return;
        }
      } catch {}
      if (queryClient.isMutating({ mutationKey: ["assignees"] }) > 0) return;
      void queryClient.invalidateQueries({
        queryKey: TASKS_QUERY_KEY(workspaceId),
      });
    };

    // EventSource reconnects on its own for transient faults, but it also
    // retries forever on a permanent one — a revoked session, or a workspace
    // the user has been removed from — hammering the endpoint with no signal
    // that anything is wrong. Give up after a few consecutive failures and
    // fall back to the normal refetch-on-focus behaviour.
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        failures += 1;
        if (failures >= MAX_FAILURES) {
          es.close();
          console.warn(
            `[sse] giving up on workspace ${workspaceId} after ${failures} failed connections`,
          );
        }
      }
    };

    es.onopen = () => {
      failures = 0;
    };

    return () => {
      es.close();
    };
  }, [workspaceId, queryClient]);
}
