"use client";

import { memo } from "react";
import { Mail } from "lucide-react";

type AuthTipBoxProps = {
  title: string;
  children: React.ReactNode;
};

function AuthTipBoxComponent({ title, children }: AuthTipBoxProps) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-start gap-2">
        <Mail className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="text-xs text-muted-foreground">
          <strong className="text-foreground">{title}</strong> {children}
        </div>
      </div>
    </div>
  );
}

export const AuthTipBox = memo(AuthTipBoxComponent);
