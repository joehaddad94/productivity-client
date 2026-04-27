"use client";

import { createContext, useContext, useCallback, useEffect, ReactNode } from "react";
import type { User } from "@/lib/types";
import type { AuthUser } from "@/lib/api/auth-api";
import {
  useMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useVerifyMutation,
  useLogoutMutation,
  useUpdateMeMutation,
  AUTH_QUERY_KEY,
} from "@/app/hooks/useAuthApi";
import { useQueryClient } from "@tanstack/react-query";

function mapUser(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    isAdmin: u.isAdmin,
  };
}

interface AuthContextType {
  user: User | null;
  sendMagicLink: (email: string) => Promise<{ message?: string; magicLink?: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: meUser, isFetched: meFetched } = useMeQuery();
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const verifyMutation = useVerifyMutation();
  const logoutMutation = useLogoutMutation();
  const updateMeMutation = useUpdateMeMutation();

  // Silently sync the browser's IANA timezone to the server on first load.
  useEffect(() => {
    if (!meFetched || !meUser) return;
    let detectedTz: string;
    try {
      detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (meUser.timezone !== detectedTz) {
      updateMeMutation.mutate({ timezone: detectedTz });
    }
  // Only run when meFetched flips to true or the user identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meFetched, meUser?.id]);

  // Derive user synchronously from the query so there's no one-frame lag.
  // Previously we copied meUser into useState in an effect, so when meFetched
  // became true we still had user=null for one render and the home page
  // briefly showed the login screen before redirecting.
  const user = meFetched ? (meUser ? mapUser(meUser) : null) : null;

  const signup = useCallback(
    async (name: string, email: string) => {
      await registerMutation.mutateAsync({ email, name });
    },
    [registerMutation]
  );

  const sendMagicLink = useCallback(
    async (email: string) => {
      return await loginMutation.mutateAsync(email);
    },
    [loginMutation]
  );

  const verifyMagicLink = useCallback(
    async (token: string) => {
      const { user: authUser } = await verifyMutation.mutateAsync(token);
      queryClient.setQueryData(AUTH_QUERY_KEY, authUser);
    },
    [verifyMutation, queryClient]
  );

  const logout = useCallback(async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    try {
      await logoutMutation.mutateAsync();
    } finally {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    }
  }, [logoutMutation, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        sendMagicLink,
        verifyMagicLink,
        signup,
        logout,
        isAuthenticated: !!user,
        isInitialized: meFetched,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
