"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";

const searchInputStyles = {
  wrapper: "relative",
  icon: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none",
  input:
    "pl-9 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-input-background transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
};

export type SearchInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  type?: "search" | "text";
  wrapperClassName?: string;
};

function SearchInput({
  className,
  wrapperClassName,
  placeholder,
  "aria-label": ariaLabel,
  type = "search",
  ...props
}: SearchInputProps) {
  const label = ariaLabel ?? (typeof placeholder === "string" ? placeholder : "Search");
  return (
    <div className={cn(searchInputStyles.wrapper, wrapperClassName)}>
      <Search
        className={searchInputStyles.icon}
        aria-hidden
      />
      <Input
        type={type}
        placeholder={placeholder}
        aria-label={label}
        className={cn(searchInputStyles.input, className)}
        {...props}
      />
    </div>
  );
}

export { SearchInput, searchInputStyles };
