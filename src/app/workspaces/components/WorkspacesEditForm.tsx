"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { validateSlug, SLUG_MAX, NAME_MAX } from "@/app/screens/workspace/slug";
import type { Workspace } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";

export interface WorkspacesEditFormData {
  name?: string;
  slug?: string;
  isPersonal?: boolean;
}

interface WorkspacesEditFormProps {
  workspace: Workspace;
  onCancel: () => void;
  onSubmit: (data: WorkspacesEditFormData) => Promise<void>;
  isPending: boolean;
}

export function WorkspacesEditForm({
  workspace,
  onCancel,
  onSubmit,
  isPending,
}: WorkspacesEditFormProps) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug ?? "");
  const [isPersonal, setIsPersonal] = useState(workspace.isPersonal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const finalSlug = slug.trim();
    if (finalSlug && !validateSlug(finalSlug)) {
      toast.error(
        "Slug: lowercase letters, numbers, hyphens only (max 64)"
      );
      return;
    }
    await onSubmit({
      name: trimmed,
      slug: finalSlug || undefined,
      isPersonal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label
          htmlFor="edit-name"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="edit-slug"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug
        </Label>
        <Input
          id="edit-slug"
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value
                .slice(0, SLUG_MAX)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
            )
          }
          maxLength={SLUG_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label
          htmlFor="edit-personal"
          className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          Personal
        </Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
