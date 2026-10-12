"use client";

import { useParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderAdminNoteCard, OrderCustomerCard } from "@/components/admin/operations/order-customer-card";
import { OrderCourierCard } from "@/components/admin/operations/order-courier-card";
import { OrderItemsCard } from "@/components/admin/operations/order-items-card";
import { PaymentMethodBadge } from "@/components/admin/operations/order-badges";
import { OrderPaymentCard } from "@/components/admin/operations/order-payment-card";
import { OrderStatusCard } from "@/components/admin/operations/order-status-card";
import { OrderTimeline } from "@/components/admin/operations/order-timeline";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin-operations";

/** Order detail — items, customer, status, payment, Pathao courier and timeline. */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { data: order, error, mutate } = useSWR<AdminOrder>(`/admin/orders/${id}`);

  /** Every order action returns the fresh order — show it without refetching. */
  const onChange = (next: AdminOrder) => {
    mutate(next, { revalidate: false });
    mutateGlobal("/admin/dashboard/badges");
  };

  if (error && !order) {
    return (
      <>
        <PageHeader title="Order" backHref="/admin/orders" backLabel="All orders" />
        <EmptyState title="Order not found" description={errorMessage(error)} action={<ButtonLink href="/admin/orders" variant="outline">Back to orders</ButtonLink>} />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
          <div className="space-y-6"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/admin/orders"
        backLabel="All orders"
        title={<span className="font-mono">{order.orderNumber}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>Placed {formatDateTime(order.createdAt)}</span>
            <StatusBadge status={order.status} />
            <PaymentMethodBadge method={order.paymentMethod} />
            <StatusBadge status={order.paymentStatus} />
          </span>
        }
        actions={
          <ButtonLink href={`/admin/orders/${order.id}/invoice`} variant="outline">
            <Printer className="size-4" /> Print invoice
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <OrderItemsCard order={order} />
          <OrderTimeline order={order} onChange={onChange} />
        </div>
        <div className="min-w-0 space-y-6">
          <OrderStatusCard order={order} onChange={onChange} />
          <OrderCourierCard order={order} onChange={onChange} />
          <OrderPaymentCard order={order} onChange={onChange} />
          <OrderCustomerCard order={order} onChange={onChange} />
          <OrderAdminNoteCard order={order} onChange={onChange} />
        </div>
      </div>
    </>
  );
}
