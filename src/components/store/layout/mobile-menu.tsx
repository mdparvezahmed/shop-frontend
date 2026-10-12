"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Heart, LogIn, Package, Phone, User } from "lucide-react";
import { Sheet } from "@/components/ui/overlay";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useUi } from "@/stores/ui-store";
import type { NavItem, StoreSettings } from "@/types";

/** Phone menu: accordion of menus and sub-menus + quick account links. */
export function MobileMenu({ items, store }: { items: NavItem[]; store: StoreSettings }) {
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.close);
  const { user } = useAuth();

  return (
    <Sheet open={panel === "menu"} onClose={close} side="left" title={store.name}>
      <nav className="px-2 py-2" aria-label="Mobile">
        {items.map((item) => (
          <MenuNode key={item.id} item={item} onNavigate={close} />
        ))}
      </nav>
      <div className="mx-4 my-2 border-t" />
      <div className="space-y-1 px-2 pb-4">
        <QuickLink href={user ? "/account" : "/login"} icon={user ? User : LogIn} onClick={close}>
          {user ? `Hi, ${user.name.split(" ")[0]}` : "Log in / Register"}
        </QuickLink>
        <QuickLink href="/wishlist" icon={Heart} onClick={close}>Wishlist</QuickLink>
        <QuickLink href="/track-order" icon={Package} onClick={close}>Track order</QuickLink>
        <QuickLink href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} icon={Phone} onClick={close}>{store.phone}</QuickLink>
        <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
          <span>Dark mode</span>
          <ThemeToggle />
        </div>
      </div>
    </Sheet>
  );
}

function MenuNode({ item, onNavigate, depth = 0 }: { item: NavItem; onNavigate: () => void; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn("flex-1 rounded-md px-3 py-3 text-sm", depth === 0 ? "font-medium tracking-wide uppercase" : "text-muted-foreground")}
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          {item.name}
        </Link>
        {hasChildren && (
          <button onClick={() => setOpen(!open)} className="rounded-md p-3 hover:bg-muted" aria-label={open ? `Collapse ${item.name}` : `Expand ${item.name}`} aria-expanded={open}>
            <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="mb-1 border-l-2 border-muted" style={{ marginLeft: 12 + depth * 16 }}>
          {item.children.map((child) => (
            <MenuNode key={child.id} item={child} onNavigate={onNavigate} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, icon: Icon, children, onClick }: { href: string; icon: typeof User; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </Link>
  );
}
