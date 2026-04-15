"use client";

import { memo } from "react";
import Link from "next/link";
import { Inbox, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

type CheckEmailCardProps = {
  email: string;
  message: string;
  magicLink?: string;
  onUseDifferentEmail: () => void;
  onResend: () => void;
  isLoading: boolean;
  alternateLink: { href: string; prompt: string; label: string };
};

function CheckEmailCardComponent({
  email,
  message,
  magicLink,
  onUseDifferentEmail,
  onResend,
  isLoading,
  alternateLink,
}: CheckEmailCardProps) {
  const copyLink = async () => {
    if (!magicLink) return;
    try {
      await navigator.clipboard.writeText(magicLink);
      toast.success("Sign-in link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="size-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
          <Inbox className="size-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="text-base">
          We've sent a sign-in link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
          <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="space-y-3">
          {magicLink && (
            <>
              <Button asChild className="w-full">
                <a href={magicLink} target="_blank" rel="noreferrer">
                  Open sign-in link
                </a>
              </Button>
              <Button variant="secondary" className="w-full" onClick={copyLink}>
                Copy sign-in link
              </Button>
            </>
          )}
          <Button variant="outline" className="w-full" onClick={onUseDifferentEmail}>
            Use a different email
          </Button>
          <Button variant="ghost" className="w-full" onClick={onResend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend sign-in link"
            )}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t">
          {alternateLink.prompt}{" "}
          <Link href={alternateLink.href} className="text-primary hover:underline font-medium">
            {alternateLink.label}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export const CheckEmailCard = memo(CheckEmailCardComponent);
