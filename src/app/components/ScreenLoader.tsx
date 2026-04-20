"use client";

import { useId } from "react";
import { cn } from "@/app/components/ui/utils";
import { LoadingDots } from "@/app/components/LoadingDots";

const AUTH_BG_CLASS =
  "min-h-screen flex items-center justify-center p-4 relative overflow-hidden";

type ScreenLoaderVariant = "auth" | "app";

interface ScreenLoaderProps {
  variant?: ScreenLoaderVariant;
  message?: string;
  className?: string;
}

const RING_R = 40;
const RING_C = 2 * Math.PI * RING_R;
const LOADER_COLORS = [
  "var(--loader-1)",
  "var(--loader-2)",
  "var(--loader-3)",
  "var(--loader-4)",
  "var(--loader-5)",
  "var(--loader-6)",
];

export function ScreenLoader({
  variant = "auth",
  message,
  className,
}: ScreenLoaderProps) {
  const gradientId = useId();
  if (variant === "auth") {
    return (
      <div
        data-testid="screen-loader"
        className={cn(AUTH_BG_CLASS, className)}
        role="status"
        aria-live="polite"
        style={{
          background: "var(--loader-bg-start)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 90% 60% at 50% 30%, var(--loader-bg-mid), transparent 70%),
              radial-gradient(ellipse 70% 50% at 100% 80%, var(--loader-bg-end), transparent 60%)
            `,
          }}
        />
        <div className="relative flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center size-28">
            {/* Outer ring: 6 colored segments rotating */}
            <svg
              className="size-28 animate-[loader-orbit_3s_linear_infinite]"
              viewBox="0 0 100 100"
              aria-hidden
            >
              {LOADER_COLORS.map((fill, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={fill}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${100 / LOADER_COLORS.length} ${300}`}
                  strokeDashoffset={i * (400 / LOADER_COLORS.length)}
                />
              ))}
            </svg>
            {/* Inner ring: reverse rotation, drawing animation */}
            <svg
              className="absolute size-24 animate-[loader-orbit-reverse_2.5s_linear_infinite]"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--loader-1)" />
                  <stop offset="25%" stopColor="var(--loader-2)" />
                  <stop offset="50%" stopColor="var(--loader-4)" />
                  <stop offset="75%" stopColor="var(--loader-5)" />
                  <stop offset="100%" stopColor="var(--loader-6)" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={251}
                style={{ animation: "loader-draw 1.6s ease-in-out infinite" }}
              />
            </svg>
            {/* 6 orbiting dots */}
            <div
              className="absolute inset-0 animate-[loader-orbit_4s_linear_infinite]"
              aria-hidden
            >
              {LOADER_COLORS.map((color, i) => {
                const angle = (i / LOADER_COLORS.length) * 360;
                const rad = (angle * Math.PI) / 180;
                const r = 38;
                const x = 50 + r * Math.cos(rad);
                const y = 50 + r * Math.sin(rad);
                return (
                  <div
                    key={i}
                    className="absolute size-3 rounded-full shadow-md"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                      background: color,
                      animation: "loader-dot 1.4s ease-in-out infinite",
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                );
              })}
            </div>
            {/* Center pill with T */}
            <div
              className="absolute flex size-14 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-gray-800 border-2 border-gray-200/80 dark:border-gray-600/80"
              style={{ animation: "loader-pulse-ring 2.2s ease-in-out infinite" }}
            >
              <span
                className="text-2xl font-extrabold text-[var(--loader-1)] dark:text-[var(--loader-2)] drop-shadow-sm select-none"
                style={{
                  textShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)",
                }}
                aria-hidden
              >
                T
              </span>
            </div>
          </div>
          {message && (
            <div className="flex flex-col items-center gap-2 max-w-sm text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500/80 dark:text-gray-400/80 font-semibold">
                Hang tight
              </p>
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                {message}
              </p>
              <LoadingDots
                className="pt-1"
                colors={LOADER_COLORS.slice(0, 3)}
                aria-hidden
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* App variant: colored bouncing dots */
  return (
    <div
      data-testid="screen-loader"
      className={cn(
        "flex items-center justify-center min-h-[40vh] py-12",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          {LOADER_COLORS.map((color, i) => (
            <div
              key={i}
              className="size-2.5 rounded-full shadow-sm"
              style={{
                background: color,
                animation: "loader-dot 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}
