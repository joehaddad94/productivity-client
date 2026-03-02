"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/app/screens/login/Login";
import { useAuth } from "@/app/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return <Login />;
}
