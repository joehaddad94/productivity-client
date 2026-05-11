"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
            textAlign: "center",
            padding: "32px",
            fontFamily: "sans-serif",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "14px", color: "#666" }}>
            The error has been reported. Try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#000",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
