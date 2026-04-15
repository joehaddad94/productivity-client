"use client";

import { CheckCircle2, Mail, Loader2, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLogin } from "./useLogin";
import { Button } from "@/app/components/ui/button";
import { AuthScreenWrap, CheckEmailCard, AuthFormLink } from "@/app/components/auth";

const LOGIN_ALTERNATE_LINK = { href: "/signup", prompt: "Don't have an account?", label: "Sign up" } as const;

export function Login() {
  const { email, setEmail, isLoading, emailSent, formError, handleSubmit, useDifferentEmail, onResend } =
    useLogin();

  if (emailSent) {
    return (
      <AuthScreenWrap>
        <CheckEmailCard
          email={email}
          message="Click the link in the email to sign in to your account. The link will expire in 15 minutes."
          onUseDifferentEmail={useDifferentEmail}
          onResend={onResend}
          isLoading={isLoading}
          alternateLink={LOGIN_ALTERNATE_LINK}
        />
      </AuthScreenWrap>
    );
  }

  return (
    <AuthScreenWrap>
      <div className="w-full max-w-sm">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
            <CheckCircle2 className="size-5 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sign in to your Tasky account</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-background rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-transparent border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/40"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <p className="leading-relaxed">
                  {formError.includes("No account found") ? (
                    <>
                      No account found for this email.{" "}
                      <Link
                        href="/signup"
                        className="font-medium underline underline-offset-2 hover:opacity-90"
                      >
                        Sign up first
                      </Link>
                      .
                    </>
                  ) : (
                    formError
                  )}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="size-3.5 mr-2 animate-spin" />Sending…</>
              ) : (
                <><Send className="size-3.5 mr-2" />Send sign-in link</>
              )}
            </Button>
          </form>

          <AuthFormLink prompt="Don't have an account?" href="/signup" label="Sign up" />
        </div>

        {/* Features below card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>No password needed</span>
          <span className="size-1 rounded-full bg-border" />
          <span>Focus timer built-in</span>
          <span className="size-1 rounded-full bg-border" />
          <span>Productivity analytics</span>
        </div>
      </div>
    </AuthScreenWrap>
  );
}
