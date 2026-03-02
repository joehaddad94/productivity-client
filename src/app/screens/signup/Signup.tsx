"use client";

import Link from "next/link";
import { CheckCircle2, Mail, User, Loader2, Send, Inbox, ListTodo, Flag, Zap, Shield } from "lucide-react";
import { useSignup } from "./useSignup";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";

export function Signup() {
  const {
    name,
    setName,
    email,
    setEmail,
    agreeToTerms,
    setAgreeToTerms,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
  } = useSignup();

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
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Click the link in the email to activate your account and sign in. The link will expire in 15 minutes.
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
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
              Start your<br />
              productivity journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Organize tasks, track progress, and get things done. Sign up with just your email - no password required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="group p-4 rounded-xl bg-white/90 dark:bg-gray-900 border border-emerald-200/70 dark:border-gray-700 shadow-sm shadow-emerald-200/30 dark:shadow-none hover:shadow-md hover:shadow-emerald-200/40 dark:hover:border-emerald-800/50 transition-all duration-200">
              <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                <ListTodo className="size-4" />
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Track tasks</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Lists and due dates</div>
            </div>
            <div className="group p-4 rounded-xl bg-white/90 dark:bg-gray-900 border border-teal-200/70 dark:border-gray-700 shadow-sm shadow-teal-200/30 dark:shadow-none hover:shadow-md hover:shadow-teal-200/40 dark:hover:border-teal-800/50 transition-all duration-200">
              <div className="size-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-3 text-teal-600 dark:text-teal-400">
                <Flag className="size-4" />
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Set priorities</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Focus on what matters</div>
            </div>
            <div className="group p-4 rounded-xl bg-white/90 dark:bg-gray-900 border border-amber-200/70 dark:border-gray-700 shadow-sm shadow-amber-200/30 dark:shadow-none hover:shadow-md hover:shadow-amber-200/40 dark:hover:border-amber-800/50 transition-all duration-200">
              <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-3 text-amber-600 dark:text-amber-400">
                <Zap className="size-4" />
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Simple & fast</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Clean, minimal interface</div>
            </div>
            <div className="group p-4 rounded-xl bg-white/90 dark:bg-gray-900 border border-sky-200/70 dark:border-gray-700 shadow-sm shadow-sky-200/30 dark:shadow-none hover:shadow-md hover:shadow-sky-200/40 dark:hover:border-sky-800/50 transition-all duration-200">
              <div className="size-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center mb-3 text-sky-600 dark:text-sky-400">
                <Shield className="size-4" />
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Your data</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Stay in control</div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  We'll send you a magic link to sign in
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Create account
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Mail className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">Passwordless signup:</strong> We'll send a secure magic link to your email. Click it to activate your account instantly.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
