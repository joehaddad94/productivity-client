/**
 * Auth API client. All requests use credentials: 'include' so the HttpOnly session cookie is sent.
 * Set NEXT_PUBLIC_API_URL to your API root (e.g. http://localhost:3000) or leave unset for same-origin.
 *
 * Magic link in email: the link must point to the FRONTEND /verify route, e.g. https://yourapp.com/verify?token=...
 * Configure the backend (e.g. APP_URL) to use the frontend origin so users land on this app; the frontend
 * then calls GET /auth/verify?token=... and redirects to the dashboard.
 */

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

function api(path: string, options: RequestInit = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
}

export type RegisterResponse = { message: string; magicLink?: string };
export type LoginResponse = { message: string; magicLink?: string };
export type VerifyResponse = { user: AuthUser };
export type LogoutResponse = { message: string };
export type MeResponse = { user: AuthUser };

function getMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m[0] ?? "Bad request";
    return typeof m === "string" ? m : "Bad request";
  }
  return "Request failed";
}

export const authApi = {
  register: async (email: string, name?: string): Promise<RegisterResponse> => {
    const res = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as RegisterResponse;
  },

  login: async (email: string): Promise<LoginResponse> => {
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as LoginResponse;
  },

  verify: async (token: string): Promise<VerifyResponse> => {
    const res = await api(
      `/auth/verify?token=${encodeURIComponent(token)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as VerifyResponse;
  },

  logout: async (): Promise<LogoutResponse> => {
    const res = await api("/auth/logout", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as LogoutResponse;
  },

  me: async (): Promise<AuthUser | null> => {
    const res = await api("/auth/me");
    if (res.status === 401) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    const u = (data as MeResponse).user;
    if (!u) return null;
    return { ...u, isAdmin: u.isAdmin ?? false };
  },

  updateMe: async (data: { name?: string }): Promise<AuthUser> => {
    const res = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getMessage(json));
    return (json as MeResponse).user;
  },
};
