"use client";

import { Loader2 } from "lucide-react";

export function ToolbarSaveStatus({ isSaving }: { isSaving?: boolean }) {
  if (isSaving === undefined) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 pr-0.5 select-none">
      {isSaving ? (
        <>
          <Loader2 className="size-2.5 animate-spin" />
          Saving…
        </>
      ) : (
        "Saved"
      )}
    </span>
  );
}
