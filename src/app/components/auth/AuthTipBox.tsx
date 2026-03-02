"use client";

import { Mail } from "lucide-react";

type AuthTipBoxProps = {
  title: string;
  children: React.ReactNode;
};

export function AuthTipBox({ title, children }: AuthTipBoxProps) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <Mail className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-gray-100">{title}</strong> {children}
        </div>
      </div>
    </div>
  );
}
