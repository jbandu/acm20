"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "./globals.css";

// Conditionally import devtools only in development
let ReactQueryDevtools: any = null;
if (process.env.NODE_ENV === "development") {
  try {
    ReactQueryDevtools = require("@tanstack/react-query-devtools").ReactQueryDevtools;
  } catch {
    // Devtools not available, continue without them
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </body>
    </html>
  );
}
