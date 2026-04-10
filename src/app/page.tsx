"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/features/auth/login";
import { useAuth } from "@/app/context/AuthContext";
import { ScreenLoader } from "@/app/components/ScreenLoader";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace("/workspace");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <ScreenLoader variant="auth" message="Checking authentication…" />;
  }

  if (isAuthenticated) {
    return <ScreenLoader variant="auth" message="Checking authentication…" />;
  }

  return <LoginScreen />;
}
