"use client";

import Link from "next/link";
import { CheckCircle2, Mail, User, Loader2, Send, ListTodo, Flag, Zap, Shield } from "lucide-react";
import { useSignup } from "./useSignup";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  AuthScreenWrap,
  CheckEmailCard,
  AuthTipBox,
  AuthFormLink,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from "@/app/components/auth";

const FEATURES = [
  {
    icon: ListTodo,
    iconClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    cardClass:
      "border-emerald-200/70 dark:border-gray-700 shadow-sm shadow-emerald-200/30 dark:shadow-none hover:shadow-md hover:shadow-emerald-200/40 dark:hover:border-emerald-800/50",
    title: "Track tasks",
    desc: "Lists and due dates",
  },
  {
    icon: Flag,
    iconClass: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
    cardClass:
      "border-teal-200/70 dark:border-gray-700 shadow-sm shadow-teal-200/30 dark:shadow-none hover:shadow-md hover:shadow-teal-200/40 dark:hover:border-teal-800/50",
    title: "Set priorities",
    desc: "Focus on what matters",
  },
  {
    icon: Zap,
    iconClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    cardClass:
      "border-amber-200/70 dark:border-gray-700 shadow-sm shadow-amber-200/30 dark:shadow-none hover:shadow-md hover:shadow-amber-200/40 dark:hover:border-amber-800/50",
    title: "Simple & fast",
    desc: "Clean, minimal interface",
  },
  {
    icon: Shield,
    iconClass: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
    cardClass:
      "border-sky-200/70 dark:border-gray-700 shadow-sm shadow-sky-200/30 dark:shadow-none hover:shadow-md hover:shadow-sky-200/40 dark:hover:border-sky-800/50",
    title: "Your data",
    desc: "Stay in control",
  },
] as const;

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
      <AuthScreenWrap>
        <CheckEmailCard
          email={email}
          message="Click the link in the email to activate your account and sign in. The link will expire in 15 minutes."
          onUseDifferentEmail={useDifferentEmail}
          onResend={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          isLoading={isLoading}
          alternateLink={{ href: "/login", prompt: "Already have an account?", label: "Sign in" }}
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
            <h1 className="text-3xl font-bold">Productivity</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Start your
              <br />
              productivity journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Organize tasks, track progress, and get things done. Sign up with just your email—no
              password required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            {FEATURES.map(({ icon: Icon, iconClass, cardClass, title, desc }) => (
              <div
                key={title}
                className={`group p-4 rounded-xl bg-white/90 dark:bg-gray-900 border transition-all duration-200 ${cardClass}`}
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center mb-3 ${iconClass}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                  {title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className={AUTH_LABEL_CLASS}>
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                  We'll send you a magic link to sign in
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400 leading-snug cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
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

              <AuthFormLink prompt="Already have an account?" href="/login" label="Sign in" />
            </form>

            <AuthTipBox title="Passwordless signup:">
              We'll send a secure magic link to your email. Click it to activate your account
              instantly.
            </AuthTipBox>
          </CardContent>
        </Card>
      </div>
    </AuthScreenWrap>
  );
}
