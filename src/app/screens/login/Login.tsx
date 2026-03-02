"use client";

import Link from "next/link";
import { CheckCircle2, Mail, Loader2, Send, Inbox } from "lucide-react";
import { useLogin } from "./useLogin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export function Login() {
  const {
    email,
    setEmail,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
  } = useLogin();

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center space-y-4">
            <div className="size-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
              <Inbox className="size-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Click the link in the email to sign in to your account. The link will expire in 15 minutes.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={useDifferentEmail}
              >
                Use a different email
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend magic link"
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Productivity</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Stay focused.<br />
              Get things done.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Sign in with just your email. No password needed.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Passwordless Login</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure magic link authentication directly to your inbox
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Focus Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Built-in Pomodoro timer for distraction-free work
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics & Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your productivity with detailed analytics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your email to receive a magic link
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="pl-10 h-11 bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:border-emerald-200 dark:focus-visible:ring-emerald-900/40 dark:focus-visible:border-emerald-700"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                  We'll email you a magic link for a password-free sign in.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Send magic link
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Mail className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">Tip:</strong> Check your spam or promotions folder if you don't see the email. The link expires in 15 minutes - request a new one if needed.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
