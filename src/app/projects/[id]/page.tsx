"use client";

import { use } from "react";
import { ProjectDetailScreen } from "@/features/projects";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectDetailScreen projectId={id} />;
}
