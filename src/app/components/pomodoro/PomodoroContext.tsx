"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface PomodoroLinkValue {
  linkedId: string | null;
  setLinkedId: (id: string | null) => void;
}

const PomodoroLinkContext = createContext<PomodoroLinkValue>({
  linkedId: null,
  setLinkedId: () => {},
});

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [linkedId, setLinkedId] = useState<string | null>(null);
  return (
    <PomodoroLinkContext.Provider value={{ linkedId, setLinkedId }}>
      {children}
    </PomodoroLinkContext.Provider>
  );
}

export function usePomodoroLink() {
  return useContext(PomodoroLinkContext);
}
