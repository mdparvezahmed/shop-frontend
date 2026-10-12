"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/lib/api/client";

/** Client-side providers for the whole app (theme, data fetching, toasts). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </SWRConfig>
    </ThemeProvider>
  );
}
