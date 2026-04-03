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

  const handleSubmit = useCallback(
    async (e: { preventDefault(): void }) => {
      e.preventDefault();

      if (!email) {
        toast.error("Please enter your email address");
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setIsLoading(true);
      try {
        await sendMagicLink(email);
        setEmailSent(true);
        toast.success("Sign-in link sent! Check your email.");
      } catch (error) {
        toast.error("Failed to send sign-in link");
      } finally {
        setIsLoading(false);
      }
    },
    [email, sendMagicLink]
  );

  const useDifferentEmail = useCallback(() => setEmailSent(false), []);

  const onResend = useCallback(() => {
    handleSubmit({ preventDefault: () => {} });
  }, [handleSubmit]);

  return {
    email,
    setEmail,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
    onResend,
  };
}
