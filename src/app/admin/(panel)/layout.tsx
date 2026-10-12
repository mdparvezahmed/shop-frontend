import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getCurrentUser, getLayout } from "@/services/storefront.server";
import { STAFF_ROLES } from "@/types";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Every admin page requires a staff account; customers are sent to the admin login. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) redirect("/admin/login");
  const layout = await getLayout().catch(() => null);

  return (
    <AdminShell user={user} storeName={layout?.store.name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
