"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  useWorkspacesQuery,
  WORKSPACES_QUERY_KEY,
} from "@/app/hooks/useWorkspacesApi";
import type { Workspace } from "@/lib/types";

const CURRENT_WORKSPACE_KEY = "tasky_current_workspace_id";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  isLoading: boolean;
  isFetched: boolean;
  hasWorkspaces: boolean;
  needsWorkspace: boolean;
  refetchWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function readStoredId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CURRENT_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string | null) {
  try {
    if (id == null) localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    else localStorage.setItem(CURRENT_WORKSPACE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentId, setCurrentId] = useState<string | null>(readStoredId);

  const {
    data: workspaces = [],
    isLoading,
    isFetched,
    refetch,
  } = useWorkspacesQuery({
    enabled: isAuthenticated,
  });

  const currentWorkspace = useMemo(
    () => workspaces.find((w) => w.id === currentId) ?? null,
    [workspaces, currentId]
  );

  const setCurrentWorkspaceId = useCallback((id: string | null) => {
    setCurrentId(id);
    writeStoredId(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentId(null);
      writeStoredId(null);
      return;
    }
    if (!isFetched || workspaces.length === 0) return;
    const stored = readStoredId();
    const valid = stored && workspaces.some((w) => w.id === stored);
    if (!valid) {
      setCurrentId(workspaces[0].id);
      writeStoredId(workspaces[0].id);
    } else if (currentId !== stored) {
      setCurrentId(stored);
    }
  }, [isAuthenticated, isFetched, workspaces, currentId]);

  const hasWorkspaces = isFetched && workspaces.length > 0;
  const needsWorkspace = isFetched && (workspaces.length === 0 || !currentWorkspace);

  const value: WorkspaceContextType = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      setCurrentWorkspaceId,
      isLoading,
      isFetched,
      hasWorkspaces,
      needsWorkspace,
      refetchWorkspaces: refetch,
    }),
    [
      workspaces,
      currentWorkspace,
      setCurrentWorkspaceId,
      isLoading,
      isFetched,
      hasWorkspaces,
      needsWorkspace,
      refetch,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export { WORKSPACES_QUERY_KEY };
