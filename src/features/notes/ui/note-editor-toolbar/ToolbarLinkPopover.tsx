"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link as LinkIcon, Unlink } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

export function ToolbarLinkPopover({ editor }: { editor: Editor }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const insertLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
    setLinkUrl("");
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const openLinkPicker = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(prev ?? "");
    setLinkOpen(true);
  };

  return (
    <Popover open={linkOpen} onOpenChange={setLinkOpen}>
      <PopoverTrigger asChild>
        <button
            type="button"
          aria-label="Insert link"
          title="Insert link"
          onClick={openLinkPicker}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            editor.isActive("link")
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          <LinkIcon className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2" sideOffset={4}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            insertLink();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 text-xs bg-transparent border border-border/60 rounded-md px-2 h-7 outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            className="text-xs px-2 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              aria-label="Remove link"
              title="Remove link"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setLinkOpen(false);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Unlink className="size-3.5" />
            </button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
