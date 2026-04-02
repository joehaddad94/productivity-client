"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { AnalyticsResult, DailyStat } from "@/lib/types";
import {
  analyticsApi,
  type AnalyticsQueryParams,
  type LogStatBody,
} from "@/lib/api/analytics-api";

export const ANALYTICS_QUERY_KEY = (workspaceId: string, params?: AnalyticsQueryParams) =>
  ["analytics", workspaceId, params] as const;

export function useAnalyticsQuery(
  workspaceId: string | null | undefined,
  params?: AnalyticsQueryParams,
  options?: Omit<UseQueryOptions<AnalyticsResult>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY(workspaceId ?? "", params),
    queryFn: () => analyticsApi.get(workspaceId!, params),
    enabled: !!workspaceId,
    ...options,
  });
}

export function useLogStatMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<DailyStat, Error, LogStatBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LogStatBody) => analyticsApi.log(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: ["analytics", workspaceId ?? ""],
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
