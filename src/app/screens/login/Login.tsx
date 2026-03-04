"use client";

import { CheckCircle2, Mail, Loader2, Send, KeyRound, Timer, BarChart3 } from "lucide-react";
import { useLogin } from "./useLogin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  AuthScreenWrap,
  CheckEmailCard,
  AuthTipBox,
  AuthFormLink,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from "@/app/components/auth";

const LOGIN_FEATURES = [
  {
    icon: KeyRound,
    iconClass: "bg-primary/10 dark:bg-primary/20 text-primary",
    title: "Passwordless Login",
    desc: "Secure sign-in link sent directly to your inbox",
  },
  {
    icon: Timer,
    iconClass: "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    title: "Focus Mode",
    desc: "Built-in Pomodoro timer for distraction-free work",
  },
  {
    icon: BarChart3,
    iconClass: "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
    title: "Analytics & Insights",
    desc: "Track your productivity with detailed analytics",
  },
] as const;

const LOGIN_ALTERNATE_LINK = { href: "/signup", prompt: "Don't have an account?", label: "Sign up" } as const;

export function Login() {
  const { email, setEmail, isLoading, emailSent, handleSubmit, useDifferentEmail, onResend } = useLogin();

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
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Tasky</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Stay focused.
              <br />
              Get things done.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Sign in with just your email. No password needed.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            {LOGIN_FEATURES.map(({ icon: Icon, iconClass, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter your email to receive a sign-in link</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                  We'll email you a sign-in link for a password-free sign in.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending sign-in link...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Send sign-in link
                  </>
                )}
              </Button>

              <AuthFormLink prompt="Don't have an account?" href="/signup" label="Sign up" />
            </form>

            <AuthTipBox title="Tip:">
              Check your spam or promotions folder if you don't see the email. The link expires in
              15 minutes—request a new one if needed.
            </AuthTipBox>
          </CardContent>
        </Card>
      </div>
    </AuthScreenWrap>
  );
}
