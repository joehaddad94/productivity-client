"use client";

import { use } from "react";
import { ProjectNoteEditorScreen } from "@/features/notes";

export default function ProjectNotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id, noteId } = use(params);
  return <ProjectNoteEditorScreen projectId={id} noteId={noteId} />;
}
