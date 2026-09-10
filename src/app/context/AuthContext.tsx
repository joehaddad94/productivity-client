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
import { setUnauthorizedHandler } from "@/lib/api/client";

function mapUser(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    isAdmin: u.isAdmin,
    timezone: u.timezone ?? null,
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

  // Any request coming back 401 means the session is gone. Clear the cached
  // user so isAuthenticated flips and the app's existing redirect runs.
  //
  // Before this, thirteen endpoints swallowed 401 and returned an empty result,
  // so an expired session rendered as a legitimately empty account: /home said
  // "Nothing on your plate" and an empty workspace list pushed established
  // users into the create-your-first-workspace gate.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  // Seed the user's IANA timezone from the browser the first time we see an
  // account without one.
  //
  // This deliberately does NOT reconcile on every load. It used to, and that
  // made Settings' timezone field impossible to use: any value differing from
  // the device was overwritten on the next page load, so the control looked
  // editable but could never hold a choice. The value is not cosmetic — it is
  // what the server uses to decide quiet hours and when to send the daily
  // agenda, so a deliberate choice (travelling, or pinning a work timezone)
  // has to survive.
  useEffect(() => {
    if (!meFetched || !meUser) return;
    if (meUser.timezone) return;
    let detectedTz: string;
    try {
      detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (detectedTz) updateMeMutation.mutate({ timezone: detectedTz });
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
