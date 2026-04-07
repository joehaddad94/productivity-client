"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Project } from "@/lib/types";
import {
  projectsApi,
  type CreateProjectBody,
  type UpdateProjectBody,
  type ProjectsPage,
} from "@/lib/api/projects-api";

export const PROJECTS_QUERY_KEY = (workspaceId: string) =>
  ["projects", workspaceId] as const;
export const PROJECT_QUERY_KEY = (workspaceId: string, id: string) =>
  ["projects", workspaceId, id] as const;

export function useProjectsQuery(
  workspaceId: string | null | undefined,
  params?: { limit?: number; skip?: number },
  options?: Omit<UseQueryOptions<ProjectsPage>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY(workspaceId ?? ""), params] as const,
    queryFn: () => projectsApi.list(workspaceId!, params),
    enabled: !!workspaceId,
    ...options,
  });
}

export function useProjectQuery(
  workspaceId: string | null | undefined,
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Project | null>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: PROJECT_QUERY_KEY(workspaceId ?? "", id ?? ""),
    queryFn: () => projectsApi.get(workspaceId!, id!),
    enabled: !!workspaceId && !!id,
    ...options,
  });
}

export function useCreateProjectMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Project, Error, CreateProjectBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectBody) =>
      projectsApi.create(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      options?.onSuccess?.(data, variables, context, mutation);
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") });
    },
  });
}

export function useUpdateProjectMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<
    Project,
    Error,
    { id: string; body: UpdateProjectBody }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProjectBody }) =>
      projectsApi.update(workspaceId!, id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteProjectMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(workspaceId!, id),
    ...options,
    onSuccess: (_, id, context, mutation) => {
      queryClient.removeQueries({
        queryKey: PROJECT_QUERY_KEY(workspaceId ?? "", id),
      });
      queryClient.setQueryData(
        PROJECTS_QUERY_KEY(workspaceId ?? ""),
        (prev: Project[] | undefined) =>
          prev ? prev.filter((p) => p.id !== id) : []
      );
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}
