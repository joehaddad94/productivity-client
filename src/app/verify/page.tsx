"use client";

import { Suspense } from "react";
import { VerifyMagicLinkScreen } from "@/features/auth/verify";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyMagicLinkScreen />
    </Suspense>
  );
}
