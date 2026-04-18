"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { notesApi, type NotesPage } from "@/lib/api/notes-api";
import type { WorkspaceTag } from "@/lib/api/tags-api";
import type { Note } from "@/lib/types";
import { NOTES_QUERY_KEY, NOTE_QUERY_KEY } from "./useNotesApi";
import { WORKSPACE_TAGS_QUERY_KEY } from "./useTagsApi";

const FLUSH_DELAY_MS = 200;
// Must stay in sync with ArrayMaxSize on the server's AddTagsDto.
const MAX_TAGS_PER_POST = 50;

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length <= size) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function normalize(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Per-note buffer of pending tag operations.
 * Uses LinkedHashSets (plain Sets in insertion order) so that a tag added then
 * removed (or vice versa) within the debounce window cancels out cleanly.
 */
type NoteBuffer = {
  adds: Set<string>;
  removes: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
  chain: Promise<void>;
};

type OptimisticChange = {
  addedToNote: string[];
  removedFromNote: string[];
};

function applyOptimisticToNotesList(
  queryClient: QueryClient,
  wsKey: string,
  noteId: string,
  mutator: (tags: string[]) => string[],
) {
  queryClient.setQueriesData<NotesPage>(
    { queryKey: NOTES_QUERY_KEY(wsKey) },
    (page) => {
      if (!page || !Array.isArray(page.notes)) return page;
      const idx = page.notes.findIndex((n) => n.id === noteId);
      if (idx < 0) return page;
      const current = page.notes[idx];
      const nextTags = mutator(current.tags ?? []);
      const nextNotes = [...page.notes];
      nextNotes[idx] = { ...current, tags: nextTags };
      return { ...page, notes: nextNotes };
    },
  );
}

function applyOptimisticToNoteDetail(
  queryClient: QueryClient,
  wsKey: string,
  noteId: string,
  mutator: (tags: string[]) => string[],
) {
  const prev = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId));
  if (!prev) return;
  queryClient.setQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId), {
    ...prev,
    tags: mutator(prev.tags ?? []),
  });
}

function applyOptimisticToWorkspaceTags(
  queryClient: QueryClient,
  wsKey: string,
  change: OptimisticChange,
) {
  const prev = queryClient.getQueryData<WorkspaceTag[]>(WORKSPACE_TAGS_QUERY_KEY(wsKey));
  if (!prev) return;
  const map = new Map(prev.map((t) => [t.tag, t.count]));
  for (const t of change.addedToNote) {
    map.set(t, (map.get(t) ?? 0) + 1);
  }
  for (const t of change.removedFromNote) {
    const current = map.get(t) ?? 0;
    const next = current - 1;
    if (next <= 0) map.delete(t);
    else map.set(t, next);
  }
  const next = Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  queryClient.setQueryData<WorkspaceTag[]>(WORKSPACE_TAGS_QUERY_KEY(wsKey), next);
}

function getCurrentTagsForNote(
  queryClient: QueryClient,
  wsKey: string,
  noteId: string,
): string[] {
  const detail = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId));
  if (detail?.tags) return detail.tags;
  const pages = queryClient.getQueriesData<NotesPage>({
    queryKey: NOTES_QUERY_KEY(wsKey),
  });
  for (const [, page] of pages) {
    if (!page || !Array.isArray(page.notes)) continue;
    const note = page.notes.find((n) => n.id === noteId);
    if (note?.tags) return note.tags;
  }
  return [];
}

export type NoteTagBatcher = {
  enqueueAdd: (noteId: string, tags: string[]) => void;
  enqueueRemove: (noteId: string, tag: string) => void;
  flush: (noteId?: string) => Promise<void>;
  isPending: boolean;
};

/**
 * Batches tag add/remove operations per note.
 * - Applies optimistic cache updates instantly (no flicker).
 * - Debounces network calls by ~200ms and coalesces rapid ops into one request.
 * - Serializes network calls per note so the backend never sees concurrent
 *   read-modify-write races on the same Note.tags array.
 * - Cancels out add+remove of the same tag within the debounce window.
 * - On error, reverts the optimistic changes for that batch and invalidates
 *   caches to reconcile with the server.
 */
