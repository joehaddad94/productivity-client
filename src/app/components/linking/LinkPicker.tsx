"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Loader2, Plus, X, Search, type LucideIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/app/components/ui/utils";

/**
 * Config describing one "related entity" for a note (or any record).
 *
 * Adding a new relation (e.g. Project) is a matter of:
 *   1. Implementing a small data-loader hook that returns { items, isLoading, search, setSearch }.
 *   2. Passing a `LinkRelationConfig<YourType>` into <LinkPickerButton /> (or to <LinkedItems />).
 *
 * Nothing else has to change in the editor.
 */
export interface LinkRelationConfig<Item> {
  /** Stable key for data-testid / aria. */
  kind: string;
  /** Singular label used in buttons / toasts ("task", "project"…). */
  singularLabel: string;
  /** Icon used on the chip + picker trigger. */
  icon: LucideIcon;
  /**
   * Color tokens for the linked pill. CSS vars or tailwind class names.
   * Default uses the primary tone.
   */
  tone?: {
    /** Applied to the linked-chip container. */
    chipClass?: string;
    /** Applied to the picker trigger (unlinked state). */
    triggerClass?: string;
  };
  /** Current linked id (or null if unlinked). */
  value: string | null;
  /** Called with the picked item id or null to unlink. */
  onChange: (nextId: string | null) => void;
  /** Loader: resolves the display object for `value`. */
  currentItem?: Item | null;
  /** Extract id/label/secondary from the item. */
  getId: (item: Item) => string;
  getLabel: (item: Item) => string;
  getSecondary?: (item: Item) => string | null | undefined;
  /**
   * Called when the picker opens, so you can lazy-load the list.
   * Safe to call multiple times; de-dupe upstream.
   */
  onOpenPicker?: () => void;
  /** All selectable items for the popover list. */
  items: Item[];
  isLoading?: boolean;
  /** Optional custom empty state. */
  emptyState?: ReactNode;
  /** Optional "Create new…" CTA inside the popover. */
  onCreateNew?: (query: string) => void;
  createLabel?: string;
  /** Disable the picker entirely. */
  disabled?: boolean;
  /**
   * True while a link/unlink mutation is in-flight for this relation.
   * Swaps icons for a spinner, disables interactions, and applies a
   * `cursor-wait` affordance. Optimistic UI still shows through.
   */
  isPending?: boolean;
}

export interface LinkPickerButtonProps<Item>
  extends LinkRelationConfig<Item> {
  /** Size variant. xs mirrors the editor-header tone; sm is the default. */
  size?: "xs" | "sm";
}

/**
 * A single button that represents one relation:
 *   - unlinked: a dashed-outline trigger that opens a searchable popover.
 *   - linked:   a pill with the label + an explicit unlink (✕) button.
 *
 * Keyboard: Tab to the pill, Enter opens the item (noop here but consumers can
 * wire via onOpenItem later), Delete/Backspace unlinks.
 */
