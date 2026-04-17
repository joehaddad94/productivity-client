"use client";

import { forwardRef, useMemo, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { X } from "lucide-react";
import { cn } from "../ui/utils";
import { tagColorStyle, tagPaletteIndex } from "./tagColor";

export interface TagChipProps {
  tag: string;
  count?: number;
  active?: boolean;
  size?: "xs" | "sm";
  onClick?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  className?: string;
  /** Optional aria-label override for the chip container. */
  ariaLabel?: string;
  /** Render the chip in an "overlay" style sitting on top of a muted surface. */
  muted?: boolean;
}

const sizeClasses = {
  xs: "text-[10px] h-5 px-1.5 gap-1 rounded-full",
  sm: "text-xs h-6 px-2 gap-1 rounded-full",
} as const;

const removeSize = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
} as const;

export const TagChip = forwardRef<HTMLSpanElement | HTMLButtonElement, TagChipProps>(
  function TagChip(
    { tag, count, active, size = "sm", onClick, onRemove, className, ariaLabel, muted },
    ref,
  ) {
    const style = useMemo<CSSProperties>(() => {
      if (muted) return {};
      const base = tagColorStyle(tag);
      return active
        ? { ...base, boxShadow: `inset 0 0 0 1px ${base.borderColor}` }
        : base;
    }, [tag, active, muted]);

    const paletteIndex = tagPaletteIndex(tag);

    const baseClass = cn(
      "inline-flex items-center font-medium border transition-colors select-none",
      sizeClasses[size],
      muted && "bg-muted text-muted-foreground border-transparent",
      active && !muted && "ring-1 ring-current",
      onClick && "cursor-pointer hover:brightness-110",
      onClick && "focus:outline-none focus-visible:ring-1 focus-visible:ring-current",
      className,
    );

    const label = <span className="truncate max-w-[10rem]">{tag}</span>;
    const countNode =
      typeof count === "number" && count > 0 ? (
        <span className="opacity-70 tabular-nums" data-testid="tag-chip-count">
          {count}
        </span>
      ) : null;
    const removeNode = onRemove ? (
      <button
        type="button"
        aria-label={`Remove tag ${tag}`}
        data-testid="tag-chip-remove"
        className={cn(
          "inline-flex items-center justify-center rounded-full opacity-70 hover:opacity-100",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-current",
        )}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          event.preventDefault();
          onRemove(tag);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
            event.preventDefault();
            onRemove(tag);
          }
        }}
      >
        <X className={removeSize[size]} />
      </button>
    ) : null;

    // Clickable chip WITHOUT a nested remove button: safe to use a real <button>.
    if (onClick && !onRemove) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          data-testid="tag-chip"
          data-tag={tag}
          data-palette-index={paletteIndex}
          data-active={active ? "true" : undefined}
          aria-pressed={active}
          aria-label={ariaLabel ?? `Filter by ${tag}`}
          className={baseClass}
          style={style}
          onClick={() => onClick(tag)}
        >
          {label}
          {countNode}
        </button>
      );
    }

    // Clickable chip WITH a remove button: outer must be a <span role="button">
    // because <button> can't contain another <button>. We wire keyboard support manually.
    if (onClick && onRemove) {
      const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(tag);
        }
      };
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          role="button"
          tabIndex={0}
          data-testid="tag-chip"
          data-tag={tag}
          data-palette-index={paletteIndex}
          data-active={active ? "true" : undefined}
          aria-pressed={active}
          aria-label={ariaLabel ?? `Filter by ${tag}`}
          className={baseClass}
          style={style}
          onClick={(event) => {
            if (event.target !== event.currentTarget) {
              // Clicks on the nested remove button bubble up here; ignore them.
              const target = event.target as HTMLElement;
              if (target.closest('[data-testid="tag-chip-remove"]')) return;
            }
            onClick(tag);
          }}
          onKeyDown={handleKeyDown}
        >
          {label}
          {countNode}
          {removeNode}
        </span>
      );
    }

    // Static chip (with or without remove only).
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        data-testid="tag-chip"
        data-tag={tag}
        data-palette-index={paletteIndex}
        aria-label={ariaLabel ?? tag}
        className={baseClass}
        style={style}
      >
        {label}
        {countNode}
        {removeNode}
      </span>
    );
  },
);
