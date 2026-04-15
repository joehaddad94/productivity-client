import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { ScreenLoader } from "@/app/components/ScreenLoader";

export function VerifyMagicLink() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const attemptedTokenRef = useRef<string | null>(null);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    if (attemptedTokenRef.current === token) {
      return;
    }
    attemptedTokenRef.current = token;

    let cancelled = false;
    const verify = async () => {
      try {
        await verifyMagicLink(token);
        if (cancelled) return;
        setStatus("success");
        router.replace("/workspace");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, verifyMagicLink, router]);

  if (status === "loading") {
    return (
      <ScreenLoader
        variant="auth"
        message="Please wait while we verify your link..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          {status === "success" && (
            <>
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Welcome back!</CardTitle>
              <CardDescription className="text-base">
                You've been successfully signed in. Redirecting...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
                <XCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Invalid or expired link</CardTitle>
              <CardDescription className="text-base">
                This link is no longer valid. It may have expired or already been used.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status === "error" && (
          <CardContent>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Request a new sign-in link
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/signup")}
              >
                Create an account
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
