"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useCreateBugReportMutation } from "@/app/hooks/useBugReportsApi";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import {
  readImageFileAsAttachmentPart,
  type BugReportImageAttachment,
} from "@/lib/bug-report-attachments";

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

type LocalAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

function revokePreviewUrls(list: LocalAttachment[]) {
  for (const a of list) URL.revokeObjectURL(a.previewUrl);
}

function buildContextJson(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const ctx: Record<string, unknown> = {
    href: window.location.href,
    language: navigator.language,
  };
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  if (sha) ctx.gitSha = sha;
  return ctx;
}

export function ReportBugSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname() ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const createMutation = useCreateBugReportMutation({
    onSuccess: (res) => {
      toast.success("Thanks — we received your report.", {
        description: `Reference: ${res.bug.id.slice(0, 8)}…`,
      });
      setTitle("");
      setDescription("");
      setExpected("");
      setActual("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!open) {
      setAttachments((prev) => {
        revokePreviewUrls(prev);
        return [];
      });
    }
  }, [open]);

  function pickFiles(files: FileList | null) {
    if (!files?.length) return;
    setAttachments((prev) => {
      const next = [...prev];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`${file.name} is too large (max 1.5 MB per image).`);
          continue;
        }
        if (next.length >= MAX_IMAGE_COUNT) {
          toast.error(`You can attach up to ${MAX_IMAGE_COUNT} images.`);
          break;
        }
        next.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    let imageParts: BugReportImageAttachment[] = [];
    try {
      imageParts = await Promise.all(attachments.map((a) => readImageFileAsAttachmentPart(a.file)));
    } catch {
      toast.error("Could not read one of the images. Try again or remove it.");
      return;
    }
    const contextJson: Record<string, unknown> = {
      ...buildContextJson(),
      ...(imageParts.length > 0 ? { attachments: imageParts } : {}),
    };
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        expected: expected.trim() || undefined,
        actual: actual.trim() || undefined,
        workspaceId: workspaceId ?? undefined,
        route: pathname || undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        contextJson,
      });
    } catch {
      /* onError toast */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1 border-b border-border/60 p-4 pb-3 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bug className="size-4" />
            Report a bug
          </SheetTitle>
          <SheetDescription>
            Describe what went wrong. Technical details (page URL, browser) are attached automatically.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <Label htmlFor="bug-title" className="text-xs">Title</Label>
            <Input
              id="bug-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              maxLength={200}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-desc" className="text-xs">What happened?</Label>
            <textarea
              id="bug-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, what you clicked, etc."
              rows={5}
              maxLength={8000}
              className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="bug-images" className="text-xs">Screenshots (optional)</Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {attachments.length}/{MAX_IMAGE_COUNT}
              </span>
            </div>
            <input
              ref={fileInputRef}
              id="bug-images"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                pickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={attachments.length >= MAX_IMAGE_COUNT}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-3.5" />
                Add images
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              PNG, JPEG, GIF, or WebP. Up to {MAX_IMAGE_COUNT} files, 1.5 MB each.
            </p>
            {attachments.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="relative size-16 overflow-hidden rounded-md border border-border/60 bg-muted/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URLs */}
                    <img src={a.previewUrl} alt={a.file.name} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                      aria-label={`Remove ${a.file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-expected" className="text-xs">Expected (optional)</Label>
            <textarea
              id="bug-expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              rows={2}
              maxLength={4000}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-actual" className="text-xs">Actual (optional)</Label>
            <textarea
              id="bug-actual"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              rows={2}
              maxLength={4000}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
          <div className="mt-auto flex gap-2 pt-2 border-t border-border/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Submit
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
