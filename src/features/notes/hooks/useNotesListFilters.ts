"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { useDebounce } from "@/app/hooks/useDebounce";
import type { TagMode } from "../model/types";

/**
 * Search, tag filters, project filter, and list page size for the notes screen.
 */
export function useNotesListFilters(
  allProjects: Project[],
  projectsLoading: boolean,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTagsState] = useState<string[]>([]);
  const [tagMode, setTagModeState] = useState<TagMode>("all");
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!filterProjectId || projectsLoading) return;
    if (allProjects.some((p) => p.id === filterProjectId)) return;
    setFilterProjectId(null);
  }, [filterProjectId, allProjects, projectsLoading]);

  const handleLoadMore = useCallback(() => {
    setLimit((value) => value + 50);
  }, []);

  const setSelectedTags = useCallback((tags: string[]) => {
    const next = Array.from(
      new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    );
    setSelectedTagsState(next);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    setSelectedTagsState((current) =>
      current.includes(normalized)
        ? current.filter((t) => t !== normalized)
        : [...current, normalized],
    );
  }, []);

  const setTagMode = useCallback((mode: TagMode) => setTagModeState(mode), []);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    selectedTags,
    setSelectedTags,
    toggleTag,
    tagMode,
    setTagMode,
    filterProjectId,
    setFilterProjectId,
    limit,
    handleLoadMore,
  };
}
