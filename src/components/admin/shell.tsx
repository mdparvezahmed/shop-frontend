"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import useSWR from "swr";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authApi } from "@/services/shop";
import { cn, initials } from "@/lib/utils";
import type { User } from "@/types";
import { ADMIN_NAV } from "./nav";

type Badges = { pendingOrders: number; pendingReviews: number; unreadMessages: number };

/** Admin layout: sidebar (drawer on mobile) + top bar. */
export function AdminShell({ user, storeName, children }: { user: User; storeName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: badges } = useSWR<Badges>("/admin/dashboard/badges", { refreshInterval: 60_000 });

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const logout = async () => {
    await authApi.logout().catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-[0.14em] uppercase">
          {storeName}
        </Link>
        <button className="rounded-md p-1.5 hover:bg-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {ADMIN_NAV.map((group) => {
          const items = group.items.filter((i) => !i.roles || i.roles.includes(user.role));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const count = item.badge ? badges?.[item.badge] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                          isActive(item.href) ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {!!count && (
                          <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", isActive(item.href) ? "bg-primary-foreground text-primary" : "bg-accent text-accent-foreground")}>
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">{initials(user.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button onClick={logout} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Log out" aria-label="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-[var(--overlay)]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-card shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <button className="-ml-1 rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
            View store <ExternalLink className="size-3.5" />
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
