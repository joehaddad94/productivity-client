"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { EMAIL_REGEX } from "./types";

export function useSignup() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = useCallback(
    async (e: { preventDefault(): void }) => {
      e.preventDefault();

      if (!name || !email) {
        toast.error("Please fill in all fields");
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setIsLoading(true);
      try {
        await signup(name, email);
        setEmailSent(true);
        toast.success("Sign-in link sent! Check your email.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create account. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, signup]
  );

  const useDifferentEmail = useCallback(() => setEmailSent(false), []);

  const onResend = useCallback(() => {
    handleSubmit({ preventDefault: () => {} });
  }, [handleSubmit]);

  return {
    name,
    setName,
    email,
    setEmail,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
    onResend,
  };
}
