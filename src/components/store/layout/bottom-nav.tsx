"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/stores/cart-store";
import { useUi } from "@/stores/ui-store";

/** App-style tab bar on phones (hidden on large screens and on checkout). */
export function BottomNav() {
  const pathname = usePathname();
  const open = useUi((s) => s.open);
  const items = useCart((s) => s.items);
  const mounted = useMounted();
  const { user } = useAuth();
  const count = mounted ? cartCount(items) : 0;

  if (pathname.startsWith("/checkout") || pathname.startsWith("/products/")) return null;

  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium tracking-wide";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick navigation">
      <Link href="/" className={cn(item, active("/") ? "text-foreground" : "text-muted-foreground")}>
        <Home className="size-5" /> Home
      </Link>
      <button onClick={() => open("menu")} className={cn(item, "text-muted-foreground")}>
        <LayoutGrid className="size-5" /> Categories
      </button>
      <button onClick={() => open("search")} className={cn(item, "text-muted-foreground")}>
        <Search className="size-5" /> Search
      </button>
      <button onClick={() => open("cart")} className={cn(item, "relative text-muted-foreground")}>
        <span className="relative">
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </span>
        Cart
      </button>
      <Link href={user ? "/account" : "/login"} className={cn(item, active("/account") || active("/login") ? "text-foreground" : "text-muted-foreground")}>
        <User className="size-5" /> Account
      </Link>
    </nav>
  );
}
