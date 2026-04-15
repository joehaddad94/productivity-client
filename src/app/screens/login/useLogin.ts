"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { EMAIL_REGEX } from "./types";

export function useLogin() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: { preventDefault(): void }) => {
      e.preventDefault();
      setFormError(null);

      if (!email) {
        const message = "Please enter your email address";
        setFormError(message);
        toast.error(message);
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        const message = "Please enter a valid email address";
        setFormError(message);
        toast.error(message);
        return;
      }

      setIsLoading(true);
      try {
        const result = await sendMagicLink(email);
        setMagicLink(result.magicLink ?? null);
        setEmailSent(true);
        toast.success("Sign-in link sent! Check your email.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not send sign-in link. Please try again.";
        setFormError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [email, sendMagicLink]
  );

  const useDifferentEmail = useCallback(() => {
    setEmailSent(false);
    setMagicLink(null);
  }, []);

  const onResend = useCallback(() => {
    handleSubmit({ preventDefault: () => {} });
  }, [handleSubmit]);

  return {
    email,
    setEmail,
    isLoading,
    emailSent,
    formError,
    magicLink,
    handleSubmit,
    useDifferentEmail,
    onResend,
  };
}
