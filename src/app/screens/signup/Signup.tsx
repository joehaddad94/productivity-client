"use client";

import { CheckCircle2, Mail, User, Loader2, Send } from "lucide-react";
import { useSignup } from "./useSignup";
import { Button } from "@/app/components/ui/button";
import { AuthScreenWrap, CheckEmailCard, AuthFormLink } from "@/app/components/auth";

const SIGNUP_ALTERNATE_LINK = { href: "/login", prompt: "Already have an account?", label: "Sign in" } as const;

export function Signup() {
  const {
    name,
    setName,
    email,
    setEmail,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
    onResend,
  } = useSignup();

  if (emailSent) {
    return (
      <AuthScreenWrap>
        <CheckEmailCard
          email={email}
          message="Click the link in the email to activate your account and sign in. The link will expire in 15 minutes."
          onUseDifferentEmail={useDifferentEmail}
          onResend={onResend}
          isLoading={isLoading}
          alternateLink={SIGNUP_ALTERNATE_LINK}
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
            <h1 className="text-xl font-semibold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Get started with Tasky — free forever</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-background rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-transparent border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/40"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="size-3.5 mr-2 animate-spin" />Creating account…</>
              ) : (
                <><Send className="size-3.5 mr-2" />Create account</>
              )}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            By signing up you agree to receive a sign-in link at this email. No marketing.
          </p>

          <AuthFormLink prompt="Already have an account?" href="/login" label="Sign in" />
        </div>

        {/* Features below card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>Track tasks</span>
          <span className="size-1 rounded-full bg-border" />
          <span>Focus timer</span>
          <span className="size-1 rounded-full bg-border" />
          <span>Analytics</span>
        </div>
      </div>
    </AuthScreenWrap>
  );
}
