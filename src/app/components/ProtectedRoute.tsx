"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, type ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Re-enable when you want to enforce auth
    // if (!isAuthenticated) {
    //   router.replace("/login");
    // }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}
