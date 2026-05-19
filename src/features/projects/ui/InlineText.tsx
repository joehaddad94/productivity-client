"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

export function InlineText({
  value,
  onSave,
  placeholder,
  className,
  multiline,
  isPending,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
  isPending?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-0">
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className={cn("text-left flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity", isPending && "opacity-60", className)}
        >
          {value || <span className="text-muted-foreground/50 italic">{placeholder}</span>}
        </button>
        {isPending && <Loader2 className="size-3 shrink-0 text-muted-foreground animate-spin" />}
      </div>
    );
  }

  const sharedProps = {
    ref,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    className: cn(
      "w-full bg-transparent outline-none border-b border-primary/40 pb-0.5",
      className,
    ),
  };

  return multiline ? (
    <textarea
      {...sharedProps}
      rows={3}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  ) : (
    <input
      {...sharedProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );
}
