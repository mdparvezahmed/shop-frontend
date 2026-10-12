import Link from "next/link";
import { Heart, MapPin, Package } from "lucide-react";
import { OrderList } from "@/components/store/account/order-list";

export default function AccountOverviewPage() {
  const cards = [
    { href: "/account/orders", icon: Package, title: "Orders", text: "Track, view or cancel orders" },
    { href: "/account/addresses", icon: MapPin, title: "Addresses", text: "Manage delivery addresses" },
    { href: "/wishlist", icon: Heart, title: "Wishlist", text: "Products you saved" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="rounded-xl border p-5 transition hover:border-foreground">
            <Icon className="size-5" />
            <p className="mt-3 font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
      <div>
        <h2 className="mb-4 font-sans text-lg font-semibold">Recent orders</h2>
        <OrderList limit={3} />
      </div>
    </div>
  );
}
