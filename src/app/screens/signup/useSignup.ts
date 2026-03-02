"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { EMAIL_REGEX } from "./types";

export function useSignup() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
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
      toast.success("Magic link sent! Check your email.");
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const useDifferentEmail = () => setEmailSent(false);

  return {
    name,
    setName,
    email,
    setEmail,
    isLoading,
    emailSent,
    handleSubmit,
    useDifferentEmail,
  };
}
