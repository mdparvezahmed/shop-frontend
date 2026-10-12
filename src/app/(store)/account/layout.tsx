import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/store/account/account-nav";
import { getCurrentUser } from "@/services/storefront.server";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Hello,</p>
        <h1 className="text-3xl font-semibold">{user.name}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
