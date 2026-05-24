import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs | Tasky",
  description: "Tasky documentation. Coming soon.",
};

export default function DocsPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      <section className="relative px-4 sm:px-6 pt-20 pb-12 sm:pt-24 min-h-[60vh] flex items-center">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-60" />
        </div>
        <div className="max-w-3xl mx-auto text-center w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-6">
            <BookOpen className="size-3" />
            Coming soon
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Docs are on the way
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
            We&apos;re writing the documentation now. In the meantime, the app is pretty intuitive — give it a try.
          </p>
          <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/20">
            <Link href="/signup">
              Get started for free
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
