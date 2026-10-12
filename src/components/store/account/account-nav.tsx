"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile & password", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isStaff } = useAuth();

  return (
    <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition lg:border-0",
              active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      {isStaff && (
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2 text-sm hover:bg-muted lg:border-0">
          <LayoutDashboard className="size-4" /> Admin panel
        </Link>
      )}
      <button
        onClick={async () => {
          await logout();
          router.replace("/");
          router.refresh();
        }}
        className="flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2 text-sm text-sale hover:bg-muted lg:border-0"
      >
        <LogOut className="size-4" /> Log out
      </button>
    </nav>
  );
}
