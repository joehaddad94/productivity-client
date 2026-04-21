"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border/70 bg-muted/40 shadow-inner transition-all outline-none",
        "data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary data-[state=unchecked]:bg-[var(--switch-background)]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full border border-border/50 bg-background shadow-sm ring-0 transition-transform",
          "data-[state=checked]:border-primary-foreground/20 data-[state=checked]:bg-primary-foreground",
          "data-[state=unchecked]:translate-x-[3px] data-[state=checked]:translate-x-[15px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
