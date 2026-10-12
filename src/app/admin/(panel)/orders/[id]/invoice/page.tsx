"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Invoice } from "@/components/admin/operations/invoice";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/client";
import type { StoreSettings } from "@/types";
import type { AdminOrder } from "@/types/admin-operations";

/**
 * When printing: hide the admin sidebar/top bar, drop the page padding and
 * switch the theme tokens to light colours so dark mode prints on white paper.
 */
const PRINT_CSS = `
@page { size: A4; margin: 14mm; }
@media print {
  aside, header, [data-sonner-toaster], .invoice-toolbar { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  .lg\\:pl-64 { padding-left: 0 !important; }
  html, html.dark {
    --background: #ffffff; --foreground: #111111; --card: #ffffff; --muted: #f5f4f2;
    --muted-foreground: #555555; --border: #dddddd; color-scheme: light;
  }
  body, body > div { background: #ffffff !important; color: #111111; }
}`;

/** Printable invoice for one order. Store details come from the public settings. */
export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, error } = useSWR<AdminOrder>(`/admin/orders/${id}`);
  const { data: settings } = useSWR<{ store: StoreSettings }>("/settings/public");

  return (
    <div className="invoice-root">
      <style>{PRINT_CSS}</style>
      <div className="invoice-toolbar">
        <PageHeader
          title="Invoice"
          backHref={`/admin/orders/${id}`}
          backLabel="Back to order"
          description={order ? `Order ${order.orderNumber}` : undefined}
          actions={
            <Button onClick={() => window.print()} disabled={!order}>
              <Printer className="size-4" /> Print
            </Button>
          }
        />
      </div>

      {error && !order ? (
        <EmptyState title="Order not found" description={errorMessage(error)} />
      ) : order ? (
        <Invoice order={order} store={settings?.store ?? null} />
      ) : (
        <Skeleton className="mx-auto h-[640px] w-full max-w-3xl rounded-xl" />
      )}
    </div>
  );
}
