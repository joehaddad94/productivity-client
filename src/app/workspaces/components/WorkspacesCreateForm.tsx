"use client";

import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import {
  slugFromName,
  validateSlug,
  SLUG_MAX,
  NAME_MAX,
} from "@/app/screens/workspace/slug";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";

export interface WorkspacesCreateFormData {
  name: string;
  slug?: string;
  isPersonal: boolean;
}

interface WorkspacesCreateFormProps {
  onCancel: () => void;
  onSubmit: (data: WorkspacesCreateFormData) => Promise<void>;
  isPending: boolean;
}

export function WorkspacesCreateForm({
  onCancel,
  onSubmit,
  isPending,
}: WorkspacesCreateFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);
  const slugManuallyEdited = useRef(false);

  const handleNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    if (!slugManuallyEdited.current) {
      setSlug(slugFromName(value).slice(0, SLUG_MAX));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const finalSlug =
      slug.trim() || slugFromName(trimmed).slice(0, SLUG_MAX);
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
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4",
        "bg-gray-50/50 dark:bg-gray-800/30"
      )}
    >
      <div className="grid gap-2">
        <Label
          htmlFor="create-name"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </Label>
        <Input
          id="create-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Workspace"
          maxLength={NAME_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="create-slug"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <Input
          id="create-slug"
          value={slug}
          onChange={(e) => {
            slugManuallyEdited.current = true;
            setSlug(
              e.target.value
                .slice(0, SLUG_MAX)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
            );
          }}
          placeholder="my-workspace"
          maxLength={SLUG_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="create-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label
          htmlFor="create-personal"
          className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          Personal workspace
        </Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
