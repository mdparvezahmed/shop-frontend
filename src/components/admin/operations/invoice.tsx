import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import type { StoreSettings } from "@/types";
import type { AdminOrder } from "@/types/admin-operations";
import { PAYMENT_METHOD_LABEL } from "./helpers";

/**
 * Printable A4 invoice. Uses theme tokens so it reads on screen in dark mode;
 * the page's print stylesheet switches the tokens to light colours on paper.
 */
export function Invoice({ order, store }: { order: AdminOrder; store: StoreSettings | null }) {
  const due = Math.max(0, order.total - order.paidAmount);

  return (
    <article className="mx-auto w-full max-w-3xl rounded-xl border bg-card p-6 text-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <div className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div>
          {store?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt={store.name} className="mb-2 h-10 w-auto object-contain" />
          ) : (
            <p className="font-display text-xl font-semibold tracking-[0.14em] uppercase">{store?.name ?? "Invoice"}</p>
          )}
          {store && (
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {store.address && <p className="max-w-64">{store.address}</p>}
              <p>{[store.phone, store.email].filter(Boolean).join(" · ")}</p>
            </div>
          )}
        </div>
        <div className="sm:text-right print:text-right">
          <p className="text-2xl font-semibold tracking-tight">INVOICE</p>
          <Barcode value={order.orderNumber} className="mt-2 h-10 sm:ml-auto print:ml-auto" />
          <p className="mt-1 font-mono text-xs tracking-[0.3em]">{order.orderNumber}</p>
          <p className="mt-2 text-xs text-muted-foreground">Date: {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <section className="grid gap-6 border-b py-6 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Deliver to</p>
          <p className="font-medium">{order.customerName}</p>
          <p>{order.customerPhone}</p>
          {order.customerEmail && <p>{order.customerEmail}</p>}
          <p className="mt-1">
            {order.addressLine}, {order.area}, {order.district}
          </p>
        </div>
        <div className="sm:text-right print:text-right">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Payment</p>
          <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
          <p>
            Status: <span className="font-medium">{order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}</span>
          </p>
          {order.consignmentId && <p className="mt-1">Pathao: <span className="font-mono">{order.consignmentId}</span></p>}
          <p className="mt-1 text-xs text-muted-foreground">Printed {formatDateTime(new Date())}</p>
        </div>
      </section>

      <table className="mt-6 w-full">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground uppercase">
            <th className="py-2 pr-2 font-medium">Item</th>
            <th className="px-2 py-2 text-center font-medium">Qty</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="py-2 pl-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {order.items.map((i) => (
            <tr key={i.id} className="align-top">
              <td className="py-2.5 pr-2">
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[i.size && `Size ${i.size}`, i.color, i.sku].filter(Boolean).join(" · ")}
                </p>
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">{i.quantity}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{formatPrice(i.unitPrice)}</td>
              <td className="py-2.5 pl-2 text-right tabular-nums">{formatPrice(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto w-full max-w-72 space-y-1.5 border-t pt-4">
        <Line label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${formatPrice(order.discount)}`} />}
        <Line label="Delivery" value={order.shippingCharge ? formatPrice(order.shippingCharge) : "Free"} />
        {order.codCharge > 0 && <Line label="COD charge" value={formatPrice(order.codCharge)} />}
        <Line label="Total" value={formatPrice(order.total)} strong />
        <Line label="Paid" value={formatPrice(order.paidAmount)} />
        <Line label={order.paymentMethod === "COD" ? "Collect on delivery" : "Due"} value={formatPrice(due)} strong />
      </dl>

      {order.note && (
        <p className="mt-6 rounded-md border px-3 py-2 text-xs">
          <span className="font-semibold">Customer note:</span> {order.note}
        </p>
      )}

      <p className="mt-10 border-t pt-4 text-center text-xs text-muted-foreground">
        Thank you for shopping with {store?.name ?? "us"}! Please check your parcel in front of the delivery person.
      </p>
    </article>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 text-base font-semibold" : "flex justify-between gap-4"}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Code 39 patterns: n = narrow, w = wide; bars and gaps alternate starting with a bar. */
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn",
  "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw",
  C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn",
  I: "nnwnnwwnn", J: "nnnnwwwnn", K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww",
  O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
};

/** Code 39 barcode of the order number, drawn as SVG (scannable by most warehouse scanners). */
function Barcode({ value, className }: { value: string; className?: string }) {
  const chars = `*${value.toUpperCase().replace(/[^0-9A-Z. -]/g, "")}*`.split("");
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  chars.forEach((ch) => {
    [...CODE39[ch]].forEach((el, i) => {
      const w = el === "w" ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    });
    x += 1; // gap between characters
  });

  return (
    <svg viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" className={className} style={{ width: x * 1.4, maxWidth: "100%" }} role="img" aria-label={`Barcode ${value}`}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}
