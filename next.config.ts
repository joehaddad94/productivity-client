import type { NextConfig } from "next";

/**
 * Reverse-proxy target for the NestJS backend.
 *
 * This is a SERVER-ONLY variable (no NEXT_PUBLIC_ prefix) so the backend URL
 * never ends up in the client bundle. It's only read by the Next.js edge when
 * fulfilling the `/api/*` rewrite below.
 *
 * Local dev:  http://localhost:8000
 * Vercel:     set API_PROXY_TARGET to the Railway (or any other) backend URL,
 *             e.g. https://productivity-server-development.up.railway.app
 */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET || "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },

  /**
   * Same-origin API proxy.
   *
   * Safari / WebKit (and Firefox Strict, and eventually Chrome after the
   * third-party-cookie phase-out) block cookies set on cross-site responses,
   * even when the server marks them `SameSite=None; Secure`. Our frontend on
   * `*.vercel.app` and the backend on `*.railway.app` are on different
   * eTLD+1s, so the auth cookie was being dropped on Mac/Safari after the
   * magic-link verify call, bouncing users back to /login.
   *
   * By routing API calls through `/api/*` on the frontend origin, the browser
   * sees the auth cookie as first-party and the flow works across all
   * browsers without any changes to the backend.
   *
   * To use: set NEXT_PUBLIC_API_URL=/api in the client env (Vercel) and
   * API_PROXY_TARGET=<backend origin> in the server env (Vercel).
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
