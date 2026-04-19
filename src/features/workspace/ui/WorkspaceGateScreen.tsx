"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { CreateFirstWorkspace } from "@/app/screens/workspace/CreateFirstWorkspace";
import { AuthScreenWrap } from "@/app/components/auth/AuthScreenWrap";
import type { Workspace } from "@/lib/types";

export function WorkspaceGateScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const {
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
    router.replace("/dashboard");
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
        <ScreenLoader variant="auth" message="Loading…" />
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
                router.replace("/dashboard");
              }}
            />
          ) : (
            <ScreenLoader variant="auth" message="Taking you to Dashboard…" />
          )}
        </div>
      </AuthScreenWrap>
    );
  }

  return (
    <AuthScreenWrap>
      <ScreenLoader variant="auth" message="Loading…" />
    </AuthScreenWrap>
  );
}
