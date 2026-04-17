"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Plus } from "lucide-react";
import { cn } from "../ui/utils";

export interface TagInputProps {
  /** All tags available on the workspace (used for autocomplete). */
  existingTags: string[];
  /** Tags already present on the note (filtered out of suggestions + rejected). */
  selectedTags: string[];
  /** Called with 1-N new tags (ready to commit). Values are normalised. */
  onAdd: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  inputId?: string;
  /** Optional test id attached to the raw <input>. */
  dataTestId?: string;
}

const SEPARATOR_REGEX = /[,\t\n]/;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseBulk(value: string): string[] {
  return value
    .split(SEPARATOR_REGEX)
    .map((v) => normalize(v))
    .filter((v): v is string => !!v);
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  {
    existingTags,
    selectedTags,
    onAdd,
    placeholder = "Add tag",
    className,
    inputId,
    dataTestId,
  },
  ref,
) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(
    () => new Set(selectedTags.map((t) => t.toLowerCase())),
    [selectedTags],
  );

  const suggestions = useMemo(() => {
    const query = normalize(value);
    const pool = existingTags
      .map((t) => t.toLowerCase())
      .filter((t) => !selectedSet.has(t));
    const unique = Array.from(new Set(pool));
    if (!query) return unique.slice(0, 8);
    const matches = unique.filter((t) => t.includes(query));
    return matches.slice(0, 8);
  }, [existingTags, selectedSet, value]);

  useEffect(() => {
    if (highlight >= suggestions.length) setHighlight(0);
  }, [suggestions.length, highlight]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commit = useCallback(
    (rawInput: string, fromSuggestion: string | null = null) => {
      const parts = fromSuggestion ? [fromSuggestion] : parseBulk(rawInput);
      if (!parts.length) {
        setValue("");
        return;
      }
      const fresh = parts.filter((t) => !selectedSet.has(t));
      if (fresh.length) onAdd(fresh);
      setValue("");
      setHighlight(0);
    },
    [onAdd, selectedSet],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (SEPARATOR_REGEX.test(next)) {
      commit(next);
      return;
    }
    setValue(next);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (open && suggestions.length > 0 && value.trim()) {
        const picked = suggestions[highlight];
        if (picked) {
          event.preventDefault();
          commit("", picked);
          return;
        }
      }
      if (value.trim()) {
        event.preventDefault();
        commit(value);
        return;
      }
    }
    if (event.key === "Tab" && value.trim()) {
      event.preventDefault();
      commit(value);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Backspace" && value === "") {
      // Swallow — removal is handled by the chips themselves.
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div className="flex items-center gap-1 border border-dashed rounded-full px-2 h-6 text-xs hover:border-solid focus-within:border-solid focus-within:border-primary">
        <Plus className="h-3 w-3 text-muted-foreground" />
        <input
          ref={ref}
          id={inputId}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (value.trim()) commit(value);
            setOpen(false);
          }}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && suggestions.length > 0 ? `${listboxId}-${highlight}` : undefined
          }
          data-testid={dataTestId}
          className="h-4 p-0 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 w-24"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          data-testid="tag-input-suggestions"
          className="absolute left-0 top-full z-50 mt-1 w-48 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md py-1 text-sm"
        >
          {suggestions.map((suggestion, idx) => (
            <li
              key={suggestion}
              id={`${listboxId}-${idx}`}
              role="option"
              aria-selected={idx === highlight}
              data-testid="tag-input-suggestion"
              className={cn(
                "px-2 py-1 cursor-pointer text-xs",
                idx === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(event) => {
                event.preventDefault();
                commit("", suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
