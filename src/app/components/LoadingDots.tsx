"use client";

import { cn } from "@/app/components/ui/utils";

type LoadingDotsProps = {
  colors?: string[];
  count?: number;
  sizeClassName?: string;
  className?: string;
  "aria-hidden"?: boolean;
};

const DEFAULT_COLORS = [
  "var(--loader-1)",
  "var(--loader-2)",
  "var(--loader-3)",
];

export function LoadingDots({
  colors = DEFAULT_COLORS,
  count = 3,
  sizeClassName = "size-1.5",
  className,
  "aria-hidden": ariaHidden,
}: LoadingDotsProps) {
  const dots = Array.from({ length: count }, (_, i) => colors[i % colors.length]);

  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden={ariaHidden}>
      {dots.map((color, i) => (
        <span
          key={i}
          className={cn("rounded-full", sizeClassName)}
          style={{
            background: color,
            animation: "loader-dot 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
