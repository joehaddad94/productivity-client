"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TASKS_QUERY_KEY } from "@/app/hooks/useTasksApi";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "";

export function useWorkspaceSSE(workspaceId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const es = new EventSource(`${API_BASE}/sse/workspace/${workspaceId}`, {
      withCredentials: true,
    });

    es.onmessage = () => {
      void queryClient.invalidateQueries({
        queryKey: TASKS_QUERY_KEY(workspaceId),
      });
    };

    return () => {
      es.close();
    };
  }, [workspaceId, queryClient]);
}
