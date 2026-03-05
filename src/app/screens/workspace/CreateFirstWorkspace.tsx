"use client";

import { useState, useCallback, useRef } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useCreateWorkspaceMutation } from "@/app/hooks/useWorkspacesApi";
import { slugFromName, validateSlug, SLUG_MAX, NAME_MAX } from "./slug";
import type { Workspace } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";

interface CreateFirstWorkspaceProps {
  onSuccess: (workspace: Workspace) => void;
}

export function CreateFirstWorkspace({ onSuccess }: CreateFirstWorkspaceProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);
  const slugManuallyEdited = useRef(false);
  const createMutation = useCreateWorkspaceMutation();

  const handleNameChange = useCallback((value: string) => {
    const nextName = value.slice(0, NAME_MAX);
    setName(nextName);
    if (!slugManuallyEdited.current) {
      setSlug(slugFromName(nextName).slice(0, SLUG_MAX));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Workspace name is required");
      return;
    }
    const finalSlug = slug.trim() || slugFromName(trimmedName).slice(0, SLUG_MAX);
    if (finalSlug && !validateSlug(finalSlug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens (max 64)");
      return;
    }
    try {
      const workspace = await createMutation.mutateAsync({
        name: trimmedName,
        slug: finalSlug || undefined,
        isPersonal,
      });
      toast.success("Workspace created");
      onSuccess(workspace);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              Create your workspace
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Your workspace is where your tasks and notes live. You can add more later.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form
          onSubmit={handleSubmit}
          className={cn(
            "rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3",
            "bg-gray-50/50 dark:bg-gray-800/30"
          )}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="ws-name" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Workspace name
            </Label>
            <Input
              id="ws-name"
              type="text"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="rounded-md border-gray-200 dark:border-gray-700"
              disabled={createMutation.isPending}
              maxLength={NAME_MAX}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-slug" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              URL slug <span className="font-normal text-gray-400">(optional)</span>
            </Label>
            <Input
              id="ws-slug"
              type="text"
              placeholder={slugFromName(name || "my-workspace").slice(0, SLUG_MAX)}
              value={slug}
              onChange={(e) => {
                slugManuallyEdited.current = true;
                setSlug(e.target.value.slice(0, SLUG_MAX).toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              className="rounded-md border-gray-200 dark:border-gray-700"
              disabled={createMutation.isPending}
              maxLength={SLUG_MAX}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Lowercase letters, numbers, hyphens only
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="ws-personal"
              checked={isPersonal}
              onCheckedChange={(c) => setIsPersonal(c === true)}
              disabled={createMutation.isPending}
            />
            <Label
              htmlFor="ws-personal"
              className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
            >
              Personal workspace
            </Label>
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create workspace"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
