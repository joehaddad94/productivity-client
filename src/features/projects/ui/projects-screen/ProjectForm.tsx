"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { ColorPicker } from "./ColorPicker";

export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial: { name: string; description?: string; status?: string; color?: string };
  onSubmit: (data: { name: string; description: string; status: string; color?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial.name);
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState(initial.status ?? "active");
  const [color, setColor] = useState<string | undefined>(initial.color ?? undefined);
  const nameError = nameTouched && !name.trim();

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setNameTouched(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setNameTouched(true);
            if (name.trim()) onSubmit({ name: name.trim(), description, status, color });
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Project name…"
        aria-label="Project name"
        aria-invalid={nameError}
        className={cn("w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground/50", nameError && "placeholder:text-destructive/50")}
        autoFocus
        disabled={isPending}
      />
      {nameError && (
        <p className="text-xs text-destructive -mt-1">Project name is required</p>
      )}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        className="w-full text-xs bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 text-muted-foreground"
        disabled={isPending}
      />
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={status} onValueChange={setStatus} disabled={isPending}>
          <SelectTrigger size="sm" className="text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (name.trim()) onSubmit({ name: name.trim(), description, status, color });
          }}
          disabled={isPending || !name.trim()}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
