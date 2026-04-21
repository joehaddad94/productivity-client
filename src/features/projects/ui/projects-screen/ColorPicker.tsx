"use client";

import { cn } from "@/app/components/ui/utils";
import { PROJECT_CARD_COLOR_PRESETS } from "../../lib/projectListUi";

export function ColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (color: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          "size-5 rounded-full border-2 bg-muted transition-colors cursor-pointer",
          !value ? "border-foreground" : "border-transparent hover:border-muted-foreground",
        )}
        aria-label="No color"
      />
      {PROJECT_CARD_COLOR_PRESETS.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() => onChange(c.name)}
          className={cn(
            "size-5 rounded-full border-2 transition-colors cursor-pointer",
            c.dot,
            value === c.name ? "border-foreground" : "border-transparent hover:border-muted-foreground",
          )}
          aria-label={c.name}
        />
      ))}
    </div>
  );
}
