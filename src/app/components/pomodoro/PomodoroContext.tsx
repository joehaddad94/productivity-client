"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface PomodoroLinkValue {
  linkedId: string | null;
  setLinkedId: (id: string | null) => void;
}

const PomodoroLinkContext = createContext<PomodoroLinkValue>({
  linkedId: null,
  setLinkedId: () => {},
});

const STORAGE_KEY = "pomodoro_linked_task_id";

export function PomodoroProvider({ children }: { children: ReactNode }) {
  // Start null on both server and first client render to avoid hydration mismatch.
  const [linkedId, setLinkedIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLinkedIdState(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const setLinkedId = useCallback((id: string | null) => {
    setLinkedIdState(id);
    try {
      if (id === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
    } catch { /* ignore */ }
  }, []);

  return (
    <PomodoroLinkContext.Provider value={{ linkedId, setLinkedId }}>
      {children}
    </PomodoroLinkContext.Provider>
  );
}

export function usePomodoroLink() {
  return useContext(PomodoroLinkContext);
}
