"use client";

import { useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn } from "@/app/components/ui/utils";
import type { AssigneeOption } from "./AssigneePicker";
import type { TaskAssignee } from "@/lib/types";

function initialsFor(user: { name: string | null; email: string }): string {
  const src = user.name ?? user.email;
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface InlineAssigneePickerProps {
  assignees: TaskAssignee[];
  members: AssigneeOption[];
  onAssigneesChange: (nextIds: string[]) => void;
  disabled?: boolean;
}

export function InlineAssigneePicker({
  assignees,
  members,
  onAssigneesChange,
  disabled,
}: InlineAssigneePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIds = assignees.map((a) => a.userId);
  const showTrigger = members.length > 1 || assignees.length > 0;

  if (!showTrigger) return null;

  function toggle(userId: string) {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];
    onAssigneesChange(next);
    setOpen(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Assign members"
            className={cn(
              "flex items-center rounded cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {assignees.length > 0 ? (
              <div className="flex -space-x-1.5 items-center">
                {assignees.slice(0, 3).map((a) => (
                  <Avatar
                    key={a.userId}
                    className="size-5 ring-2 ring-card"
                    title={a.user.name ?? a.user.email}
                  >
                    <AvatarImage
                      src={a.user.avatarUrl ?? undefined}
                      alt={a.user.name ?? a.user.email}
                    />
                    <AvatarFallback className="text-[9px] font-medium">
                      {initialsFor(a.user)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {assignees.length > 3 && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                    +{assignees.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="flex items-center justify-center size-5 rounded-full border border-dashed border-border/60 text-muted-foreground/40 hover:border-primary/40 hover:text-primary/60 transition-colors">
                <UserPlus className="size-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-0 border border-border bg-popover shadow-lg"
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder="Search members…" className="h-8 text-xs" />
            <CommandList className="max-h-52">
              <CommandEmpty className="py-3 text-center text-xs">
                No members found.
              </CommandEmpty>
              {selectedIds.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    className="cursor-pointer gap-2 text-xs text-muted-foreground"
                    onSelect={() => { onAssigneesChange([]); setOpen(false); }}
                  >
                    <X className="size-3.5 shrink-0" />
                    Clear assignees
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {members.map((m) => {
                  const isSelected = selectedIds.includes(m.userId);
                  return (
                    <CommandItem
                      key={m.userId}
                      value={`${m.name ?? ""} ${m.email}`}
                      className="cursor-pointer gap-2 text-xs"
                      onSelect={() => toggle(m.userId)}
                    >
                      <Check
                        className={cn(
                          "size-3.5 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Avatar className="size-5 shrink-0">
                        <AvatarImage
                          src={m.avatarUrl ?? undefined}
                          alt={m.name ?? m.email}
                        />
                        <AvatarFallback className="text-[9px]">
                          {initialsFor(m)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{m.name ?? m.email}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
