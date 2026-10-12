"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ChevronRight, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, Pagination, Skeleton } from "@/components/ui/misc";
import { formatDate, formatPrice } from "@/lib/utils";
import { accountApi } from "@/services/shop";

export function OrderList({ limit }: { limit?: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(["my-orders", page], () => accountApi.orders(page), { keepPreviousData: true });

  if (isLoading && !data) return <Skeleton className="h-40 w-full" />;
  const items = limit ? data?.items.slice(0, limit) : data?.items;

  if (!items?.length) {
    return <EmptyState icon={<Package className="size-6" />} title="No orders yet" description="When you place an order it will show up here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} className="rounded-xl border" />;
  }

  return (
    <div className="space-y-3">
      {items.map((o) => (
        <Link key={o.orderNumber} href={`/account/orders/${o.orderNumber}`} className="flex items-center gap-4 rounded-xl border p-4 transition hover:border-foreground">
          <div className="flex -space-x-3">
            {o.previewItems.slice(0, 3).map((item, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={item.image ?? ""} alt={item.name} className="h-14 w-11 rounded-md border-2 border-background bg-muted object-cover" />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold">#{o.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount > 1 ? "s" : ""}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{formatPrice(o.total)}</p>
            <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "danger" : "info"}>{o.statusLabel}</Badge>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ))}
      {!limit && data && data.meta.totalPages > 1 && (
        <div className="pt-4">
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
