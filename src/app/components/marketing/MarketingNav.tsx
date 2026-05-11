"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

const NAV_LINKS = [
  { href: "/features",  label: "Features"  },
  { href: "/pricing",   label: "Pricing"   },
  { href: "/docs",      label: "Docs"      },
  { href: "/changelog", label: "Changelog" },
];

export function MarketingNav() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark = mounted && (resolvedTheme ?? theme) === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center cursor-pointer"
    >
      {/* Avoid hydration mismatch — render a neutral placeholder until mounted */}
      {mounted ? (
        isDark ? <Sun className="size-4" /> : <Moon className="size-4" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );

  const authButtons = isInitialized ? (
    isAuthenticated ? (
      <Button asChild size="sm" className="shadow-sm shadow-primary/20">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    ) : (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="sm" className="shadow-sm shadow-primary/20">
          <Link href="/signup">Get started</Link>
        </Button>
      </>
    )
  ) : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-background/0",
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="size-6 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
            <span className="text-primary-foreground text-[11px] font-bold">T</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Tasky</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "text-foreground bg-muted/60 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {themeToggle}
          <div className="w-px h-5 bg-border/60 mx-1" aria-hidden />
          {authButtons}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-1">
          {themeToggle}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block text-sm py-2 px-3 rounded-md transition-colors",
                  isActive
                    ? "text-foreground bg-muted/60 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 flex flex-col gap-2 border-t border-border/40 mt-3">
            {isInitialized && (
              isAuthenticated ? (
                <Button asChild size="sm">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup" onClick={() => setOpen(false)}>Get started</Link>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
