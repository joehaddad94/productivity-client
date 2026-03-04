"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { CreateFirstWorkspace } from "@/app/screens/workspace/CreateFirstWorkspace";
import { WorkspacePicker } from "@/app/screens/workspace/WorkspacePicker";
import { AuthScreenWrap } from "@/app/components/auth/AuthScreenWrap";

export default function WorkspaceGatePage() {
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    isLoading,
    isFetched,
    hasWorkspaces,
    needsWorkspace,
    setCurrentWorkspaceId,
  } = useWorkspace();

  useEffect(() => {
    if (!isFetched) return;
    if (currentWorkspace && hasWorkspaces) {
      router.replace("/dashboard");
    }
  }, [isFetched, currentWorkspace, hasWorkspaces, router]);

  if (!isFetched || isLoading) {
    return (
      <AuthScreenWrap>
        <ScreenLoader variant="auth" message="Loading workspaces…" />
      </AuthScreenWrap>
    );
  }

  if (hasWorkspaces && currentWorkspace) {
    return (
      <AuthScreenWrap>
        <ScreenLoader variant="auth" message="Taking you to dashboard…" />
      </AuthScreenWrap>
    );
  }

  return (
    <AuthScreenWrap>
      <div className="w-full max-w-md mx-auto">
        {!hasWorkspaces ? (
          <CreateFirstWorkspace
            onSuccess={(workspace) => {
              setCurrentWorkspaceId(workspace.id);
              router.replace("/dashboard");
            }}
          />
        ) : (
          <WorkspacePicker
            workspaces={workspaces}
            onSelect={(workspace) => {
              setCurrentWorkspaceId(workspace.id);
              router.replace("/dashboard");
            }}
          />
        )}
      </div>
    </AuthScreenWrap>
  );
}
