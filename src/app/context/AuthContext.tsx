"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { User } from "@/lib/types";
import type { AuthUser } from "@/lib/api/auth-api";
import {
  useMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useVerifyMutation,
  useLogoutMutation,
  AUTH_QUERY_KEY,
} from "@/app/hooks/useAuthApi";
import { useQueryClient } from "@tanstack/react-query";

function mapUser(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
  };
}

interface AuthContextType {
  user: User | null;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  const { data: meUser, isFetched: meFetched } = useMeQuery();
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const verifyMutation = useVerifyMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!meFetched) return;
    setUser(meUser ? mapUser(meUser) : null);
  }, [meFetched, meUser]);

  const signup = useCallback(
    async (name: string, email: string) => {
      await registerMutation.mutateAsync({ email, name });
    },
    [registerMutation]
  );

  const sendMagicLink = useCallback(
    async (email: string) => {
      await loginMutation.mutateAsync(email);
    },
    [loginMutation]
  );

  const verifyMagicLink = useCallback(
    async (token: string) => {
      const { user: authUser } = await verifyMutation.mutateAsync(token);
      const mapped = mapUser(authUser);
      setUser(mapped);
      queryClient.setQueryData(AUTH_QUERY_KEY, authUser);
    },
    [verifyMutation, queryClient]
  );

  const logout = useCallback(async () => {
    // Clear user and cache immediately so navigation to "/" sees unauthenticated state
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    setUser(null);
    try {
      await logoutMutation.mutateAsync();
    } finally {
      // Ensure cache stays clear after API call (e.g. if mutation had its own onSuccess)
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
