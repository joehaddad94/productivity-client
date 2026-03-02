"use client";

import Link from "next/link";

type AuthFormLinkProps = {
  prompt: string;
  href: string;
  label: string;
};

export function AuthFormLink({ prompt, href, label }: AuthFormLinkProps) {
  return (
    <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
      {prompt}{" "}
      <Link href={href} className="text-primary hover:underline font-medium">
        {label}
      </Link>
    </div>
  );
}
