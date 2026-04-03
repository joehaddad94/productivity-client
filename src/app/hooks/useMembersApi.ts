"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { WorkspaceMember } from "@/lib/types";
import { membersApi } from "@/lib/api/members-api";

export const MEMBERS_QUERY_KEY = (workspaceId: string) =>
  ["members", workspaceId] as const;

export function useMembersQuery(
  workspaceId: string | null | undefined,
  options?: Omit<UseQueryOptions<WorkspaceMember[]>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: MEMBERS_QUERY_KEY(workspaceId ?? ""),
    queryFn: () => membersApi.list(workspaceId!),
    enabled: !!workspaceId,
    ...options,
  });
}

export function useInviteMemberMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<
    { invited: boolean; message: string },
    Error,
    string
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => membersApi.invite(workspaceId!, email),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: MEMBERS_QUERY_KEY(workspaceId ?? ""),
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useUpdateMemberRoleMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<
    WorkspaceMember,
    Error,
    { userId: string; role: string }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      membersApi.updateRole(workspaceId!, userId, role),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(
        MEMBERS_QUERY_KEY(workspaceId ?? ""),
        (prev: WorkspaceMember[] | undefined) =>
          prev
            ? prev.map((m) =>
                m.userId === data.userId ? { ...m, role: data.role } : m
              )
            : []
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useRemoveMemberMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(workspaceId!, userId),
    ...options,
    onSuccess: (_, userId, context, mutation) => {
      queryClient.setQueryData(
        MEMBERS_QUERY_KEY(workspaceId ?? ""),
        (prev: WorkspaceMember[] | undefined) =>
          prev ? prev.filter((m) => m.userId !== userId) : []
      );
      options?.onSuccess?.(_, userId, context, mutation);
    },
  });
}
