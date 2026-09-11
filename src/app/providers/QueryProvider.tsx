"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            networkMode: "offlineFirst",
            retry: (failureCount, error) => {
              if (typeof navigator !== "undefined" && !navigator.onLine) return false;
              // The error was ignored entirely, so a 401/403/404 was retried
              // three times before surfacing: three times the latency on every
              // expired session, and three times the dead requests.
              if (error instanceof ApiError && error.isClientError) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
