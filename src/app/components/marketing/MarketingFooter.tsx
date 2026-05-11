import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features",  label: "Features"  },
      { href: "/pricing",   label: "Pricing"   },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login",  label: "Log in"      },
      { href: "/signup", label: "Get started" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3 group w-fit">
              <div className="size-6 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30">
                <span className="text-primary-foreground text-[11px] font-bold">T</span>
              </div>
              <span className="font-semibold text-sm tracking-tight">Tasky</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              A focused productivity workspace. Tasks, notes, and a built-in focus timer — all in one place.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
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
          ))}
        </div>

        {/* Bottom: copyright */}
        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tasky. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with focus.
          </p>
        </div>
      </div>
    </footer>
  );
}
