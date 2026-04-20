"use client";

import { use } from "react";
import { ProjectNoteEditorScreen } from "@/features/notes";

export default function ProjectNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; noteId: string }>;
  searchParams: Promise<{ fromTab?: string }>;
}) {
  const { id, noteId } = use(params);
  const { fromTab } = use(searchParams);
  return <ProjectNoteEditorScreen projectId={id} noteId={noteId} fromTab={fromTab} />;
}
