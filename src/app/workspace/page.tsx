"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { CreateFirstWorkspace } from "../screens/workspace/CreateFirstWorkspace";
import { WorkspacePicker } from "../screens/workspace/WorkspacePicker";
import { AuthScreenWrap } from "@/app/components/auth/AuthScreenWrap";
import type { Workspace } from "@/lib/types";

export default function WorkspaceGatePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const {
    workspaces,
    isLoading,
    isFetched,
    hasWorkspaces,
    needsWorkspace,
    setCurrentWorkspaceId,
  } = useWorkspace();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (!isFetched || needsWorkspace) return;
    router.replace("/notes");
  }, [isInitialized, isAuthenticated, isFetched, needsWorkspace, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <AuthScreenWrap>
        <ScreenLoader variant="auth" message="Loading…" />
      </AuthScreenWrap>
    );
  }

  if (!isFetched || isLoading) {
    return (
      <AuthScreenWrap>
        <ScreenLoader variant="auth" message="Loading workspaces…" />
      </AuthScreenWrap>
    );
  }

  if (needsWorkspace) {
    return (
      <AuthScreenWrap>
        <div className="w-full max-w-md mx-auto">
          {!hasWorkspaces ? (
            <CreateFirstWorkspace
              onSuccess={(workspace: Workspace) => {
                setCurrentWorkspaceId(workspace.id);
                router.replace("/notes");
              }}
            />
          ) : (
            <WorkspacePicker
              workspaces={workspaces}
              onSelect={(workspace: Workspace) => {
                setCurrentWorkspaceId(workspace.id);
                router.replace("/notes");
              }}
            />
          )}
        </div>
      </AuthScreenWrap>
    );
  }

  return (
    <AuthScreenWrap>
      <ScreenLoader variant="auth" message="Taking you to Notes…" />
    </AuthScreenWrap>
  );
}
