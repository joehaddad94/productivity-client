"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/app/screens/login/Login";
import { useAuth } from "@/app/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return <Login />;
}
