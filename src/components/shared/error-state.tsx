"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown by error.tsx boundaries when a server render fails (usually the API or
 * database being briefly unavailable). "Try again" re-fetches the segment from the server.
 */
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  // A new error means the retry failed too; let the button be pressed again.
  useEffect(() => {
    console.error(error);
    setRetrying(false);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">We couldn’t load this page right now. Please try again in a moment.</p>
      <div className="mt-6 flex gap-3">
        <Button
          size="lg"
          loading={retrying}
          onClick={() => {
            setRetrying(true);
            retry();
          }}
        >
          Try again
        </Button>
        <Link href="/" className="inline-flex h-12 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted">Go home</Link>
      </div>
    </div>
  );
}
