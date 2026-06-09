"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";

interface Props {
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function MarketingCtaButton({ size = "lg", className }: Props) {
  const { isAuthenticated, isInitialized } = useAuth();

  const href = isInitialized && isAuthenticated ? "/dashboard" : "/signup";
  const label = isInitialized && isAuthenticated ? "Go to dashboard" : "Get started for free";

  return (
    <Button asChild size={size} className={className}>
      <Link href={href}>
        {label}
        <ArrowRight className="size-4 ml-1" />
      </Link>
    </Button>
  );
}
