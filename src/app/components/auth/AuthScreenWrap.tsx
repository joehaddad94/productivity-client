"use client";

import { ReactNode } from "react";

const PAGE_BG_CLASS =
  "min-h-screen bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4";

export function AuthScreenWrap({ children }: { children: ReactNode }) {
  return <div className={PAGE_BG_CLASS}>{children}</div>;
}
