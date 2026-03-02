"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { authApi, type AuthUser } from "@/lib/api/auth-api";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useMeQuery(
  options?: Omit<UseQueryOptions<AuthUser | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.me(),
    ...options,
  });
}

export function useRegisterMutation(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authApi.register>>,
    Error,
    { email: string; name?: string }
  >
) {
  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      authApi.register(email, name),
    ...options,
  });
}

export function useLoginMutation(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authApi.login>>,
    Error,
    string
  >
) {
  return useMutation({
    mutationFn: (email: string) => authApi.login(email),
    ...options,
  });
}

export function useVerifyMutation(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authApi.verify>>,
    Error,
    string
  >
) {
  return useMutation({
    mutationFn: (token: string) => authApi.verify(token),
    ...options,
  });
}

export function useLogoutMutation(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authApi.logout>>,
    Error,
    void
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
