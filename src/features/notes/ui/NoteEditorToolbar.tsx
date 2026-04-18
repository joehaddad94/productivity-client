"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

interface Props {
  editor: Editor | null;
}

// Keep pasted/dropped images small enough that the note (stored as HTML) stays
// manageable. At ~1.5 MB as a data URL we're already at >2 MB of JSON on the
// wire, which is well beyond a reasonable note payload.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function NoteEditorToolbar({ editor }: Props) {
  const linkTriggerRef = useRef<HTMLButtonElement>(null);
  const imageTriggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const insertLink = useCallback(() => {
    if (!editor) return;
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

  const insertImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = imageUrl.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
    setImageOpen(false);
  }, [editor, imageUrl]);

  const insertImageFromFile = useCallback(
    (file: File) => {
      if (!editor) return;
      if (!file.type.startsWith("image/")) {
        toast.error("That file isn't an image");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
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

  if (!editor) return null;

  const openLinkPicker = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(prev ?? "");
    setLinkOpen(true);
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      data-testid="editor-toolbar"
      className="flex flex-wrap items-center gap-0.5 px-3 py-1 border-b border-border/40 bg-background/70 backdrop-blur-sm sticky top-0 z-10"
    >
      {/* Headings */}
      <ToolGroup>
        <ToolButton
          label="Heading 1"
          icon={Heading1}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolButton
          label="Heading 2"
          icon={Heading2}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolButton
          label="Heading 3"
          icon={Heading3}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
      </ToolGroup>

      <Divider />

      {/* Inline */}
      <ToolGroup>
        <ToolButton
          label="Bold (⌘B)"
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          label="Italic (⌘I)"
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          label="Strikethrough"
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolButton
          label="Inline code"
          icon={Code}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </ToolGroup>

      <Divider />

      {/* Lists */}
      <ToolGroup>
        <ToolButton
          label="Bullet list"
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          label="Numbered list"
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          label="Task list"
          icon={ListTodo}
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />
      </ToolGroup>

      <Divider />

      {/* Blocks */}
      <ToolGroup>
        <ToolButton
          label="Quote"
          icon={Quote}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolButton
          label="Code block"
          icon={Code2}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolButton
          label="Divider"
          icon={Minus}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </ToolGroup>

      <Divider />

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <button
            ref={linkTriggerRef}
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

      {/* Image */}
      <Popover open={imageOpen} onOpenChange={setImageOpen}>
        <PopoverTrigger asChild>
          <button
            ref={imageTriggerRef}
            type="button"
            aria-label="Insert image"
            title="Insert image"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ImageIcon className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-3 space-y-2" sideOffset={4}>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Image URL
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                insertImageFromUrl();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.png"
                className="flex-1 text-xs bg-transparent border border-border/60 rounded-md px-2 h-7 outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                className="text-xs px-2 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Insert
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
            <div className="flex-1 h-px bg-border/50" />
            or
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs h-7 rounded-md border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Upload from this device
          </button>
          <p className="text-[10px] text-muted-foreground/70">
            Tip: you can also paste or drop an image directly into the note.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                insertImageFromFile(file);
                setImageOpen(false);
              }
              e.target.value = "";
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      {/* History */}
      <ToolGroup>
        <ToolButton
          label="Undo (⌘Z)"
          icon={Undo2}
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolButton
          label="Redo (⌘⇧Z)"
          icon={Redo2}
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </ToolGroup>
    </div>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-4 bg-border/60 mx-1" aria-hidden />;
}

interface ToolButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ label, icon: Icon, active, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
