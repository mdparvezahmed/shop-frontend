"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Ban, Mail, MapPin, Phone, Receipt, ShoppingBag, UserCheck, Wallet } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { isForbidden, whatsappLink } from "@/components/admin/operations/helpers";
import { WhatsappIcon } from "@/components/shared/social-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Card, CardHeader, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate, formatDateTime, formatPrice, initials } from "@/lib/utils";
import type { CustomerDetail } from "@/types/admin-operations";

type CustomerOrder = CustomerDetail["orders"][number];

/** Customer profile — stats, saved addresses, recent orders, block/unblock. */
export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, error, mutate } = useSWR<CustomerDetail>(`/admin/customers/${id}`);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleBlock = async () => {
    if (!customer) return;
    const status = customer.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    setBusy(true);
    try {
      await api.post(`/admin/customers/${customer.id}/status`, { status });
      await mutate({ ...customer, status }, { revalidate: false });
      toast.success(status === "BLOCKED" ? "Customer blocked" : "Customer unblocked");
      setConfirming(false);
    } catch (e) {
      toast.error(isForbidden(e) ? "Only a manager or the owner can block customers." : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !customer) {
    return (
      <>
        <PageHeader title="Customer" backHref="/admin/customers" backLabel="All customers" />
        <EmptyState title="Customer not found" description={errorMessage(error)} />
      </>
    );
  }
  if (!customer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const blocked = customer.status === "BLOCKED";
  const wa = whatsappLink(customer.phone);
  const average = customer.stats.orders ? Math.round(customer.stats.totalSpent / customer.stats.orders) : 0;

  const columns: Column<CustomerOrder>[] = [
    { key: "no", header: "Order", cell: (o) => <span className="font-mono text-xs font-semibold">{o.orderNumber}</span> },
    { key: "date", header: "Date", cell: (o) => <span className="whitespace-nowrap">{formatDateTime(o.createdAt)}</span>, hideOnMobile: true },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "payment", header: "Payment", cell: (o) => <StatusBadge status={o.paymentStatus} />, hideOnMobile: true },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-medium tabular-nums">{formatPrice(o.total)}</span> },
  ];

  return (
    <>
      <PageHeader
        backHref="/admin/customers"
        backLabel="All customers"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-base font-semibold">{initials(customer.name)}</span>
            {customer.name}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            Customer since {formatDate(customer.createdAt)}
            <StatusBadge status={customer.status} />
          </span>
        }
        actions={
          <Button variant={blocked ? "outline" : "danger"} onClick={() => setConfirming(true)}>
            {blocked ? <UserCheck className="size-4" /> : <Ban className="size-4" />}
            {blocked ? "Unblock" : "Block customer"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Orders" value={customer.stats.orders} icon={<ShoppingBag className="size-4" />} hint="Excluding cancelled & returned" />
        <StatCard label="Total spent" value={formatPrice(customer.stats.totalSpent)} icon={<Wallet className="size-4" />} hint="Lifetime value" />
        <StatCard label="Average order" value={formatPrice(average)} icon={<Receipt className="size-4" />} hint={customer.lastLoginAt ? `Last login ${formatDate(customer.lastLoginAt)}` : "Never logged in"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <h2 className="mb-3 text-base font-semibold">Recent orders</h2>
          <DataTable
            rows={customer.orders}
            columns={columns}
            onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
            empty={{ title: "No orders yet", description: "This customer has not placed an order." }}
          />
          {customer.orders.length >= 20 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the latest 20.{" "}
              {customer.phone && (
                <ButtonLink href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`} variant="link" size="sm" className="text-xs">
                  Search orders by {customer.phone}
                </ButtonLink>
              )}
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Contact" />
            <div className="space-y-2 px-5 py-4 text-sm">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:underline">
                  <Phone className="size-4 text-muted-foreground" /> {customer.phone}
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                  <WhatsappIcon className="size-4 text-success" /> WhatsApp
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 break-all hover:underline">
                  <Mail className="size-4 shrink-0 text-muted-foreground" /> {customer.email}
                </a>
              )}
              {!customer.phone && !customer.email && <p className="text-muted-foreground">No contact details.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Saved addresses" />
            {customer.addresses.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              <ul className="divide-y">
                {customer.addresses.map((a) => (
                  <li key={a.id} className="flex gap-2 px-5 py-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {a.label} {a.isDefault && <Badge tone="dark">Default</Badge>}
                      </p>
                      <p className="text-muted-foreground">{a.name} · {a.phone}</p>
                      <p>{a.addressLine}, {a.area}, {a.district}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggleBlock}
        loading={busy}
        tone={blocked ? "primary" : "danger"}
        confirmText={blocked ? "Unblock" : "Block"}
        title={blocked ? `Unblock ${customer.name}?` : `Block ${customer.name}?`}
        message={
          blocked
            ? "They will be able to log in and place orders again."
            : "They are logged out immediately and cannot log in until you unblock them. Existing orders are not affected."
        }
      />
    </>
  );
}
