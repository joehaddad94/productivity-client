import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const sendMagicLink = async (email: string) => {
    // Simulate API call to send magic link
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In a real app, this would send an email with a magic link
    console.log(`Magic link sent to ${email}`);
  };

  const verifyMagicLink = async (token: string) => {
    // Simulate API call to verify token
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock user data
    setUser({
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    });
  };

  const signup = async (name: string, email: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In a real app, this would create the user and send a magic link
    console.log(`Magic link sent to ${email} for new user ${name}`);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sendMagicLink,
        verifyMagicLink,
        signup,
        logout,
        isAuthenticated: !!user,
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