"use client";

import { cn } from "@/app/components/ui/utils";
import { PROJECT_CARD_STATUS_LABELS } from "../../lib/projectListUi";

export function ProjectCardStatusBadge({ status }: { status: string }) {
  const cfg = PROJECT_CARD_STATUS_LABELS[status] ?? PROJECT_CARD_STATUS_LABELS.active;
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
