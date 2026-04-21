"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/app/components/ui/utils";

export type ProjectOption = { id: string; name: string };

interface ProjectPickerProps {
  projects: ProjectOption[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
  triggerClassName?: string;
}

export function ProjectPicker({
  projects,
  value,
  onChange,
  disabled,
  triggerClassName,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const display =
    value && projects.some((p) => p.id === value)
      ? projects.find((p) => p.id === value)!.name
      : "No project";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Project"
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-between border-border bg-input-background text-xs font-normal shadow-sm px-3",
            "hover:bg-muted/40 hover:border-border",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
            disabled && "pointer-events-none opacity-50",
            triggerClassName,
          )}
        >
          <span className="truncate text-left">{display}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] max-w-sm border border-border bg-popover p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder="Search projects…" className="h-9" />
          <CommandList className="max-h-60">
            <CommandEmpty className="text-xs">No project found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no project all workspace"
                className="cursor-pointer text-xs"
                onSelect={() => { onChange(undefined); setOpen(false); }}
              >
                <Check className={cn("size-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
                No project
              </CommandItem>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  className="cursor-pointer text-xs"
                  onSelect={() => { onChange(p.id); setOpen(false); }}
                >
                  <Check className={cn("size-4 shrink-0", value === p.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
