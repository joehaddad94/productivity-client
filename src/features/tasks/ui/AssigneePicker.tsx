"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { cn } from "@/app/components/ui/utils";

export type AssigneeOption = {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

interface AssigneePickerProps {
  members: AssigneeOption[];
  /** User IDs currently assigned */
  selected: string[];
  onChange: (userIds: string[]) => void;
  /** When true, no add/remove allowed — picker is read-only display */
  disabled?: boolean;
  /** User ID of the current viewer — they're hidden from the selectable list (no self-assignment) */
  currentUserId?: string;
  triggerClassName?: string;
}

function initialsFor(member: AssigneeOption): string {
  const source = member.name ?? member.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AssigneePicker({
  members,
  selected,
  onChange,
  disabled,
  currentUserId,
  triggerClassName,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);

  const selectable = useMemo(
    () => members.filter((m) => m.userId !== currentUserId),
    [members, currentUserId],
  );

  const selectedMembers = useMemo(
    () => members.filter((m) => selected.includes(m.userId)),
    [members, selected],
  );

  const toggle = (userId: string) => {
    if (selected.includes(userId)) {
      onChange(selected.filter((id) => id !== userId));
    } else {
      onChange([...selected, userId]);
    }
  };

  const labelDisplay =
    selectedMembers.length === 0
      ? "Unassigned"
      : selectedMembers.length === 1
        ? (selectedMembers[0].name ?? selectedMembers[0].email)
        : `${selectedMembers.length} assignees`;

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Assignees"
            disabled={disabled}
            className={cn(
              "h-8 w-full justify-between border-border bg-input-background text-xs font-normal shadow-sm px-3",
              "hover:bg-muted/40 hover:border-border",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
              disabled && "pointer-events-none opacity-50",
              triggerClassName,
            )}
          >
            <span className="truncate text-left">{labelDisplay}</span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[14rem] max-w-sm border border-border bg-popover p-0 shadow-lg"
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder="Search members…" className="h-9" />
            <CommandList className="max-h-60">
              <CommandEmpty className="text-xs">No member found.</CommandEmpty>
              <CommandGroup>
                {selectable.map((m) => {
                  const isSelected = selected.includes(m.userId);
                  return (
                    <CommandItem
                      key={m.userId}
                      value={`${m.name ?? ""} ${m.email}`}
                      className="cursor-pointer text-xs"
                      onSelect={() => toggle(m.userId)}
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Avatar className="size-5">
                        <AvatarImage
                          src={m.avatarUrl ?? undefined}
                          alt={m.name ?? m.email}
                        />
                        <AvatarFallback className="text-[10px]">
                          {initialsFor(m)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {m.name ?? m.email}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedMembers.map((m) => (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              <Avatar className="size-4">
                <AvatarImage
                  src={m.avatarUrl ?? undefined}
                  alt={m.name ?? m.email}
                />
                <AvatarFallback className="text-[9px]">
                  {initialsFor(m)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[10rem]">
                {m.name ?? m.email}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(m.userId)}
                  className="rounded-full hover:bg-foreground/10 p-0.5"
                  aria-label={`Remove ${m.name ?? m.email}`}
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
