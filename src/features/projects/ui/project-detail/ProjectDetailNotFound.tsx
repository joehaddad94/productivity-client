"use client";

import { FolderOpen } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function ProjectDetailNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <FolderOpen className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Project not found</p>
      <Button variant="outline" size="sm" onClick={onBack}>
        Back to Projects
      </Button>
    </div>
  );
}
