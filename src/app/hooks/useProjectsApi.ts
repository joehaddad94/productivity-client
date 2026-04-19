"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
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

// Partial-key matcher used by setQueriesData / getQueriesData
function projectsFilter(workspaceId: string) {
  return { queryKey: PROJECTS_QUERY_KEY(workspaceId) };
}

function patchPage(
  old: ProjectsPage | undefined,
  fn: (projects: Project[]) => Project[],
  totalDelta = 0,
): ProjectsPage | undefined {
  if (!old) return old;
  return { projects: fn(old.projects), total: old.total + totalDelta };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useProjectsQuery(
  workspaceId: string | null | undefined,
  params?: { limit?: number; skip?: number },
  options?: Omit<UseQueryOptions<ProjectsPage>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY(workspaceId ?? ""), params] as const,
    queryFn: () => projectsApi.list(workspaceId!, params),
    enabled: !!workspaceId,
    staleTime: 30_000,
    ...options,
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useProjectQuery(
  workspaceId: string | null | undefined,
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Project | null>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: PROJECT_QUERY_KEY(workspaceId ?? "", id ?? ""),
    queryFn: () => projectsApi.get(workspaceId!, id!),
    enabled: !!workspaceId && !!id,
    ...options,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

type CreateCtx = { tempId: string };

export function useCreateProjectMutation(
  workspaceId: string | null | undefined,
  options?: Omit<
    UseMutationOptions<Project, Error, CreateProjectBody, CreateCtx>,
    "mutationFn" | "onMutate"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectBody, CreateCtx>({
    mutationFn: (body) => projectsApi.create(workspaceId!, body),

    onMutate: async (variables) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic insert
      await queryClient.cancelQueries(projectsFilter(workspaceId ?? ""));

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: Project = {
        id: tempId,
        workspaceId: workspaceId ?? "",
        name: variables.name,
        description: variables.description ?? null,
        status: variables.status ?? "active",
        color: variables.color ?? null,
        createdAt: new Date().toISOString(),
        _count: { notes: 0, tasks: 0 },
      };

      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter(workspaceId ?? ""),
        (old) => patchPage(old, (ps) => [optimistic, ...ps], +1),
      );

      return { tempId };
    },

    onSuccess: (real, variables, context, mutation) => {
      // Swap temp with the real server record
      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter(workspaceId ?? ""),
        (old) => patchPage(old, (ps) => ps.map((p) => (p.id === context.tempId ? real : p))),
      );
      options?.onSuccess?.(real, variables, context, mutation);
    },

    onError: (err, variables, context, mutation) => {
      // Roll back the optimistic insert
      if (context) {
        queryClient.setQueriesData<ProjectsPage>(
          projectsFilter(workspaceId ?? ""),
          (old) => patchPage(old, (ps) => ps.filter((p) => p.id !== context.tempId), -1),
        );
      }
      options?.onError?.(err, variables, context, mutation);
    },

    onSettled: options?.onSettled,
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

type UpdateCtx = { snapshot: [QueryKey, ProjectsPage | undefined][] };

export function useUpdateProjectMutation(
  workspaceId: string | null | undefined,
  options?: Omit<
    UseMutationOptions<Project, Error, { id: string; body: UpdateProjectBody }, UpdateCtx>,
    "mutationFn" | "onMutate"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; body: UpdateProjectBody }, UpdateCtx>({
    mutationFn: ({ id, body }) => projectsApi.update(workspaceId!, id, body),

    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries(projectsFilter(workspaceId ?? ""));

      // Snapshot all pages (for rollback)
      const snapshot = queryClient.getQueriesData<ProjectsPage>(
        projectsFilter(workspaceId ?? ""),
      );

      // Apply patch immediately
      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter(workspaceId ?? ""),
        (old) =>
          patchPage(old, (ps) =>
            ps.map((p) => (p.id === id ? { ...p, ...body } : p)),
          ),
      );

      return { snapshot };
    },

    onSuccess: (real, variables, context, mutation) => {
      const { id } = variables;
      // Sync with exact server data
      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter(workspaceId ?? ""),
        (old) => patchPage(old, (ps) => ps.map((p) => (p.id === id ? real : p))),
      );
      // Also update the single-project cache if present
      queryClient.setQueryData(PROJECT_QUERY_KEY(workspaceId ?? "", id), real);
      options?.onSuccess?.(real, variables, context, mutation);
    },

    onError: (err, variables, context, mutation) => {
      // Restore snapshot
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      options?.onError?.(err, variables, context, mutation);
    },

    onSettled: options?.onSettled,
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteProjectMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => projectsApi.delete(workspaceId!, id),

    onSuccess: (_, id, context, mutation) => {
      // Drop the individual-project cache entry
      queryClient.removeQueries({
        queryKey: PROJECT_QUERY_KEY(workspaceId ?? "", id),
      });
      options?.onSuccess?.(_, id, context, mutation);
    },

    onError: (err, id, context, mutation) => {
      options?.onError?.(err, id, context, mutation);
    },

    onSettled: options?.onSettled,
  });
}
