"use client";

import { useState, useCallback } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useCreateWorkspaceMutation } from "@/app/hooks/useWorkspacesApi";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/app/components/auth";
import { slugFromName, validateSlug, SLUG_MAX, NAME_MAX } from "./slug";
import type { Workspace } from "@/lib/types";
import { toast } from "sonner";

interface CreateFirstWorkspaceProps {
  onSuccess: (workspace: Workspace) => void;
}

export function CreateFirstWorkspace({ onSuccess }: CreateFirstWorkspaceProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);
  const createMutation = useCreateWorkspaceMutation();

  const handleNameChange = useCallback((value: string) => {
    setName(value.slice(0, NAME_MAX));
    setSlug((prev) => (prev ? prev : slugFromName(value).slice(0, SLUG_MAX)));
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
      <CardHeader className="space-y-0.5 pb-1">
        <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-1.5">
          <Building2 className="size-5 text-primary" />
        </div>
        <CardTitle className="text-xl">Create your workspace</CardTitle>
        <CardDescription className="text-sm">
          Your workspace is where your tasks and notes live. You can add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className={AUTH_LABEL_CLASS}>
              Workspace name
            </Label>
            <Input
              id="ws-name"
              type="text"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={AUTH_INPUT_CLASS}
              disabled={createMutation.isPending}
              maxLength={NAME_MAX}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-slug" className={AUTH_LABEL_CLASS}>
              URL slug <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="ws-slug"
              type="text"
              placeholder={slugFromName(name || "my-workspace").slice(0, SLUG_MAX)}
              value={slug}
              onChange={(e) => setSlug(e.target.value.slice(0, SLUG_MAX).toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className={AUTH_INPUT_CLASS}
              disabled={createMutation.isPending}
              maxLength={SLUG_MAX}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Lowercase letters, numbers, hyphens only
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="ws-personal"
              checked={isPersonal}
              onChange={(e) => setIsPersonal(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="ws-personal" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              Personal workspace
            </Label>
          </div>
          <Button
            type="submit"
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
