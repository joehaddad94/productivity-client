"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { bugReportsApi, type CreateBugReportBody } from "@/lib/api/bug-reports-api";
import {
  adminBugReportsApi,
  type AdminBugListParams,
  type AdminBugStats,
  type UpdateBugReportBody,
} from "@/lib/api/admin-bug-reports-api";
import type { BugReport } from "@/lib/types";

export const ADMIN_BUG_REPORTS_LIST_KEY = (params: AdminBugListParams) =>
  ["admin", "bug-reports", params] as const;

export const ADMIN_BUG_REPORTS_STATS_KEY = ["admin", "bug-reports", "stats"] as const;

export function useCreateBugReportMutation(
  options?: UseMutationOptions<{ bug: BugReport }, Error, CreateBugReportBody>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBugReportBody) => bugReportsApi.create(body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "bug-reports"] });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useAdminBugReportsQuery(
  params: AdminBugListParams,
  options?: Omit<UseQueryOptions<{ bugs: BugReport[]; total: number }>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ADMIN_BUG_REPORTS_LIST_KEY(params),
    queryFn: () => adminBugReportsApi.list(params),
    ...options,
  });
}

export function useAdminBugReportsStatsQuery(
  options?: Omit<UseQueryOptions<AdminBugStats>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ADMIN_BUG_REPORTS_STATS_KEY,
    queryFn: () => adminBugReportsApi.stats(),
    ...options,
  });
}

export function useUpdateAdminBugReportMutation(
  options?: UseMutationOptions<
    { bug: BugReport },
    Error,
    { id: string; body: UpdateBugReportBody }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBugReportBody }) =>
      adminBugReportsApi.update(id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "bug-reports"] });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
