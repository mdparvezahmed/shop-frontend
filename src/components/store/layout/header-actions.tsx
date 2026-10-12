"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-debounce";
import { useWishlist } from "@/hooks/use-wishlist";
import { cartCount, useCart } from "@/stores/cart-store";
import { useUi } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const iconBtn = "relative inline-flex size-10 items-center justify-center rounded-full transition hover:bg-muted";

function CountDot({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function MenuButton() {
  const open = useUi((s) => s.open);
  return (
    <button className={iconBtn} onClick={() => open("menu")} aria-label="Open menu">
      <Menu className="size-5" />
    </button>
  );
}

export function HeaderActions() {
  const mounted = useMounted();
  const open = useUi((s) => s.open);
  const items = useCart((s) => s.items);
  const { user } = useAuth();
  const { ids } = useWishlist();

  return (
    <div className="flex shrink-0 items-center">
      <button className={iconBtn} onClick={() => open("search")} aria-label="Search">
        <Search className="size-5" />
      </button>
      <Link href={user ? "/account" : "/login"} className={cn(iconBtn, "hidden md:inline-flex")} aria-label="Account">
        <User className="size-5" />
      </Link>
      <Link href="/wishlist" className={cn(iconBtn, "hidden md:inline-flex")} aria-label="Wishlist">
        <Heart className="size-5" />
        {mounted && <CountDot count={ids.length} />}
      </Link>
      <ThemeToggle className="hidden md:inline-flex" />
      <button className={iconBtn} onClick={() => open("cart")} aria-label="Open cart">
        <ShoppingBag className="size-5" />
        {mounted && <CountDot count={cartCount(items)} />}
      </button>
    </div>
  );
}
