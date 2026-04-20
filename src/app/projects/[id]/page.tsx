"use client";

import { use } from "react";
import { ProjectDetailScreen } from "@/features/projects";

export default function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = use(params);
  const { tab } = use(searchParams);
  const initialTab = tab === "notes" ? "notes" : "tasks";
  return <ProjectDetailScreen projectId={id} initialTab={initialTab} />;
}
