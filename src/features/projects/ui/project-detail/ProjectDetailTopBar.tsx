"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function ProjectDetailTopBar({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/projects"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Projects
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={onDeleteClick}
        className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60"
      >
        <Trash2 className="size-3.5" />
        Delete project
      </Button>
    </div>
  );
}
