"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Page-level failures keep the store header and footer around the message. */
export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
