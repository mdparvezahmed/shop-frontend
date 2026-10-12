import {
  BadgePercent,
  Boxes,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

/**
 * Admin sidebar. Add a page here and it appears in the menu.
 * `roles` hides the item from roles that cannot use it (the API enforces it too).
 * `badge` is a key of GET /admin/dashboard/badges.
 */
export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  badge?: "pendingOrders" | "pendingReviews" | "unreadMessages";
};

export type AdminNavGroup = { label: string; items: AdminNavItem[] };

const MANAGERS: Role[] = ["ADMIN", "MANAGER"];

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: "pendingOrders" },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Coupons", href: "/admin/coupons", icon: BadgePercent, roles: MANAGERS },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Menus & Categories", href: "/admin/menus", icon: ListTree },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Sizes & Colours", href: "/admin/attributes", icon: Palette },
      { label: "Size Charts", href: "/admin/size-charts", icon: Ruler },
      { label: "Reviews", href: "/admin/reviews", icon: Star, badge: "pendingReviews" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Banners", href: "/admin/banners", icon: ImageIcon, roles: MANAGERS },
      { label: "Pages", href: "/admin/pages", icon: FileText, roles: MANAGERS },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon, roles: MANAGERS },
      { label: "Messages", href: "/admin/messages", icon: MessageSquare, badge: "unreadMessages" },
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail, roles: MANAGERS },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Shipping & Delivery", href: "/admin/shipping", icon: Truck, roles: MANAGERS },
      { label: "Store Settings", href: "/admin/settings", icon: Settings, roles: MANAGERS },
      { label: "Staff & Roles", href: "/admin/staff", icon: ShieldCheck, roles: ["ADMIN"] },
    ],
  },
];