export function LinkPickerButton<Item>(props: LinkPickerButtonProps<Item>) {
  const {
    kind,
    singularLabel,
    icon: Icon,
    tone,
    value,
    onChange,
    currentItem,
    getId,
    getLabel,
    getSecondary,
    onOpenPicker,
    items,
    isLoading,
    emptyState,
    onCreateNew,
    createLabel,
    disabled,
    isPending = false,
    size = "sm",
  } = props;
  const interactionDisabled = disabled || isPending;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const label = getLabel(it).toLowerCase();
      const secondary = getSecondary?.(it)?.toLowerCase() ?? "";
      return label.includes(q) || secondary.includes(q);
    });
  }, [items, query, getLabel, getSecondary]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) onOpenPicker?.();
    },
    [onOpenPicker],
  );

  const unlink = useCallback(() => {
    if (interactionDisabled) return;
    onChange(null);
  }, [onChange, interactionDisabled]);

  const chipSizeClass = size === "xs" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]";
  const iconClass = size === "xs" ? "size-2.5" : "size-3";

  if (value) {
    const label = currentItem ? getLabel(currentItem) : `Linked ${singularLabel}`;
    return (
      <div
        data-testid={`link-chip-${kind}`}
        data-kind={kind}
        data-pending={isPending ? "true" : undefined}
        aria-busy={isPending}
        className={cn(
          "group inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 text-primary",
          chipSizeClass,
          isPending && "cursor-wait",
          tone?.chipClass,
        )}
        title={isPending ? `Updating ${singularLabel}…` : `${singularLabel}: ${label}`}
      >
        {isPending ? (
          <Loader2 className={cn(iconClass, "shrink-0 animate-spin")} />
        ) : (
          <Icon className={cn(iconClass, "shrink-0")} />
        )}
        <span className="max-w-28 truncate font-medium">{label}</span>
        <button
          type="button"
          onClick={unlink}
          disabled={interactionDisabled}
          aria-label={`Unlink ${singularLabel}`}
          data-testid={`link-chip-${kind}-unlink`}
          className={cn(
            "ml-0.5 inline-flex size-4 items-center justify-center rounded-full",
            "text-primary/70 hover:bg-primary/15 hover:text-destructive",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current",
            interactionDisabled && "opacity-50 pointer-events-none",
          )}
        >
          <X className="size-2.5" />
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={interactionDisabled}
          aria-busy={isPending}
          aria-label={`Link ${singularLabel}`}
          data-testid={`link-trigger-${kind}`}
          data-pending={isPending ? "true" : undefined}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-dashed border-border/70",
            "text-muted-foreground hover:text-foreground hover:border-border",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            chipSizeClass,
            interactionDisabled && "opacity-70 pointer-events-none",
            isPending && "cursor-wait text-primary border-primary/40",
            tone?.triggerClass,
          )}
        >
          {isPending ? (
            <Loader2 className={cn(iconClass, "shrink-0 animate-spin")} />
          ) : (
            <Icon className={cn(iconClass, "shrink-0")} />
          )}
          <span>{isPending ? "Linking…" : `Link ${singularLabel}`}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="end"
        data-testid={`link-picker-${kind}`}
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${singularLabel}s…`}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
            data-testid={`link-picker-${kind}-input`}
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {isLoading ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              {emptyState ?? (
                <span>
                  {query.trim()
                    ? `No ${singularLabel}s match “${query.trim()}”.`
                    : `No ${singularLabel}s in this workspace yet.`}
                </span>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((it) => {
                const id = getId(it);
                const label = getLabel(it);
                const secondary = getSecondary?.(it) ?? null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      data-testid={`link-picker-${kind}-item`}
                      data-id={id}
                      onClick={() => {
                        onChange(id);
                        setOpen(false);
                      }}
                      className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    >
                      <Icon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">
                          {label}
                        </span>
                        {secondary && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {secondary}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {onCreateNew && (
          <button
            type="button"
            onClick={() => {
              onCreateNew(query);
              setOpen(false);
            }}
            data-testid={`link-picker-${kind}-create`}
            className="flex w-full items-center gap-1.5 border-t border-border/60 px-2.5 py-2 text-xs text-primary hover:bg-primary/5 focus:outline-none"
          >
            <Plus className="size-3" />
            {createLabel ?? `Create new ${singularLabel}`}
            {query.trim() && (
              <span className="truncate font-medium">“{query.trim()}”</span>
            )}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Renders a row of LinkPickerButtons from an array of configs. Use this to
 * wire multiple relations (task, project, …) uniformly.
 */
export interface LinkedItemsProps {
  /** Each entry is a `LinkRelationConfig<Item>` (via the helper below). */
  relations: Array<ReactNode>;
  className?: string;
}

export function LinkedItems({ relations, className }: LinkedItemsProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      data-testid="linked-items"
    >
      {relations}
    </div>
  );
}

/**
 * Small helper so TS infers per-relation generics when composing in JSX.
 * Usage:
 *   <LinkedItems relations={[
 *     renderRelation(taskRelation),
 *     renderRelation(projectRelation),
 *   ]} />
 */
export function renderRelation<Item>(
  config: LinkPickerButtonProps<Item>,
): ReactNode {
  return <LinkPickerButton key={config.kind} {...config} />;
}

// Re-export handy icon type so consumers don't need to import it separately.
export type LinkPickerIcon = ComponentType<{ className?: string }>;
