"use client";

import { memo } from "react";
import Link from "next/link";

type AuthFormLinkProps = {
  prompt: string;
  href: string;
  label: string;
};

function AuthFormLinkComponent({ prompt, href, label }: AuthFormLinkProps) {
  return (
    <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/60">
      {prompt}{" "}
      <Link href={href} className="text-primary hover:underline font-medium">
        {label}
      </Link>
    </div>
  );
}

export const AuthFormLink = memo(AuthFormLinkComponent);
