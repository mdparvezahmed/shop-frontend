import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/misc";
import { cn, formatPrice } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin-operations";

/** Line items with image, size, colour and the order totals underneath. */
export function OrderItemsCard({ order }: { order: AdminOrder }) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const due = Math.max(0, order.total - order.paidAmount);

  return (
    <Card>
      <CardHeader title="Items" description={`${units} item${units === 1 ? "" : "s"} · ${(order.totalWeightGrams / 1000).toFixed(2)} kg`} />
      <ul className="divide-y">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 px-5 py-3">
            <span className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {item.image && <img src={item.image} alt="" className="size-full object-cover" loading="lazy" />}
            </span>
            <div className="min-w-0 flex-1">
              {item.product?.slug ? (
                <Link href={`/products/${item.product.slug}`} target="_blank" className="line-clamp-2 text-sm font-medium hover:underline">
                  {item.name}
                </Link>
              ) : (
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ") || "No options"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">{item.sku}</p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-medium tabular-nums">{formatPrice(item.lineTotal)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-1.5 border-t px-5 py-4 text-sm">
        <Row label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.discount > 0 && (
          <Row
            label={
              <>
                Discount{order.couponCode && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{order.couponCode}</span>}
              </>
            }
            value={`− ${formatPrice(order.discount)}`}
            className="text-success"
          />
        )}
        <Row label={`Delivery (${order.shippingZone})`} value={order.shippingCharge ? formatPrice(order.shippingCharge) : "Free"} />
        {order.codCharge > 0 && <Row label="COD charge" value={formatPrice(order.codCharge)} />}
        <Row label="Total" value={formatPrice(order.total)} className="border-t pt-2 text-base font-semibold" />
        <Row label="Paid" value={formatPrice(order.paidAmount)} className="text-muted-foreground" />
        <Row label="Due" value={formatPrice(due)} className={cn("font-semibold", due > 0 ? "text-warning" : "text-success")} />
      </dl>
    </Card>
  );
}

function Row({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
