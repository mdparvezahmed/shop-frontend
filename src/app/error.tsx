"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Catches failures in the store and admin layouts (e.g. the API being unreachable). */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
