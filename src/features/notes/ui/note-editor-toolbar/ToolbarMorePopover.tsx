"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Code,
  Code2,
  Heading3,
  ListTodo,
  Minus,
  MoreHorizontal,
  Quote,
  Strikethrough,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { NOTE_EDITOR_MAX_IMAGE_BYTES } from "../../lib/noteEditorImage";
import { ToolbarToolButton } from "./toolbarPrimitives";

export function ToolbarMorePopover({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const insertImageFromUrl = useCallback(() => {
    const url = imageUrl.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
    setMoreOpen(false);
  }, [editor, imageUrl]);

  const insertImageFromFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("That file isn't an image");
        return;
      }
      if (file.size > NOTE_EDITOR_MAX_IMAGE_BYTES) {
        toast.error("Image is too large (max 1.5 MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result;
        if (typeof src !== "string") return;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.onerror = () => toast.error("Could not read the image");
      reader.readAsDataURL(file);
    },
    [editor],
  );

  const moreActive =
    editor.isActive("heading", { level: 3 }) ||
    editor.isActive("strike") ||
    editor.isActive("code") ||
    editor.isActive("taskList") ||
    editor.isActive("blockquote") ||
    editor.isActive("codeBlock");

  return (
    <>
      <Popover open={moreOpen} onOpenChange={setMoreOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="More formatting"
            title="More formatting"
            className={cn(
              "p-1.5 rounded-md transition-colors",
              moreActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-2 space-y-2" sideOffset={4}>
          <div className="flex items-center gap-0.5 flex-wrap">
            <ToolbarToolButton
              label="Heading 3"
              icon={Heading3}
              active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            />
            <ToolbarToolButton
              label="Strikethrough"
              icon={Strikethrough}
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <ToolbarToolButton
              label="Inline code"
              icon={Code}
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            />
            <ToolbarToolButton
              label="Task list"
              icon={ListTodo}
              active={editor.isActive("taskList")}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
            />
            <ToolbarToolButton
              label="Quote"
              icon={Quote}
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarToolButton
              label="Code block"
              icon={Code2}
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            />
            <ToolbarToolButton
              label="Divider"
              icon={Minus}
              onClick={() => {
                editor.chain().focus().setHorizontalRule().run();
                setMoreOpen(false);
              }}
            />
          </div>

          <div className="h-px bg-border/50" />

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground px-0.5">Image</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                insertImageFromUrl();
              }}
              className="space-y-1.5"
            >
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.png"
                className="w-full text-xs bg-transparent border border-border/60 rounded-md px-2 h-7 outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                className="w-full text-xs h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Insert
              </button>
            </form>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs h-7 rounded-md border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Upload from device
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            insertImageFromFile(file);
            setMoreOpen(false);
          }
          e.target.value = "";
        }}
      />
    </>
  );
}
