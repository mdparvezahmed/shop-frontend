import Link from "next/link";
import { Check, CircleX, ExternalLink, Package, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/misc";
import { cn, formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import type { CustomerOrder, OrderStatus } from "@/types";

/**
 * Everything a customer sees about one order: progress, timeline, items,
 * totals, address and payment. Used on the tracking page and in the account.
 */
const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Packed" },
  { status: "SHIPPED", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
];

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-sale/30 bg-sale/5 p-4 text-sm">
        {status === "CANCELLED" ? <CircleX className="size-5 text-sale" /> : <RotateCcw className="size-5 text-sale" />}
        <span>This order was <strong>{status === "CANCELLED" ? "cancelled" : "returned"}</strong>.</span>
      </div>
    );
  }
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={cn("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-success" : "bg-border")} />}
            <span className={cn("relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold", done ? "border-success bg-success text-white" : "border-border bg-background text-muted-foreground")}>
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("mt-2 text-[11px] sm:text-xs", done ? "font-medium" : "text-muted-foreground")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetails({ order, actions }: { order: CustomerOrder; actions?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Order</p>
          <h2 className="font-mono text-2xl font-semibold">#{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "info"}>{order.statusLabel}</Badge>
          <Badge tone={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "danger" : "warning"}>
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"} · {PAYMENT_LABEL[order.paymentStatus]}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border p-5"><OrderProgress status={order.status} /></div>

      {order.courier && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <span className="flex items-center gap-2">
            <Package className="size-4" /> Pathao consignment <strong className="font-mono">{order.courier.consignmentId}</strong>
            {order.courier.status && <Badge>{order.courier.status.replace(/[_-]/g, " ")}</Badge>}
          </span>
          <a href={`https://merchant.pathao.com/tracking?consignment_id=${order.courier.consignmentId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
            Track on Pathao <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}

      {actions}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border">
            <h3 className="border-b px-5 py-3 font-sans text-sm font-semibold">Items ({order.items.length})</h3>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    {item.slug ? <Link href={`/products/${item.slug}`} className="font-medium hover:underline">{item.name}</Link> : <p className="font-medium">{item.name}</p>}
                    <p className="text-xs text-muted-foreground">{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="mb-4 font-sans text-sm font-semibold">Order updates</h3>
            <ol className="relative space-y-5 border-l pl-6">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute top-1 -left-[29px] size-3 rounded-full border-2 border-background", i === 0 ? "bg-success" : "bg-border")} />
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
                  <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border p-5 text-sm">
            <h3 className="mb-3 font-sans font-semibold">Payment summary</h3>
            <dl className="space-y-2">
              <Line label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`-${formatPrice(order.discount)}`} />}
              <Line label={`Delivery (${order.shippingZone})`} value={order.shippingCharge ? formatPrice(order.shippingCharge) : "Free"} />
              {order.codCharge > 0 && <Line label="COD charge" value={formatPrice(order.codCharge)} />}
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              {order.paidAmount > 0 && <Line label="Paid" value={formatPrice(order.paidAmount)} />}
              {order.dueAmount > 0 && order.status !== "CANCELLED" && <Line label="To pay on delivery" value={formatPrice(order.dueAmount)} strong />}
            </dl>
          </div>
          <div className="rounded-xl border p-5 text-sm">
            <h3 className="mb-3 font-sans font-semibold">Delivery address</h3>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerPhone}</p>
            <p className="mt-2 text-muted-foreground">{order.addressLine}, {order.area}, {order.district}</p>
            {order.note && <p className="mt-2 text-xs text-muted-foreground">Note: {order.note}</p>}
          </div>
          <p className="text-xs text-muted-foreground">Last updated {formatDate(order.timeline.at(-1)?.createdAt ?? order.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "font-semibold text-foreground")}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
