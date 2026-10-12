"use client";

import useSWR from "swr";
import { api } from "@/lib/api/client";
import { authApi } from "@/services/shop";
import type { User } from "@/types";

/**
 * Current user on the client. Returns null when logged out.
 * Call `refresh()` after login/logout to update every component at once.
 */
export function useAuth() {
  const { data, isLoading, mutate } = useSWR<User | null>(
    "auth:me",
    () => api.get<User>("/auth/me").catch(() => null),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    user: data ?? null,
    isLoading,
    isStaff: !!data && data.role !== "CUSTOMER",
    refresh: () => mutate(),
    setUser: (user: User | null) => mutate(user, { revalidate: false }),
    logout: async () => {
      await authApi.logout().catch(() => {});
      await mutate(null, { revalidate: false });
    },
  };
}
