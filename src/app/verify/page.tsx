"use client";

import { Suspense } from "react";
import { VerifyMagicLink } from "@/app/pages/VerifyMagicLink";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyMagicLink />
    </Suspense>
  );
}