export function useNoteTagBatcher(workspaceId: string | null | undefined): NoteTagBatcher {
  const queryClient = useQueryClient();
  const wsKey = workspaceId ?? "";

  const buffersRef = useRef<Map<string, NoteBuffer>>(new Map());
  const [inflightCount, setInflightCount] = useState(0);

  // Latest workspaceId kept in a ref so the long-lived callbacks below always
  // see the current value, even if they were created on an earlier render
  // (e.g. the first render where workspaceId was still null).
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  const wsKeyRef = useRef(wsKey);
  wsKeyRef.current = wsKey;

  const getBuffer = useCallback((noteId: string): NoteBuffer => {
    let buf = buffersRef.current.get(noteId);
    if (!buf) {
      buf = {
        adds: new Set<string>(),
        removes: new Set<string>(),
        timer: null,
        chain: Promise.resolve(),
      };
      buffersRef.current.set(noteId, buf);
    }
    return buf;
  }, []);

  const flushBuffer = useCallback(
    (noteId: string) => {
      const currentWorkspaceId = workspaceIdRef.current;
      const currentWsKey = wsKeyRef.current;
      if (!currentWorkspaceId) return;

      const buf = getBuffer(noteId);
      if (buf.timer) {
        clearTimeout(buf.timer);
        buf.timer = null;
      }
      if (buf.adds.size === 0 && buf.removes.size === 0) return;

      const adds = Array.from(buf.adds);
      const removes = Array.from(buf.removes);
      buf.adds.clear();
      buf.removes.clear();

      setInflightCount((c) => c + 1);

      buf.chain = buf.chain
        .catch(() => undefined)
        .then(async () => {
          try {
            if (adds.length > 0) {
              for (const group of chunk(adds, MAX_TAGS_PER_POST)) {
                await notesApi.addTags(currentWorkspaceId, noteId, group);
              }
            }
            for (const tag of removes) {
              await notesApi.removeTag(currentWorkspaceId, noteId, tag);
            }
          } catch (err) {
            // Revert optimistic changes for this batch.
            if (adds.length > 0) {
              const addsSet = new Set(adds);
              applyOptimisticToNotesList(queryClient, currentWsKey, noteId, (existing) =>
                existing.filter((t) => !addsSet.has(t.toLowerCase())),
              );
              applyOptimisticToNoteDetail(queryClient, currentWsKey, noteId, (existing) =>
                existing.filter((t) => !addsSet.has(t.toLowerCase())),
              );
              applyOptimisticToWorkspaceTags(queryClient, currentWsKey, {
                addedToNote: [],
                removedFromNote: adds,
              });
            }
            if (removes.length > 0) {
              applyOptimisticToNotesList(queryClient, currentWsKey, noteId, (existing) => {
                const seen = new Set(existing.map((t) => t.toLowerCase()));
                const next = [...existing];
                for (const t of removes) {
                  if (!seen.has(t)) {
                    next.push(t);
                    seen.add(t);
                  }
                }
                return next;
              });
              applyOptimisticToNoteDetail(queryClient, currentWsKey, noteId, (existing) => {
                const seen = new Set(existing.map((t) => t.toLowerCase()));
                const next = [...existing];
                for (const t of removes) {
                  if (!seen.has(t)) {
                    next.push(t);
                    seen.add(t);
                  }
                }
                return next;
              });
              applyOptimisticToWorkspaceTags(queryClient, currentWsKey, {
                addedToNote: removes,
                removedFromNote: [],
              });
            }

            queryClient.invalidateQueries({
              queryKey: NOTES_QUERY_KEY(currentWsKey),
              refetchType: "active",
            });
            queryClient.invalidateQueries({
              queryKey: NOTE_QUERY_KEY(currentWsKey, noteId),
              refetchType: "active",
            });
            queryClient.invalidateQueries({
              queryKey: WORKSPACE_TAGS_QUERY_KEY(currentWsKey),
              refetchType: "active",
            });
            throw err;
          }
        })
        .finally(() => {
          setInflightCount((c) => Math.max(0, c - 1));
        });
    },
    [queryClient, getBuffer],
  );

  // Keep a ref to the latest flushBuffer so scheduled timers always call the
  // current version (and never a stale closure from a render where
  // workspaceId was still null).
  const flushBufferRef = useRef(flushBuffer);
  flushBufferRef.current = flushBuffer;

  const scheduleFlush = useCallback(
    (noteId: string) => {
      const buf = getBuffer(noteId);
      if (buf.timer) clearTimeout(buf.timer);
      buf.timer = setTimeout(() => {
        buf.timer = null;
        flushBufferRef.current(noteId);
      }, FLUSH_DELAY_MS);
    },
    [getBuffer],
  );

  const enqueueAdd = useCallback(
    (noteId: string, tags: string[]) => {
      if (!workspaceIdRef.current) return;
      const currentWsKey = wsKeyRef.current;
      const normalized = Array.from(new Set(tags.map(normalize).filter(Boolean)));
      if (normalized.length === 0) return;

      const buf = getBuffer(noteId);
      const existingOnNote = new Set(
        getCurrentTagsForNote(queryClient, currentWsKey, noteId).map((t) => t.toLowerCase()),
      );

      const actuallyNew: string[] = [];
      const cancelledRemoves: string[] = [];

      for (const t of normalized) {
        if (buf.removes.has(t)) {
          buf.removes.delete(t);
          cancelledRemoves.push(t);
          continue;
        }
        if (existingOnNote.has(t)) continue;
        if (buf.adds.has(t)) continue;
        buf.adds.add(t);
        actuallyNew.push(t);
      }

      if (actuallyNew.length === 0 && cancelledRemoves.length === 0) return;

      const addSet = new Set([...actuallyNew, ...cancelledRemoves]);

      applyOptimisticToNotesList(queryClient, currentWsKey, noteId, (existing) => {
        const merged = [...existing];
        const seen = new Set(existing.map((t) => t.toLowerCase()));
        for (const t of addSet) {
          if (!seen.has(t)) {
            merged.push(t);
            seen.add(t);
          }
        }
        return merged;
      });
      applyOptimisticToNoteDetail(queryClient, currentWsKey, noteId, (existing) => {
        const merged = [...existing];
        const seen = new Set(existing.map((t) => t.toLowerCase()));
        for (const t of addSet) {
          if (!seen.has(t)) {
            merged.push(t);
            seen.add(t);
          }
        }
        return merged;
      });
      applyOptimisticToWorkspaceTags(queryClient, currentWsKey, {
        addedToNote: Array.from(addSet),
        removedFromNote: [],
      });

      scheduleFlush(noteId);
    },
    [queryClient, getBuffer, scheduleFlush],
  );

  const enqueueRemove = useCallback(
    (noteId: string, tag: string) => {
      if (!workspaceIdRef.current) return;
      const currentWsKey = wsKeyRef.current;
      const t = normalize(tag);
      if (!t) return;

      const buf = getBuffer(noteId);

      const existingOnNote = new Set(
        getCurrentTagsForNote(queryClient, currentWsKey, noteId).map((x) => x.toLowerCase()),
      );

      if (buf.adds.has(t)) {
        buf.adds.delete(t);
      } else {
        if (!existingOnNote.has(t) && !buf.removes.has(t)) return;
        buf.removes.add(t);
      }

      applyOptimisticToNotesList(queryClient, currentWsKey, noteId, (existing) =>
        existing.filter((x) => x.toLowerCase() !== t),
      );
      applyOptimisticToNoteDetail(queryClient, currentWsKey, noteId, (existing) =>
        existing.filter((x) => x.toLowerCase() !== t),
      );
      applyOptimisticToWorkspaceTags(queryClient, currentWsKey, {
        addedToNote: [],
        removedFromNote: [t],
      });

      scheduleFlush(noteId);
    },
    [queryClient, getBuffer, scheduleFlush],
  );

  const flush = useCallback(
    async (noteId?: string) => {
      const ids = noteId ? [noteId] : Array.from(buffersRef.current.keys());
      for (const id of ids) flushBufferRef.current(id);
      const chains = ids.map((id) => buffersRef.current.get(id)?.chain).filter(Boolean);
      await Promise.allSettled(chains as Promise<void>[]);
    },
    [],
  );

  useEffect(() => {
    const buffers = buffersRef.current;
    return () => {
      for (const [id, buf] of buffers) {
        if (buf.timer) {
          clearTimeout(buf.timer);
          buf.timer = null;
          if (buf.adds.size > 0 || buf.removes.size > 0) {
            flushBufferRef.current(id);
          }
        }
      }
    };
  }, []);

  return {
    enqueueAdd,
    enqueueRemove,
    flush,
    isPending: inflightCount > 0,
  };
}
