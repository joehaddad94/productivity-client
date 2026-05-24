"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export function FooterAccountLinks() {
  const { isAuthenticated, isInitialized } = useAuth();

  const links = isInitialized && isAuthenticated
    ? [{ href: "/dashboard", label: "Dashboard" }]
    : [
        { href: "/login",  label: "Log in"      },
        { href: "/signup", label: "Get started" },
      ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
        Account
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
